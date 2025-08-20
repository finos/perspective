// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

#include <chrono>
#include <perspective/base.h>
#include <perspective/arrow_csv.h>
#include <arrow/util/value_parsing.h>
#include <arrow/io/memory.h>
#include <arrow/csv/reader.h>

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
                       duration
            )
                .count();
        case arrow::TimeUnit::MICRO:
            return std::chrono::duration_cast<std::chrono::microseconds>(
                       duration
            )
                .count();
        case arrow::TimeUnit::NANO:
            return std::chrono::duration_cast<std::chrono::nanoseconds>(duration
            )
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
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 5, 2, &month)
        )) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 8, 2, &day))) {
        return false;
    }
    *out = {
        arrow_vendored::date::year{year},
        arrow_vendored::date::month{month},
        arrow_vendored::date::day{day}
    };
    return out->ok();
}

static inline bool
ParseYYYY_DD_MM(const char* s, arrow_vendored::date::year_month_day* out) {
    uint16_t year = 0;
    uint8_t month = 0;
    uint8_t day = 0;
    if (ARROW_PREDICT_FALSE(s[2] != '/') || ARROW_PREDICT_FALSE(s[5] != '/')) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 6, 4, &year))) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 0, 2, &month)
        )) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 3, 2, &day))) {
        return false;
    }
    *out = {
        arrow_vendored::date::year{year},
        arrow_vendored::date::month{month},
        arrow_vendored::date::day{day}
    };
    return out->ok();
}

static inline bool
ParseYYYY_D_M(const char* s, arrow_vendored::date::year_month_day* out) {
    uint16_t year = 0;
    uint8_t month = 0;
    uint8_t day = 0;

    if (ARROW_PREDICT_FALSE(s[1] != '/') || ARROW_PREDICT_FALSE(s[3] != '/')) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 4, 4, &year))) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 0, 1, &month)
        )) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 2, 1, &day))) {
        return false;
    }
    *out = {
        arrow_vendored::date::year{year},
        arrow_vendored::date::month{month},
        arrow_vendored::date::day{day}
    };
    return out->ok();
}

static inline std::string
extract_string(const char* ch, int start_idx, int number_of_chars) {
    std::string out;
    for (int i = start_idx; i < start_idx + number_of_chars; i++) {
        out += ch[i];
    }
    return out;
}

static inline bool
ParseAM_PM(const char* s, std::chrono::seconds& seconds, int length) {
    int hour = 0;
    int twelve_hours = 12;
    std::string am_pm;
    std::string hour_string;

    if (length == 21) {
        am_pm = extract_string(s, 19, 2);
        hour_string = extract_string(s, 10, 2);
        hour = atoi(hour_string.c_str());
        if (hour == 0) {
            return false;
        }
    } else if (length == 23) {
        am_pm = extract_string(s, 21, 2);
        hour_string = extract_string(s, 12, 2);
        hour = atoi(hour_string.c_str());
        if (hour == 0) {
            return false;
        }
    }

    if ((am_pm == "PM" || am_pm == "pm") && (hour < twelve_hours)) {
        std::chrono::hours hours_obj(twelve_hours);
        seconds = std::chrono::duration_cast<std::chrono::seconds>(hours_obj);
    } else if ((am_pm == "AM" || am_pm == "am") && (hour == twelve_hours)) {
        std::chrono::hours hours_obj(twelve_hours);
        seconds =
            std::chrono::duration_cast<std::chrono::seconds>(hours_obj) * -1;
    }
    return true;
}

namespace perspective::apachearrow {

class UnixTimestampParser : public arrow::TimestampParser {
public:
    bool
    operator()(
        const char* s,
        size_t length,
        arrow::TimeUnit::type out_unit,
        int64_t* out,
        bool* out_zone_offset_present = NULLPTR
    ) const override {
        size_t endptr;
        std::string val(s, s + length);
        int64_t value = std::stoll(static_cast<std::string>(val), &endptr, 10);
        if (endptr != length) {
            return false;
        }
        (*out) = value;
        return true;
    }

    [[nodiscard]]
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
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 1, 3, &millis)
        )) {
        return false;
    }

    if (ARROW_PREDICT_FALSE(millis >= 999)) {
        return false;
    }
    *out = std::chrono::milliseconds(millis);
    return true;
}

static inline bool
ParseSSSSSS(const char* s, std::chrono::microseconds* out) {
    uint32_t nanos = 0;
    if (ARROW_PREDICT_FALSE(s[0] != '.')) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 1, 6, &nanos)
        )) {
        return false;
    }

    if (ARROW_PREDICT_FALSE(nanos >= 999999)) {
        return false;
    }
    *out = std::chrono::microseconds(nanos);
    return true;
}

static inline bool
ParseSSSSSSSSS(const char* s, std::chrono::nanoseconds* out) {
    uint32_t nanos = 0;
    if (ARROW_PREDICT_FALSE(s[0] != '.')) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 1, 9, &nanos)
        )) {
        return false;
    }

    if (ARROW_PREDICT_FALSE(nanos >= 999999999)) {
        return false;
    }
    *out = std::chrono::nanoseconds(nanos);
    return true;
}

static inline bool
ParseTZ(const char* s, std::chrono::minutes* out) {
    uint8_t hours = 0;
    uint8_t minutes = 0;
    if ((ARROW_PREDICT_FALSE(s[0] != '+') && ARROW_PREDICT_FALSE(s[0] != '-'))
        || ARROW_PREDICT_FALSE(s[3] != ':')) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 1, 2, &hours)
        )) {
        return false;
    }
    if (ARROW_PREDICT_FALSE(!arrow::internal::ParseUnsigned(s + 4, 2, &minutes)
        )) {
        return false;
    }

    if (ARROW_PREDICT_FALSE(hours >= 12)
        || ARROW_PREDICT_FALSE(minutes >= 59)) {
        return false;
    }
    int32_t total = hours * 60 + minutes;
    if (s[0] == '+') {
        total = -total;
    }
    *out = std::chrono::minutes(total);
    return true;
}

class CustomISO8601Parser : public arrow::TimestampParser {
public:
    bool
    operator()(
        const char* s,
        size_t length,
        arrow::TimeUnit::type unit,
        int64_t* out,
        bool* out_zone_offset_present = NULLPTR
    ) const override {
        // if we are trying to parse this with seconds, fail
        // and it will try to parse this again but as
        // nanoseconds :) then it wont truncate the fractional bits.
        if (unit == arrow::TimeUnit::SECOND) {
            return false;
        }

        if (!arrow::internal::ParseTimestampISO8601(s, length, unit, out)) {
            if (s[length - 1] == 'Z') {
                --length;
            }
            if (length == 23) {
                // "YYYY-MM-DD[ T]hh:mm:ss.sss" -- millis

                arrow_vendored::date::year_month_day ymd;
                if (ARROW_PREDICT_FALSE(!ParseYYYY_MM_DD(s, &ymd))) {
                    return false;
                }
                std::chrono::seconds seconds;
                if (ARROW_PREDICT_FALSE(!arrow::internal::detail::ParseHH_MM_SS(
                        s + 11, &seconds
                    ))) {
                    return false;
                }
                std::chrono::milliseconds millis;
                if (ARROW_PREDICT_FALSE(!ParseSSS(s + 19, &millis))) {
                    return false;
                }

                *out = ConvertTimePoint(
                    arrow_vendored::date::sys_days(ymd) + seconds + millis, unit
                );
                return true;
            }

            if (length == 25) {
                // "2008-09-15[ T]15:53:00+05:00" -- seconds with TZ
                arrow_vendored::date::year_month_day ymd;
                if (ARROW_PREDICT_FALSE(!ParseYYYY_MM_DD(s, &ymd))) {
                    return false;
                }
                std::chrono::seconds seconds;
                if (ARROW_PREDICT_FALSE(!arrow::internal::detail::ParseHH_MM_SS(
                        s + 11, &seconds
                    ))) {
                    return false;
                }
                std::chrono::minutes tz;
                if (ARROW_PREDICT_FALSE(!ParseTZ(s + 19, &tz))) {
                    return false;
                }

                *out = ConvertTimePoint(
                    arrow_vendored::date::sys_days(ymd) + tz + seconds, unit
                );
                return true;
            }
            if (length == 26) {
                // YYYY-MM-DD[ T]hh:mm:ss.ssssss  -- micros

                arrow_vendored::date::year_month_day ymd;
                if (ARROW_PREDICT_FALSE(!ParseYYYY_MM_DD(s, &ymd))) {
                    return false;
                }
                std::chrono::seconds seconds;
                if (ARROW_PREDICT_FALSE(!arrow::internal::detail::ParseHH_MM_SS(
                        s + 11, &seconds
                    ))) {
                    return false;
                }
                std::chrono::microseconds micros;
                if (ARROW_PREDICT_FALSE(!ParseSSSSSS(s + 19, &micros))) {
                    return false;
                }
                // round the micros into millis as Perspective does not support
                // nano precision.
                auto millis =
                    std::chrono::duration_cast<std::chrono::milliseconds>(micros
                    );
                *out = ConvertTimePoint(
                    arrow_vendored::date::sys_days(ymd) + seconds + millis, unit
                );

                return true;
            }

            if (length == 29) {
                // YYYY-MM-DD[ T]hh:mm:ss.sssssssss  -- nanos
                // arrow handles YYYY-MM-DD[ T]hh:mm:ss.sss[+-]HH:MM
                arrow_vendored::date::year_month_day ymd;
                if (ARROW_PREDICT_FALSE(!ParseYYYY_MM_DD(s, &ymd))) {
                    return false;
                }
                std::chrono::seconds seconds;
                if (ARROW_PREDICT_FALSE(!arrow::internal::detail::ParseHH_MM_SS(
                        s + 11, &seconds
                    ))) {
                    return false;
                }
                // we can now be at sss[+-]HH:MM  -- millis and TZ
                // or sssssssss -- nanos
                std::chrono::nanoseconds nanos;
                if (ARROW_PREDICT_FALSE(!ParseSSSSSSSSS(s + 19, &nanos))) {
                    return false;
                }
                // Truncate the nanos into millis as Perspective does not
                // support nano precision.
                auto millis =
                    std::chrono::duration_cast<std::chrono::milliseconds>(nanos
                    );

                *out = ConvertTimePoint(
                    arrow_vendored::date::sys_days(ymd) + seconds + millis, unit
                );

                return true;
            }
            if (length == 32) {
                // YYYY-MM-DD[ T]hh:mm:ss.ssssss[+-]HH:MM  -- micros with TZ

                arrow_vendored::date::year_month_day ymd;
                if (ARROW_PREDICT_FALSE(!ParseYYYY_MM_DD(s, &ymd))) {
                    return false;
                }
                std::chrono::seconds seconds;
                if (ARROW_PREDICT_FALSE(!arrow::internal::detail::ParseHH_MM_SS(
                        s + 11, &seconds
                    ))) {
                    return false;
                }
                std::chrono::microseconds micros;
                if (ARROW_PREDICT_FALSE(!ParseSSSSSS(s + 19, &micros))) {
                    return false;
                }
                // round the micros into millis as Perspective does not support
                // nano precision.
                auto millis =
                    std::chrono::duration_cast<std::chrono::milliseconds>(micros
                    );

                std::chrono::minutes tz;
                if (ARROW_PREDICT_FALSE(!ParseTZ(s + 26, &tz))) {
                    return false;
                }
                *out = ConvertTimePoint(
                    arrow_vendored::date::sys_days(ymd) + seconds + millis + tz,
                    unit
                );

                return true;
            }

            if (length == 35) {
                // YYYY-MM-DD[ T]hh:mm:ss.sssssssss[+-]HH:MM -- nanos with TZ

                arrow_vendored::date::year_month_day ymd;
                if (ARROW_PREDICT_FALSE(!ParseYYYY_MM_DD(s, &ymd))) {
                    return false;
                }
                std::chrono::seconds seconds;
                if (ARROW_PREDICT_FALSE(!arrow::internal::detail::ParseHH_MM_SS(
                        s + 11, &seconds
                    ))) {
                    return false;
                }
                std::chrono::nanoseconds nanos;
                if (ARROW_PREDICT_FALSE(!ParseSSSSSSSSS(s + 19, &nanos))) {
                    return false;
                }
                // round the nanos into millis as Perspective does not support
                // nano precision.
                auto millis =
                    std::chrono::duration_cast<std::chrono::milliseconds>(nanos
                    );

                std::chrono::minutes tz;
                if (ARROW_PREDICT_FALSE(!ParseTZ(s + 29, &tz))) {
                    return false;
                }

                *out = ConvertTimePoint(
                    arrow_vendored::date::sys_days(ymd) + seconds + millis + tz,
                    unit
                );

                return true;
            }
            return false;
        }
        return true;
    }

    [[nodiscard]]
    const char*
    kind() const override {
        return "custom_ISO8601";
    }
};

class USTimestampParser : public arrow::TimestampParser {
public:
    bool
    operator()(
        const char* s,
        size_t length,
        arrow::TimeUnit::type unit,
        int64_t* out,
        bool* out_zone_offset_present = NULLPTR
    ) const override {

        if (!arrow::internal::ParseTimestampISO8601(s, length, unit, out)) {
            if (length == 23) {
                arrow_vendored::date::year_month_day ymd;
                if (ARROW_PREDICT_FALSE(!ParseYYYY_DD_MM(s, &ymd))) {
                    return false;
                }
                std::chrono::seconds seconds;
                if (ARROW_PREDICT_FALSE(!arrow::internal::detail::ParseHH_MM_SS(
                        s + 12, &seconds
                    ))) {
                    return false;
                }

                std::chrono::seconds am_pm(0);
                if (ARROW_PREDICT_FALSE(!ParseAM_PM(s, am_pm, 23))) {
                    return false;
                }

                *out = ConvertTimePoint(
                    arrow_vendored::date::sys_days(ymd) + seconds + am_pm, unit
                );
                return true;
            }
            if (length == 21) {
                arrow_vendored::date::year_month_day ymd;
                if (ARROW_PREDICT_FALSE(!ParseYYYY_D_M(s, &ymd))) {
                    return false;
                }
                std::chrono::seconds seconds;
                if (ARROW_PREDICT_FALSE(!arrow::internal::detail::ParseHH_MM_SS(
                        s + 10, &seconds
                    ))) {
                    return false;
                }

                std::chrono::seconds am_pm(0);
                if (ARROW_PREDICT_FALSE(!ParseAM_PM(s, am_pm, 21))) {
                    return false;
                }

                *out = ConvertTimePoint(
                    arrow_vendored::date::sys_days(ymd) + seconds + am_pm, unit
                );
                return true;
            }
            return false;
        }
        return true;
    }

    [[nodiscard]]
    const char*
    kind() const override {
        return "USTimestampParser";
    }
};

std::vector<std::shared_ptr<arrow::TimestampParser>> DATE_PARSERS{
    std::make_shared<CustomISO8601Parser>(),
    std::make_shared<USTimestampParser>(),
    arrow::TimestampParser::MakeStrptime("%Y-%m-%d\\D%H:%M:%S.%f"),
    arrow::TimestampParser::MakeStrptime("%m/%d/%Y, %I:%M:%S %p"),
    // US locale string
    arrow::TimestampParser::MakeStrptime("%m-%d-%Y"),
    arrow::TimestampParser::MakeStrptime("%m/%d/%Y"),
    arrow::TimestampParser::MakeStrptime("%d %m %Y"),
    // TODO: time type column
    arrow::TimestampParser::MakeStrptime("%H:%M:%S.%f")
};

std::vector<std::shared_ptr<arrow::TimestampParser>> DATE_READERS{
    std::make_shared<UnixTimestampParser>(),
    std::make_shared<CustomISO8601Parser>(),
    std::make_shared<USTimestampParser>(),
    arrow::TimestampParser::MakeStrptime("%Y-%m-%d\\D%H:%M:%S.%f"),
    arrow::TimestampParser::MakeStrptime("%m/%d/%Y, %I:%M:%S %p"),
    // US locale
    arrow::TimestampParser::MakeStrptime("%m-%d-%Y"),
    arrow::TimestampParser::MakeStrptime("%m/%d/%Y"),
    arrow::TimestampParser::MakeStrptime("%d %m %Y"),
    arrow::TimestampParser::MakeStrptime("%H:%M:%S.%f")
};

std::optional<int64_t>
parseAsArrowTimestamp(const std::string& input) {
    for (const auto& candidate : DATE_PARSERS) {
        int64_t datetime;
        if (candidate->operator()(
                input.c_str(), input.size(), arrow::TimeUnit::MILLI, &datetime
            )) {
            return datetime;
        }
    }

    return std::nullopt;
}

std::shared_ptr<::arrow::Table>
csvToTable(
    const std::string_view& csv,
    bool is_update,
    std::unordered_map<std::string, std::shared_ptr<arrow::DataType>>& schema
) {
    const arrow::io::IOContext& io_context = arrow::io::default_io_context();
    auto input = std::make_shared<arrow::io::BufferReader>(csv);
    auto read_options = arrow::csv::ReadOptions::Defaults();
    auto parse_options = arrow::csv::ParseOptions::Defaults();
    auto convert_options = arrow::csv::ConvertOptions::Defaults();
#ifdef PSP_PARALLEL_FOR
    read_options.use_threads = true;
#else
    read_options.use_threads = false;
#endif
    parse_options.newlines_in_values = true;

    if (is_update) {
        convert_options.column_types = std::move(schema);
        convert_options.timestamp_parsers = DATE_READERS;
    } else {
        convert_options.timestamp_parsers = DATE_PARSERS;
    }

    auto maybe_reader = arrow::csv::TableReader::Make(
        io_context, input, read_options, parse_options, convert_options
    );

    std::shared_ptr<arrow::csv::TableReader> reader = *maybe_reader;

    auto maybe_table = reader->Read();
    if (!maybe_table.ok()) {
        PSP_COMPLAIN_AND_ABORT(maybe_table.status().ToString());
    }
    return *maybe_table;
}

} // namespace perspective::apachearrow
