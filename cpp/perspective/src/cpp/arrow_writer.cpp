/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/arrow_writer.h>

namespace perspective {
namespace apachearrow {
    using namespace perspective;

    // TODO: unsure about efficacy of these functions when get<T> exists
    template <>
    double
    get_scalar<double>(t_tscalar& t) {
        return t.to_double();
    }
    template <>
    float
    get_scalar<float>(t_tscalar& t) {
        return static_cast<float>(t.to_double());
    }
    template <>
    std::uint8_t
    get_scalar<std::uint8_t>(t_tscalar& t) {
        return static_cast<std::uint8_t>(t.to_int64());
    }
    template <>
    std::int8_t
    get_scalar<std::int8_t>(t_tscalar& t) {
        return static_cast<std::int8_t>(t.to_int64());
    }
    template <>
    std::int16_t
    get_scalar<std::int16_t>(t_tscalar& t) {
        return static_cast<std::int16_t>(t.to_int64());
    }
    template <>
    std::uint16_t
    get_scalar<std::uint16_t>(t_tscalar& t) {
        return static_cast<std::uint16_t>(t.to_int64());
    }
    template <>
    std::int32_t
    get_scalar<std::int32_t>(t_tscalar& t) {
        return static_cast<std::int32_t>(t.to_int64());
    }
    template <>
    std::uint32_t
    get_scalar<std::uint32_t>(t_tscalar& t) {
        return static_cast<std::uint32_t>(t.to_int64());
    }
    template <>
    std::int64_t
    get_scalar<std::int64_t>(t_tscalar& t) {
        return static_cast<std::int64_t>(t.to_int64());
    }
    template <>
    std::uint64_t
    get_scalar<std::uint64_t>(t_tscalar& t) {
        return static_cast<std::uint64_t>(t.to_int64());
    }
    template <>
    bool
    get_scalar<bool>(t_tscalar& t) {
        return t.get<bool>();
    }
    template <>
    std::string
    get_scalar<std::string>(t_tscalar& t) {
        return t.to_string();
    }

    std::int32_t
    get_idx(std::int32_t cidx, std::int32_t ridx, std::int32_t stride,
        t_get_data_extents extents) {
        return (ridx - extents.m_srow) * stride + (cidx - extents.m_scol);
    }

    std::shared_ptr<arrow::Array>
    boolean_col_to_array(const std::vector<t_tscalar>& data, std::int32_t cidx,
        std::int32_t stride, t_get_data_extents extents) {
        arrow::BooleanBuilder array_builder;
        auto reserve_status
            = array_builder.Reserve(extents.m_erow - extents.m_srow);
        if (!reserve_status.ok()) {
            std::stringstream ss;
            ss << "Failed to allocate buffer for column: "
               << reserve_status.message() << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }

        for (int ridx = extents.m_srow; ridx < extents.m_erow; ++ridx) {
            auto idx = get_idx(cidx, ridx, stride, extents);
            t_tscalar scalar = data.operator[](idx);
            arrow::Status s;
            if (scalar.is_valid() && scalar.get_dtype() != DTYPE_NONE) {
                array_builder.UnsafeAppend(get_scalar<bool>(scalar));
            } else {
                array_builder.UnsafeAppendNull();
            }
        }

        std::shared_ptr<arrow::Array> array;
        arrow::Status status = array_builder.Finish(&array);
        if (!status.ok()) {
            PSP_COMPLAIN_AND_ABORT(
                "Could not serialize boolean column: " + status.message());
        }
        return array;
    }

    std::shared_ptr<arrow::Array>
    date_col_to_array(const std::vector<t_tscalar>& data, std::int32_t cidx,
        std::int32_t stride, t_get_data_extents extents) {
        arrow::Date32Builder array_builder;
        auto reserve_status
            = array_builder.Reserve(extents.m_erow - extents.m_srow);
        if (!reserve_status.ok()) {
            std::stringstream ss;
            ss << "Failed to allocate buffer for column: "
               << reserve_status.message() << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }

        for (int ridx = extents.m_srow; ridx < extents.m_erow; ++ridx) {
            auto idx = get_idx(cidx, ridx, stride, extents);
            t_tscalar scalar = data.operator[](idx);
            if (scalar.is_valid() && scalar.get_dtype() != DTYPE_NONE) {
                t_date val = scalar.get<t_date>();
                // years are signed, while month/days are unsigned
                date::year year{val.year()};
                // Increment month by 1, as date::month is [1-12] but
                // t_date::month() is [0-11]
                date::month month{static_cast<std::uint32_t>(val.month() + 1)};
                date::day day{static_cast<std::uint32_t>(val.day())};
                date::year_month_day ymd(year, month, day);
                date::sys_days days_since_epoch = ymd;
                array_builder.UnsafeAppend(static_cast<std::int32_t>(
                    days_since_epoch.time_since_epoch().count()));
            } else {
                array_builder.UnsafeAppendNull();
            }
        }

        std::shared_ptr<arrow::Array> array;
        arrow::Status status = array_builder.Finish(&array);
        if (!status.ok()) {
            PSP_COMPLAIN_AND_ABORT(
                "Could not serialize date column: " + status.message());
        }
        return array;
    }

    std::shared_ptr<arrow::Array>
    timestamp_col_to_array(const std::vector<t_tscalar>& data,
        std::int32_t cidx, std::int32_t stride, t_get_data_extents extents) {
        // TimestampType requires parameters, so initialize them here
        std::shared_ptr<arrow::DataType> type
            = arrow::timestamp(arrow::TimeUnit::MILLI);
        arrow::TimestampBuilder array_builder(
            type, arrow::default_memory_pool());
        auto reserve_status
            = array_builder.Reserve(extents.m_erow - extents.m_srow);
        if (!reserve_status.ok()) {
            std::stringstream ss;
            ss << "Failed to allocate buffer for column: "
               << reserve_status.message() << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }

        for (int ridx = extents.m_srow; ridx < extents.m_erow; ++ridx) {
            auto idx = get_idx(cidx, ridx, stride, extents);
            t_tscalar scalar = data.operator[](idx);
            if (scalar.is_valid() && scalar.get_dtype() != DTYPE_NONE) {
                array_builder.UnsafeAppend(get_scalar<std::int64_t>(scalar));
            } else {
                array_builder.UnsafeAppendNull();
            }
        }

        std::shared_ptr<arrow::Array> array;
        arrow::Status status = array_builder.Finish(&array);
        if (!status.ok()) {
            PSP_COMPLAIN_AND_ABORT(
                "Could not serialize timestamp column: " + status.message());
        }
        return array;
    }

    std::shared_ptr<arrow::Array>
    string_col_to_dictionary_array(const std::vector<t_tscalar>& data,
        std::int32_t cidx, std::int32_t stride, t_get_data_extents extents) {
        t_vocab vocab;
        vocab.init(false);
        arrow::Int32Builder indices_builder;
        arrow::StringBuilder values_builder;
        auto reserve_status
            = indices_builder.Reserve(extents.m_erow - extents.m_srow);
        if (!reserve_status.ok()) {
            std::stringstream ss;
            ss << "Failed to allocate buffer for column: "
               << reserve_status.message() << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }

        for (int ridx = extents.m_srow; ridx < extents.m_erow; ++ridx) {
            auto idx = get_idx(cidx, ridx, stride, extents);
            t_tscalar scalar = data.operator[](idx);
            if (scalar.is_valid() && scalar.get_dtype() != DTYPE_NONE) {
                auto adx = vocab.get_interned(scalar.to_string());
                indices_builder.UnsafeAppend(adx);
            } else {
                indices_builder.UnsafeAppendNull();
            }
        }

        // get str out of vocab
        for (auto i = 0; i < vocab.get_vlenidx(); i++) {
            const char* str = vocab.unintern_c(i);
            arrow::Status s = values_builder.Append(str, strlen(str));
            if (!s.ok()) {
                std::stringstream ss;
                ss << "Could not append string to dictionary array: "
                   << s.message() << std::endl;
                PSP_COMPLAIN_AND_ABORT(ss.str());
            }
        }

        // Write dictionary indices
        std::shared_ptr<arrow::Array> indices_array;
        arrow::Status indices_status = indices_builder.Finish(&indices_array);
        if (!indices_status.ok()) {
            std::stringstream ss;
            ss << "Could not write indices for dictionary array: "
               << indices_status.message() << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }

        // Write dictionary values
        std::shared_ptr<arrow::Array> values_array;
        arrow::Status values_status = values_builder.Finish(&values_array);
        if (!values_status.ok()) {
            std::stringstream ss;
            ss << "Could not write values for dictionary array: "
               << values_status.message() << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }
        auto dictionary_type = arrow::dictionary(arrow::int32(), arrow::utf8());

#if ARROW_VERSION_MAJOR < 1
        std::shared_ptr<arrow::Array> dictionary_array;
        PSP_CHECK_ARROW_STATUS(arrow::DictionaryArray::FromArrays(
            dictionary_type, indices_array, values_array, &dictionary_array));

        return dictionary_array;
#else
        arrow::Result<std::shared_ptr<arrow::Array>> result
            = arrow::DictionaryArray::FromArrays(
                dictionary_type, indices_array, values_array);

        if (!result.ok()) {
            std::stringstream ss;
            ss << "Could not write values for dictionary array: "
               << result.status().message() << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }

        return *result;
#endif
    }

} // namespace apachearrow
} // namespace perspective