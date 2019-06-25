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
template <typename T>
class PERSPECTIVE_EXPORT Table {
public:
    Table(T data_accessor, std::vector<std::string> column_names,
        std::vector<t_dtype> data_types, std::string index, std::uint32_t size, bool is_arrow,
        bool is_delete, bool is_update);
    ~Table();

    void fill(std::uint32_t offset, bool is_arrow, bool is_update);

    void set_pool(std::shared_ptr<t_pool> pool);
    void set_gnode(std::shared_ptr<t_gnode> gnode);

    std::shared_ptr<t_data_table> get_data_table() const;
    const T& get_data_accessor() const;
    std::shared_ptr<t_pool> get_pool() const;
    std::shared_ptr<t_gnode> get_gnode() const;
    const t_schema& get_schema() const;
    const std::vector<std::string>& get_column_names() const;
    const std::vector<t_dtype>& get_data_types() const;
    const std::string& get_index() const;

private:
    std::shared_ptr<t_data_table> m_data_table;
    T m_data_accessor;
    std::shared_ptr<t_pool> m_pool;
    std::shared_ptr<t_gnode> m_gnode;
    std::vector<std::string> m_column_names;
    std::vector<t_dtype> m_data_types;
    std::string m_index;
    std::uint32_t m_size;
    bool m_is_update;
    bool m_is_delete;
    bool m_is_arrow;
};

} // namespace perspective