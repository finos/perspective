/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/exports.h>
#include <perspective/raw_types.h>
#include <perspective/computed.h>
#include <tsl/ordered_map.h>

namespace perspective {

/**
 * @brief `t_computed_column_map` keeps track of a set of computed
 * column definitions for a single gnode. 
 * 
 * When contexts are created, call the `add_computed_columns` method to track
 * new computed columns. When contexts are deleted, call the 
 * `remove_computed_columns` method to stop tracking the context's computed
 * columns.
 * 
 */
struct PERSPECTIVE_EXPORT t_computed_column_map {

    t_computed_column_map();

    /**
     * @brief Add computed column definitions to be tracked.
     * 
     * Column definitions with duplicate names will replace the stored
     * column definition.
     * 
     * @param columns 
     */
    void add_computed_columns(
        const std::vector<t_computed_column_definition>& columns);

    /**
     * @brief Remove computed columns by name.
     * 
     * @param names 
     */
    void remove_computed_columns(const std::vector<std::string>& names);

    /**
     * @brief An ordered map of computed column names to computed column
     * definitions - keys are iterated in insertion order.
     * 
     */
    tsl::ordered_map<std::string, t_computed_column_definition> m_computed_columns;
};

} // end namespace perspective