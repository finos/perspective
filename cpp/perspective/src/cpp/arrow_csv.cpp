/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/base.h>
#include <perspective/arrow_csv.h>
#include <arrow/util/value_parsing.h>
#include <arrow/io/memory.h>

#ifdef PSP_ENABLE_WASM
// This causes build warnings
// https://github.com/emscripten-core/emscripten/issues/8574
#include <perspective/vendor/arrow_single_threaded_reader.h>
#else
#include <arrow/csv/reader.h>
#endif

template <class TimePoint>
static inline arrow::TimestampType::c_type
ConvertTimePoint(TimePoint tp, arrow::TimeUnit::type unit) {
    auto duration = tp.time_since_epoch();
    switch (unit) {
        case arrow::TimeUnit::SECOND:
            return std::chrono::duration_cast<std::chrono::seconds>(duration)
                .count();
        case arrow::TimeUnit::MILLI:
            return std::chrono::duration_cast<std::chrono::milliseconds>(
                duration)
                .count();
        case arrow::TimeUnit::MICRO:
            return std::chrono::duration_cast<std::chrono::microseconds>(
                duration)
                .count();
        case arrow::TimeUnit::NANO:
            return std::chrono::duration_cast<std::chrono::nanoseconds>(
                duration)
                .count();
        default:
            // Compiler errors without default case even though all enum cases
            // are handled
            assert(0);
            return 0;
    }
}

static inline bool
ParseYYYY_MM_DD(const char* s, arrow_vendored::date::year_month_day* out) {
    uint16_t year = 0;
    uint8_t month = 0;
    uint8_t day = 0;
    if (ARROW_PREDICT_FALSE(s[4] != '-') || ARROW_PREDICT_FALSE(s[7] != '-')) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 0, 4, &year))) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(
            !arrow::internal::ParseUnsigned(s + 5, 2, &month))) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 8, 2, &day))) {
        return false;
    }
    *out = {arrow_vendored::date::year{year},
        arrow_vendored::date::month{month}, arrow_vendored::date::day{day}};
    return out->ok();
}

namespace perspective {
namespace apachearrow {

    class UnixTimestampParser : public arrow::TimestampParser {
    public:
        bool
        operator()(const char* s, size_t length, arrow::TimeUnit::type out_unit,
            int64_t* out,
            bool* out_zone_offset_present = NULLPTR) const override {
            size_t endptr;
            std::string val(s, s + length);
            int64_t value
                = std::stoll(static_cast<std::string>(val), &endptr, 10);
            if (endptr != length) {
                return false;
            } else {
                (*out) = value;
                return true;
            }
        }

        const char*
        kind() const override {
            return "unixtimestamp";
        }
    };

    static inline bool
    ParseSSS(const char* s, std::chrono::milliseconds* out) {
        uint16_t millis = 0;
        if (ARROW_PREDICT_FALSE(s[0] != '.')) {
            return false;
        }
        if (ARROW_PREDICT_FALSE(
                !arrow::internal::ParseUnsigned(s + 1, 3, &millis))) {
            return false;
        }

        if (ARROW_PREDICT_FALSE(millis >= 999)) {
            return false;
        }
        *out = std::chrono::milliseconds(millis);
        return true;
    }

    static inline bool
    ParseTZ(const char* s, std::chrono::hours* out) {
        uint8_t hours = 0;

        if (ARROW_PREDICT_FALSE(s[0] != '+')
            && ARROW_PREDICT_FALSE(s[0] != '-')) {
            return false;
        }
        if (ARROW_PREDICT_FALSE(
                !arrow::internal::ParseUnsigned(s + 1, 2, &hours))) {
            return false;
        }

        if (ARROW_PREDICT_FALSE(hours >= 12)) {
            return false;
        }
        if (s[0] == '-') {
            hours = -hours;
        }
        *out = std::chrono::hours(hours);
        return true;
    }

    class CustomISO8601Parser : public arrow::TimestampParser {
    public:
        bool
        operator()(const char* s, size_t length, arrow::TimeUnit::type unit,
            int64_t* out,
            bool* out_zone_offset_present = NULLPTR) const override {

            if (!arrow::internal::ParseTimestampISO8601(s, length, unit, out)) {
                if (s[length - 1] == 'Z') {
                    --length;
                }
                if (length == 23) {
                    // "YYYY-MM-DD[ T]hh:mm:ss.sss"
                    arrow_vendored::date::year_month_day ymd;
                    if (ARROW_PREDICT_FALSE(!ParseYYYY_MM_DD(s, &ymd))) {
                        return false;
                    }
                    std::chrono::seconds seconds;
                    if (ARROW_PREDICT_FALSE(
                            !arrow::internal::detail::ParseHH_MM_SS(
                                s + 11, &seconds))) {
                        return false;
                    }
                    std::chrono::milliseconds millis;
                    if (ARROW_PREDICT_FALSE(!ParseSSS(s + 19, &millis))) {
                        return false;
                    }

                    *out = ConvertTimePoint(
                        arrow_vendored::date::sys_days(ymd) + seconds + millis,
                        unit);
                    return true;
                } else if (length == 25) {
                    // "2008-09-15[ T]15:53:00+05:00"
                    arrow_vendored::date::year_month_day ymd;
                    if (ARROW_PREDICT_FALSE(!ParseYYYY_MM_DD(s, &ymd))) {
                        return false;
                    }
                    std::chrono::seconds seconds;
                    if (ARROW_PREDICT_FALSE(
                            !arrow::internal::detail::ParseHH_MM_SS(
                                s + 11, &seconds))) {
                        return false;
                    }
                    std::chrono::hours tz;
                    if (ARROW_PREDICT_FALSE(!ParseTZ(s + 19, &tz))) {
                        return false;
                    }

                    *out = ConvertTimePoint(
                        arrow_vendored::date::sys_days(ymd) + tz + seconds,
                        unit);
                    return true;
                }
                return false;
            }
            return true;
        }

        const char*
        kind() const override {
            return "custom_ISO8601";
        }
    };

    std::vector<std::shared_ptr<arrow::TimestampParser>> DATE_PARSERS{
        std::make_shared<CustomISO8601Parser>(),
        arrow::TimestampParser::MakeStrptime("%Y-%m-%d\\D%H:%M:%S.%f"),
        arrow::TimestampParser::MakeStrptime(
            "%m/%d/%Y, %I:%M:%S %p"), // US locale string
        arrow::TimestampParser::MakeStrptime("%m-%d-%Y"),
        arrow::TimestampParser::MakeStrptime("%m/%d/%Y"),
        arrow::TimestampParser::MakeStrptime("%d %m %Y"),
        // TODO: time type column
        arrow::TimestampParser::MakeStrptime("%H:%M:%S.%f")};

    std::vector<std::shared_ptr<arrow::TimestampParser>> DATE_READERS{
        std::make_shared<UnixTimestampParser>(),
        std::make_shared<CustomISO8601Parser>(),
        arrow::TimestampParser::MakeStrptime("%Y-%m-%d\\D%H:%M:%S.%f"),
        arrow::TimestampParser::MakeStrptime(
            "%m/%d/%Y, %I:%M:%S %p"), // US locale string
        arrow::TimestampParser::MakeStrptime("%m-%d-%Y"),
        arrow::TimestampParser::MakeStrptime("%m/%d/%Y"),
        arrow::TimestampParser::MakeStrptime("%d %m %Y"),
        arrow::TimestampParser::MakeStrptime("%H:%M:%S.%f")};

    int64_t
    parseAsArrowTimestamp(const std::string& input) {
        for (auto candidate : DATE_PARSERS) {
            int64_t datetime;
            if (candidate->operator()(input.c_str(), input.size(),
                    arrow::TimeUnit::MILLI, &datetime)) {
                return datetime;
            }
        }
        return -1;
    }

    std::shared_ptr<::arrow::Table>
    csvToTable(std::string& csv, bool is_update,
        std::unordered_map<std::string, std::shared_ptr<arrow::DataType>>&
            schema) {
        arrow::io::IOContext io_context = arrow::io::default_io_context();
        auto input = std::make_shared<arrow::io::BufferReader>(csv);
        auto read_options = arrow::csv::ReadOptions::Defaults();
        auto parse_options = arrow::csv::ParseOptions::Defaults();
        auto convert_options = arrow::csv::ConvertOptions::Defaults();

        read_options.use_threads = false;
        parse_options.newlines_in_values = true;

        if (is_update) {
            convert_options.column_types = std::move(schema);
            convert_options.timestamp_parsers = DATE_READERS;
        } else {
            convert_options.timestamp_parsers = DATE_PARSERS;
        }

        auto maybe_reader = arrow::csv::TableReader::Make(
            io_context, input, read_options, parse_options, convert_options);

        std::shared_ptr<arrow::csv::TableReader> reader = *maybe_reader;

        auto maybe_table = reader->Read();
        if (!maybe_table.ok()) {
            PSP_COMPLAIN_AND_ABORT(maybe_table.status().ToString());
        }
        return *maybe_table;
    }

} // namespace apachearrow
} // namespace perspective