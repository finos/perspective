/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once
#ifdef PSP_ENABLE_PYTHON

#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/python/base.h>
#include <perspective/utils.h>

namespace perspective {
namespace binding {

/******************************************************************************
 *
 * Fill columns with data
 */

// void
// _fill_col_time(t_data_accessor accessor, std::shared_ptr<t_column> col, std::string name,
//     std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {

// void
// _fill_col_date(t_data_accessor accessor, std::shared_ptr<t_column> col, std::string name,
//     std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {

void _fill_col_bool(t_data_accessor accessor, std::shared_ptr<t_column> col, std::string name, std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update);
void _fill_col_string(t_data_accessor accessor, std::shared_ptr<t_column> col, std::string name, std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update);
void _fill_col_int64(t_data_accessor accessor, t_data_table& tbl, std::shared_ptr<t_column> col, std::string name, std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update);


template <>
void set_column_nth(t_column* col, t_uindex idx, t_val value);

// TODO
// template <>
// void
// table_add_computed_column(t_data_table& table, t_val computed_defs) {

void _fill_col_numeric(t_data_accessor accessor, t_data_table& tbl, std::shared_ptr<t_column> col, std::string name, std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update);
void _fill_data_helper(t_data_accessor accessor, t_data_table& tbl, std::shared_ptr<t_column> col, std::string name, std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update);

/******************************************************************************
 *
 * Fill tables with data
 */

void _fill_data(t_data_table& tbl, t_data_accessor accessor, const t_schema& input_schema, const std::string& index, std::uint32_t offset, std::uint32_t limit, bool is_arrow, bool is_update);

} //namespace binding
} //namespace perspective

#endif