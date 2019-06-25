/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/table.h>

namespace perspective {
Table::Table(t_data_accessor data_accessor, std::vector<std::string> column_names,
    std::vector<t_dtype> data_types, std::string index, std::uint32_t size, bool is_update,
    bool is_delete, bool is_arrow)
    : m_data_accessor(data_accessor)
    , m_column_names(column_names)
    , m_data_types(data_types)
    , m_index(index)
    , m_size(size)
    , m_is_update(is_update)
    , m_is_delete(is_delete)
    , m_is_arrow(is_arrow) {
    m_data_table = std::make_shared<t_data_table>(t_schema(column_names, data_types));
    m_data_table->init();
    m_data_table->extend(m_size);
}

void
Table::set_pool(std::shared_ptr<t_pool> pool) {
    m_pool = pool;
}

void
Table::set_gnode(std::shared_ptr<t_gnode> gnode) {
    m_gnode = gnode;
}

std::shared_ptr<t_data_table>
Table::get_data_table() const {
    return m_data_table;
}

const t_data_accessor&
Table::get_data_accessor() const {
    return m_data_accessor;
}

std::shared_ptr<t_pool>
Table::get_pool() const {
    return m_pool;
}

std::shared_ptr<t_gnode>
Table::get_gnode() const {
    return m_gnode;
}

const t_schema&
Table::get_schema() const {
    return m_data_table->get_schema();
}

const std::vector<std::string>&
Table::get_column_names() const {
    return m_column_names;
}

const std::vector<t_dtype>&
Table::get_data_types() const {
    return m_data_types;
}

const std::string&
Table::get_index() const {
    return m_index;
}
} // namespace perspective