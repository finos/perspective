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
#include <perspective/exports.h>
#include <perspective/scalar.h>
#include <perspective/data_table.h>

#include <arrow/api.h>
#include <arrow/io/memory.h>
#include <arrow/ipc/reader.h>

namespace perspective {
namespace arrow {

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