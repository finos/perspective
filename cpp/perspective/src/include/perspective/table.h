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

    Table(std::shared_ptr<t_pool> pool, std::vector<std::string> column_names,
        std::vector<t_dtype> data_types, std::uint32_t offset, std::uint32_t limit,
        std::string index, t_op op, bool is_arrow);

    void init(t_data_table& data_table);
    void update(std::vector<std::string> column_names, std::vector<t_dtype> data_types,
        std::uint32_t offset, std::uint32_t limit, std::string index, t_op op, bool is_arrow);
    t_uindex size() const;
    t_schema get_schema() const;

    std::shared_ptr<t_gnode> make_gnode(const t_schema& in_schema);

    void clone_data_table(t_data_table* data_table);

    void set_gnode(std::shared_ptr<t_gnode> gnode);
    void set_column_names(const std::vector<std::string>& column_names);
    void set_data_types(const std::vector<t_dtype>& data_types);

    // gnode/pool ops
    void unregister_gnode();
    void reset();

    std::shared_ptr<t_pool> get_pool() const;
    std::shared_ptr<t_gnode> get_gnode() const;
    const std::vector<std::string>& get_column_names() const;
    const std::vector<t_dtype>& get_data_types() const;
    std::uint32_t get_offset() const;
    std::uint32_t get_limit() const;
    const std::string& get_index() const;

private:
    /**
     * @brief Create a column for the table operation - either insert or delete.
     *
     */
    void process_op_column(t_data_table& data_table);

    /**
     * @brief Create the index column using a provided index or the row number.
     *
     */
    void process_index_column(t_data_table& data_table);

    std::shared_ptr<t_pool> m_pool;
    std::shared_ptr<t_gnode> m_gnode;
    std::vector<std::string> m_column_names;
    std::vector<t_dtype> m_data_types;
    std::uint32_t m_offset;
    std::uint32_t m_limit;
    std::string m_index;
    t_op m_op;
    bool m_is_arrow;
    bool m_gnode_set;
};

} // namespace perspective