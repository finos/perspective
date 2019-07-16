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
     * @brief Construct a `Table` object, which handles all operations related to `t_pool` and
     * `t_gnode`, effectively acting as an orchestrator between those underlying components.
     *
     * @param pool
     * @param column_names
     * @param data_types
     * @param offset
     * @param limit
     * @param index
     * @param op
     * @param is_arrow
     */
    Table(std::shared_ptr<t_pool> pool, std::vector<std::string> column_names,
        std::vector<t_dtype> data_types, std::uint32_t offset, std::uint32_t limit,
        std::string index, t_op op, bool is_arrow);

    /**
     * @brief Register the given `t_data_table` with the underlying pool and gnode, thus
     * allowing operations on it.
     *
     * @param data_table
     */
    void init(t_data_table& data_table);

    /**
     * @brief Given new metadata about the underlying data table, data format, index, limit
     * etc., update the current object with this new metadata, allowing for reuse of `Table`
     * instances.
     *
     * @param column_names
     * @param data_types
     * @param offset
     * @param limit
     * @param index
     * @param op
     * @param is_arrow
     */
    void update(std::vector<std::string> column_names, std::vector<t_dtype> data_types,
        std::uint32_t offset, std::uint32_t limit, std::string index, t_op op, bool is_arrow);

    /**
     * @brief The size of the underlying `t_data_table`, i.e. a row count
     *
     * @return t_uindex
     */
    t_uindex size() const;

    /**
     * @brief The schema of the underlying `t_data_table`, which contains the `psp_pkey`,
     * `psp_op` and `psp_pkey` meta columns.
     *
     * The output schema is generally subject to further processing before it is human-readable.
     *
     * @return t_schema
     */
    t_schema get_schema() const;

    /**
     * @brief Given a schema, create a `t_gnode` that expects a `t_data_table` conforming to the
     * column names and data types.
     *
     * A `t_gnode` and `t_pool` must be created and registered in order for the core engine to
     * work.
     *
     * @param in_schema
     * @return std::shared_ptr<t_gnode>
     */
    std::shared_ptr<t_gnode> make_gnode(const t_schema& in_schema);

    /**
     * @brief Given a new `t_data_table`, replace this instance's `m_data_table` with the new
     * object, and perform registration operations so the new table is recognized.
     *
     * Used during construction of computed columns, as we don't need to create a new `Table`
     * object each time.
     *
     * @param data_table
     */
    void replace_data_table(t_data_table* data_table);

    /**
     * @brief Unregister the gnode with the given `id` from this instance's `t_pool`, thus
     * marking it for deletion.
     *
     * @param id
     */
    void unregister_gnode(t_uindex id);

    /**
     * @brief Reset the gnode with the given `id`, thus deregistering any `t_data_table`s
     * associated with that gnode.
     *
     * @param id
     */
    void reset_gnode(t_uindex id);

    // Setters
    void set_gnode(std::shared_ptr<t_gnode> gnode);
    void set_column_names(const std::vector<std::string>& column_names);
    void set_data_types(const std::vector<t_dtype>& data_types);

    // Getters
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

    bool m_init;
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