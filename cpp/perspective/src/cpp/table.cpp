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
Table::Table(std::vector<std::string> column_names, std::vector<t_dtype> data_types,
    std::uint32_t offset, std::uint32_t limit, std::string index, std::uint32_t size, t_op op,
    bool is_arrow)
    : m_column_names(column_names)
    , m_data_types(data_types)
    , m_offset(offset)
    , m_limit(limit)
    , m_index(index)
    , m_size(size)
    , m_op(op)
    , m_is_arrow(is_arrow) {
    m_data_table = std::make_shared<t_data_table>(t_schema(column_names, data_types));
    m_data_table->init();
    m_data_table->extend(m_size);
}

void
Table::process_op_column() {
    auto op_col = m_data_table->add_column("psp_op", DTYPE_UINT8, false);
    switch (m_op) {
        case OP_DELETE: {
            op_col->raw_fill<std::uint8_t>(OP_DELETE);
        } break;
        default: { op_col->raw_fill<std::uint8_t>(OP_INSERT); }
    }
}

void
Table::process_index_column() {
    if (m_index == "") {
        // If user doesn't specify an column to use as the pkey index, just use
        // row number
        auto key_col = m_data_table->add_column("psp_pkey", DTYPE_INT32, true);
        auto okey_col = m_data_table->add_column("psp_okey", DTYPE_INT32, true);

        for (std::uint32_t ridx = 0; ridx < m_data_table->size(); ++ridx) {
            key_col->set_nth<std::int32_t>(ridx, (ridx + m_offset) % m_limit);
            okey_col->set_nth<std::int32_t>(ridx, (ridx + m_offset) % m_limit);
        }
    } else {
        m_data_table->clone_column(m_index, "psp_pkey");
        m_data_table->clone_column(m_index, "psp_okey");
    }
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