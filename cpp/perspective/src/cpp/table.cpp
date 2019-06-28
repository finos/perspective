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
Table::Table(std::shared_ptr<t_pool> pool, std::vector<std::string> column_names,
    std::vector<t_dtype> data_types, std::uint32_t offset, std::uint32_t limit,
    std::string index, t_op op, bool is_arrow)
    : m_pool(pool)
    , m_column_names(column_names)
    , m_data_types(data_types)
    , m_offset(offset)
    , m_limit(limit)
    , m_index(index)
    , m_op(op)
    , m_is_arrow(is_arrow)
    , m_gnode_set(false) {}

void
Table::init(t_data_table& data_table) {
    // ensure the data table is indexed and has the operation column
    process_op_column(data_table);
    process_index_column(data_table);

    if (!m_gnode_set) {
        // create a new gnode, send it to the table
        auto new_gnode = make_gnode(data_table.get_schema());
        set_gnode(new_gnode);
        m_pool->register_gnode(m_gnode.get());
    }

    PSP_VERBOSE_ASSERT(m_gnode_set, "gnode is not set!");

    // retrieve the table from the gnode, thus discarding the passed-in reference
    m_pool->send(m_gnode->get_id(), 0, data_table);

    // force the pool to process the updated table
    if ((m_op == t_op::OP_UPDATE) || (m_op == t_op::OP_DELETE)) {
        m_pool->_process();
    }
}

void
Table::update(std::vector<std::string> column_names, std::vector<t_dtype> data_types,
    std::uint32_t offset, std::uint32_t limit, std::string index, t_op op, bool is_arrow) {
    m_column_names = column_names;
    m_data_types = data_types;
    m_offset = offset;
    m_limit = limit;
    m_index = index;
    m_op = op;
    m_is_arrow = is_arrow;
}

t_uindex
Table::size() const {
    return m_gnode->get_table()->size();
}

t_schema
Table::get_schema() const {
    return m_gnode->get_tblschema();
}

void
Table::clone_data_table(t_data_table* data_table) {
    auto new_gnode = make_gnode(data_table->get_schema());
    set_gnode(new_gnode);
    m_pool->register_gnode(m_gnode.get());
    m_pool->send(m_gnode->get_id(), 0, *data_table);
    m_pool->_process();
}

std::shared_ptr<t_gnode>
Table::make_gnode(const t_schema& in_schema) {
    std::vector<std::string> col_names(in_schema.columns());
    std::vector<t_dtype> data_types(in_schema.types());

    if (in_schema.has_column("psp_pkey")) {
        t_uindex idx = in_schema.get_colidx("psp_pkey");
        col_names.erase(col_names.begin() + idx);
        data_types.erase(data_types.begin() + idx);
    }

    if (in_schema.has_column("psp_op")) {
        t_uindex idx = in_schema.get_colidx("psp_op");
        col_names.erase(col_names.begin() + idx);
        data_types.erase(data_types.begin() + idx);
    }

    t_schema out_schema(col_names, data_types);

    // Create a gnode
    auto gnode = std::make_shared<t_gnode>(out_schema, in_schema);
    gnode->init();

    return gnode;
}

void
Table::set_gnode(std::shared_ptr<t_gnode> gnode) {
    m_gnode = gnode;
    m_gnode_set = true;
}

void
Table::set_column_names(const std::vector<std::string>& column_names) {
    m_column_names = column_names;
}

void
Table::set_data_types(const std::vector<t_dtype>& data_types) {
    m_data_types = data_types;
}

void
Table::unregister_gnode() {
    m_pool->unregister_gnode(m_gnode->get_id());
}

void
Table::reset() {
    m_gnode->reset();
}

std::shared_ptr<t_pool>
Table::get_pool() const {
    return m_pool;
}

std::shared_ptr<t_gnode>
Table::get_gnode() const {
    return m_gnode;
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

void
Table::process_op_column(t_data_table& data_table) {
    auto op_col = data_table.add_column("psp_op", DTYPE_UINT8, false);
    switch (m_op) {
        case OP_DELETE: {
            op_col->raw_fill<std::uint8_t>(OP_DELETE);
        } break;
        default: { op_col->raw_fill<std::uint8_t>(OP_INSERT); }
    }
}

void
Table::process_index_column(t_data_table& data_table) {
    if (m_index == "") {
        // If user doesn't specify an column to use as the pkey index, just use
        // row number
        auto key_col = data_table.add_column("psp_pkey", DTYPE_INT32, true);
        auto okey_col = data_table.add_column("psp_okey", DTYPE_INT32, true);

        for (std::uint32_t ridx = 0; ridx < data_table.size(); ++ridx) {
            key_col->set_nth<std::int32_t>(ridx, (ridx + m_offset) % m_limit);
            okey_col->set_nth<std::int32_t>(ridx, (ridx + m_offset) % m_limit);
        }
    } else {
        data_table.clone_column(m_index, "psp_pkey");
        data_table.clone_column(m_index, "psp_okey");
    }
}

} // namespace perspective