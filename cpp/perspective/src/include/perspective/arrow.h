/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/date.h>
#include <perspective/exports.h>
#include <perspective/scalar.h>
#include <perspective/data_table.h>

#include <arrow/api.h>
#include <arrow/util/decimal.h>
#include <arrow/io/memory.h>
#include <arrow/ipc/reader.h>
#include <arrow/ipc/writer.h>

#include <chrono>
#include <date/date.h>

namespace perspective {
namespace arrow {

    /**
     * @brief Retrieve and cast a `t_scalar` value.
     *
     * @tparam F
     * @tparam F
     * @param t
     * @return T
     */

    template <typename F, typename T = F>
    T get_scalar(t_tscalar& t);

    template <typename T, typename A, typename F = T>
    std::shared_ptr<::arrow::Array>
    col_to_array(const std::vector<t_tscalar>& data, std::uint32_t offset, std::uint32_t stride) {
        int data_size = data.size() / stride;
        // std::vector<T> vals;
        // vals.reserve(data.size());
        ::arrow::TypedBufferBuilder<T> value_builder;

        // Validity map must have a length that is a multiple of 64
        int nullSize = ceil(data_size / 64.0) * 8;
        int nullCount = 0;
        std::vector<std::uint8_t> validityMap;
        validityMap.resize(nullSize);

        for (int idx = offset; idx < data_size; idx += stride) {
            t_tscalar scalar = data[idx];
            if (scalar.is_valid() && scalar.get_dtype() != DTYPE_NONE) {
                value_builder.Append(get_scalar<F, T>(scalar));
                // Mark the slot as non-null (valid)
                validityMap[idx / 8] |= 1 << (idx % 8);
            } else {
                value_builder.Append({});
                nullCount++;
            }
        }
        std::shared_ptr<::arrow::Buffer> null_buf = std::make_shared<::arrow::Buffer>(&validityMap[0], validityMap.size());
        std::shared_ptr<::arrow::Buffer> values;
        value_builder.Finish(&values);
        std::shared_ptr<A> arr = std::make_shared<A>(data_size, values, null_buf, nullCount);
        return arr;
    }

    class PERSPECTIVE_EXPORT ArrowLoader {
    public:
        ArrowLoader();
        ~ArrowLoader();

        void initialize(uintptr_t ptr, std::uint32_t);

        void fill_table(t_data_table& tbl, const std::string& index, std::uint32_t offset,
            std::uint32_t limit, bool is_update);

        std::vector<std::string> names() const;
        std::vector<t_dtype> types() const;
        std::uint32_t row_count() const;

    private:
        void fill_column(t_data_table& tbl, std::shared_ptr<t_column> col,
            const std::string& name, std::int32_t cidx, t_dtype type, std::string& raw_type,
            bool is_update);

        std::shared_ptr<::arrow::Table> m_table;
        std::vector<std::string> m_names;
        std::vector<t_dtype> m_types;
    };

} // namespace arrow
} // namespace perspective