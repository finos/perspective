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
#include <perspective/exports.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>
#include <perspective/gnode.h>
#include <perspective/pool.h>
#include <perspective/data_table.h>

namespace perspective {

/**
 * @brief the `Table` class encapsulates `t_data_table`, `t_pool` and `t_gnode`, offering
 * a unified public API for consumption by binding languages.
 *
 * By encapsulating business logic and the creation of internal structures,
 * the `Table` class handles data loading, table creation, and management of backend resources.
 *
 * @tparam T
 */
class PERSPECTIVE_EXPORT Table {
public:
    PSP_NON_COPYABLE(Table);
    /**
     * @brief Construct a new Table object
     *
     * FIXME: bind in t_data_accessor somehow
     *
     * @param column_names
     * @param data_types
     * @param offset
     * @param limit
     * @param index
     * @param size
     * @param op
     * @param is_arrow
     */
    Table(std::vector<std::string> column_names, std::vector<t_dtype> data_types,
        std::uint32_t offset, std::uint32_t limit, std::string index, std::uint32_t size,
        t_op op, bool is_arrow);

    void process_op_column();
    void process_index_column();

    void set_pool(std::shared_ptr<t_pool> pool);
    void set_gnode(std::shared_ptr<t_gnode> gnode);

    std::shared_ptr<t_data_table> get_data_table() const;
    std::shared_ptr<t_pool> get_pool() const;
    std::shared_ptr<t_gnode> get_gnode() const;
    const t_schema& get_schema() const;
    const std::vector<std::string>& get_column_names() const;
    const std::vector<t_dtype>& get_data_types() const;
    std::uint32_t get_offset() const;
    std::uint32_t get_limit() const;
    const std::string& get_index() const;

private:
    std::shared_ptr<t_data_table> m_data_table;
    std::shared_ptr<t_pool> m_pool;
    std::shared_ptr<t_gnode> m_gnode;
    std::vector<std::string> m_column_names;
    std::vector<t_dtype> m_data_types;
    std::uint32_t m_offset;
    std::uint32_t m_limit;
    std::string m_index;
    std::uint32_t m_size;
    t_op m_op;
    bool m_is_arrow;
};

} // namespace perspective