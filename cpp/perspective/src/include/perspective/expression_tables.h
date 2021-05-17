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
#include <perspective/computed_expression.h>
#include <perspective/data_table.h>

#ifdef PSP_PARALLEL_FOR
#include <tbb/parallel_sort.h>
#include <tbb/tbb.h>
#endif

namespace perspective {

/**
 * @brief Store expression tables for each context - by separating expression
 * columns from the main tables managed by the context, we ensure that cleaning
 * up a context will also clean up its expression columns and not leak memory
 * after the lifetime of a context.
 */
struct t_expression_tables {

    t_expression_tables();
    t_expression_tables(const std::vector<t_computed_expression>& expressions);
    
    void set_transitional_table_capacity(t_uindex capacity);
    void set_transitional_table_size(t_uindex size);
    void clear_transitional_tables();

    // Calculate the `t_transitions` value for each row.
    void calculate_transitions(t_data_table* existed);

    void reset();

    // master table is calculated from t_gstate's master table
    std::unique_ptr<t_data_table> m_master;
    
    // flattened, prev, current, delta, transitions calculated from the
    // tables stored on the gnode's output ports.
    std::unique_ptr<t_data_table> m_flattened;
    std::unique_ptr<t_data_table> m_prev;
    std::unique_ptr<t_data_table> m_current;
    std::unique_ptr<t_data_table> m_delta;
    std::unique_ptr<t_data_table> m_transitions;
};

} // end namespace perspective