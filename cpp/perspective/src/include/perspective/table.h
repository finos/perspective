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
#include <perspective/computed.h>
#include <perspective/data_table.h>

namespace perspective {

/**
 * @brief the `Table` class encapsulates `t_data_table`, `t_pool` and `t_gnode`, offering
 * a unified public API for consumption by binding languages.
 *
 * By encapsulating business logic and the creation of internal structures,
 * the `Table` class handles data loading, table creation, and management of backend resources.
 */
class PERSPECTIVE_EXPORT Table {
public:
    PSP_NON_COPYABLE(Table);

    /**
     * @brief Construct a `Table` object, which handles all operations related to `t_pool` and
     * `t_gnode`, effectively acting as an orchestrator between those underlying components.
     *
     * @param pool - the `t_pool` which manages the Table.
     * @param column_names
     * @param data_types
     * @param limit - an upper bound on the number of rows in the Table (optional).
     * @param index - a string column name to be used as a primary key. If not explicitly set, a primary key will be generated.
     * @param op
     */
    Table(
        std::shared_ptr<t_pool> pool,
        const std::vector<std::string>& column_names,
        const std::vector<t_dtype>& data_types,
        std::uint32_t limit,
        const std::string& index);

    /**
     * @brief Register the given `t_data_table` with the underlying pool and gnode, thus
     * allowing operations on it.
     *
     * @param data_table
     * @param row_count
     * @param op
     */
    void init(t_data_table& data_table, std::uint32_t row_count, const t_op op, const t_uindex port_id);

    /**
     * @brief The size of the underlying `t_data_table`, i.e. a row count
     *
     * @return t_uindex
     */
    t_uindex size() const;

    /**
     * @brief The schema of the underlying `t_data_table`, which contains the
     * `psp_pkey`, `psp_op` and `psp_pkey` meta columns, and none of the
     * computed columns that are created by views on this table. For a
     * `t_schema` with all computed columns created by all views, use
     * `m_gnode->get_table_sptr()->get_schema()`.
     *
     * The output schema is generally subject to further processing before
     * it can be used, as meta columns need to be removed.
     *
     * @return t_schema
     */
    t_schema get_schema() const;

    /**
     * @brief Given a vector of computed column definitions, look up the
     * computed function and its return types to create a computed schema
     * without actually constructing/calculating the computed columns. Required
     * so that computed column types/aggregates can be correctly identified
     * without unnecessary recalculation.
     * 
     * @param computed_columns 
     * @return t_schema 
     */
    t_schema get_computed_schema(
        std::vector<t_computed_column_definition> computed_columns) const;

    /**
     * @brief Given a schema, create a `t_gnode` that manages the `t_data_table`.
     *
     * A `t_gnode` and `t_pool` must be created and registered in order for the core engine to
     * work.
     *
     * @param in_schema
     * @return std::shared_ptr<t_gnode>
     */
    std::shared_ptr<t_gnode> make_gnode(const t_schema& in_schema);

    /**
     * @brief Set the internal `m_gnode` reference and the corresponding flag.
     *
     * @param gnode
     */
    void set_gnode(std::shared_ptr<t_gnode> gnode);

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

    /**
     * @brief Create a `t_port` on `m_gnode`, which allows updates and removes
     * to be processed on a specific port. Returns a `t_uindex` containing the
     * id of the port.
     * 
     * @return t_uindex the ID of the port, which can be passed into `update`
     * and `delete` methods in Javascript or Python. 
     */
    t_uindex make_port();

    /**
     * @brief Given a port ID, remove the input port associated with the ID.
     * 
     * @param port_id 
     */
    void remove_port(t_uindex port_id);

    /**
     * @brief The offset determines where we begin to write data into the Table. 
     * Using `m_offset`, `m_limit`, and the length of the dataset, calculate the new position at which we write data.
     * 
     * @param row_count - the number of rows to write into the table 
     */
    void calculate_offset(std::uint32_t row_count);

    // Getters
    t_uindex get_id() const;
    std::shared_ptr<t_pool> get_pool() const;
    std::shared_ptr<t_gnode> get_gnode() const;
    const std::vector<std::string>& get_column_names() const;
    const std::vector<t_dtype>& get_data_types() const;
    std::uint32_t get_offset() const;
    std::uint32_t get_limit() const;
    const std::string& get_index() const;

    // Setters
    void set_column_names(const std::vector<std::string>& column_names);
    void set_data_types(const std::vector<t_dtype>& data_types);

private:
    /**
     * @brief Make sure that the table does not have an explicit index AND an implicit index (with the `__INDEX__` column in data).
     * 
     * @param column_names 
     */
    void validate_columns(const std::vector<std::string>& column_names);
    /**
     * @brief Create a column for the table operation - either insert or delete.
     *
     * @private
     * @param data_table
     * @param op
     */
    void process_op_column(t_data_table& data_table, const t_op op);

    bool m_init;
    t_uindex m_id;
    std::shared_ptr<t_pool> m_pool;
    std::shared_ptr<t_gnode> m_gnode;
    std::vector<std::string> m_column_names;
    std::vector<t_dtype> m_data_types;

    /**
     * @brief The row number at which we start to write into the Table. Recalculated on updates, removes, and inserts.
     * 
     */
    std::uint32_t m_offset;

    /**
     * @brief an upper bound on the number of total rows in the Table. 
     * 
     * When limit is set, new data that exceeds the limit will overwrite starting at row 0.
     * Otherwise, limit is set to the highest number at 32 bits.
     */
    const t_uindex m_limit;

    /**
     * @brief The name of a column that should be used as the Table's primary key.
     * 
     */
    const std::string m_index;
    bool m_gnode_set;
};

} // namespace perspective