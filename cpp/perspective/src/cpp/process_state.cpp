/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/process_state.h>

namespace perspective {

t_process_state::t_process_state(){};

void
t_process_state::clear_transitional_data_tables() {
    m_delta_data_table->clear();
    m_prev_data_table->clear();
    m_current_data_table->clear();
    m_transitions_data_table->clear();
    m_existed_data_table->clear();
};

void
t_process_state::reserve_transitional_data_tables(t_uindex size) {
    m_delta_data_table->reserve(size);
    m_prev_data_table->reserve(size);
    m_current_data_table->reserve(size);
    m_transitions_data_table->reserve(size);
    m_existed_data_table->reserve(size);
};

void
t_process_state::set_size_transitional_data_tables(t_uindex size) {
    m_delta_data_table->set_size(size);
    m_prev_data_table->set_size(size);
    m_current_data_table->set_size(size);
    m_transitions_data_table->set_size(size);
    m_existed_data_table->set_size(size);
};

} // namespace perspective