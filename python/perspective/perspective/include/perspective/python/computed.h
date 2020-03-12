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

namespace perspective {
namespace binding {

/**
 * @brief Seed the computations metadata vector. Must be called at module
 * initialization time for computed columns to work.
 */
void make_computations();

/**
 * @brief Given a table and a vector of computed column definitions,
 * get a `t_schema` containing the return types of computed columns
 * without constructing/calculating the computed column.
 * 
 * @param table 
 * @param p_computed_columns 
 * @return t_schema 
 */
t_schema
get_table_computed_schema_py(
    std::shared_ptr<Table> table,
    t_val p_computed_columns);

} //namespace binding
} //namespace perspective

#endif