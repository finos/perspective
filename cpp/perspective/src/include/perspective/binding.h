/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once

#if defined(PSP_ENABLE_WASM) || defined(PSP_ENABLE_PYTHON)

#include <perspective/base.h>
#include <perspective/gnode.h>
#include <perspective/table.h>
#include <perspective/pool.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <perspective/view.h>
#include <random>
#include <cmath>
#include <sstream>
#include <perspective/sym_table.h>
#include <codecvt>

typedef std::codecvt_utf8<wchar_t> utf8convert_type;
typedef std::codecvt_utf8_utf16<wchar_t> utf16convert_type;

namespace perspective {
namespace binding {

    /******************************************************************************
     *
     * Utility
     */
    template <typename T, typename U>
    std::vector<U> vecFromArray(T& arr);

    template <typename T>
    bool hasValue(T val);

    /******************************************************************************
     *
     * Data Loading
     */
    t_index _get_aggregate_index(const std::vector<std::string>& agg_names, std::string name);

    std::vector<std::string> _get_aggregate_names(const std::vector<t_aggspec>& aggs);

    template <typename T>
    std::vector<t_sortspec> _get_sort(
        std::vector<std::string>& col_names, bool is_column_sort, T j_sortby);

    /**
     *
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    template <typename T>
    std::vector<t_fterm> _get_fterms(t_schema schema, T j_date_parser, T j_filters);

    /**
     *
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    template <typename T>
    std::vector<t_aggspec> _get_aggspecs(
        t_schema schema, std::string separator, bool column_only, T j_aggs);

    /**
     * Converts a scalar value to its language-specific representation.
     *
     * Params
     * ------
     * t_tscalar scalar
     *
     * Returns
     * -------
     * T
     */
    template <typename T>
    T scalar_to(const t_tscalar& scalar);

    template <typename T>
    T scalar_vec_to(const std::vector<t_tscalar>& scalars, std::uint32_t idx);

    /**
     *
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    namespace arrow {

        template <typename T>
        void vecFromTypedArray(const T& typedArray, void* data, std::int32_t length,
            const char* destType = nullptr);

        template <typename T>
        void fill_col_valid(T dcol, std::shared_ptr<t_column> col);

        template <typename T>
        void fill_col_dict(T dictvec, std::shared_ptr<t_column> col);

    } // namespace arrow

    template <typename T>
    void _fill_col_numeric(T accessor, t_table& tbl, std::shared_ptr<t_column> col,
        std::string name, std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update);

    template <typename T>
    void _fill_col_int64(T accessor, std::shared_ptr<t_column> col, std::string name,
        std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update);

    template <typename T>
    void _fill_col_time(T accessor, std::shared_ptr<t_column> col, std::string name,
        std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update);

    template <typename T>
    void _fill_col_date(T accessor, std::shared_ptr<t_column> col, std::string name,
        std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update);

    template <typename T>
    void _fill_col_bool(T accessor, std::shared_ptr<t_column> col, std::string name,
        std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update);

    template <typename T>
    void _fill_col_string(T accessor, std::shared_ptr<t_column> col, std::string name,
        std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update);

    /**
     * Fills the table with data from language.
     *
     * Params
     * ------
     * tbl - pointer to the table object
     * ocolnames - vector of column names
     * accessor - the data accessor interface
     * odt - vector of data types
     * offset
     * is_arrow - flag for arrow data
     *
     * Returns
     * -------
     *
     */
    template <typename T>
    void _fill_data(t_table& tbl, std::vector<std::string> ocolnames, T accessor,
        std::vector<t_dtype> odt, std::uint32_t offset, bool is_arrow, bool is_update);

    /******************************************************************************
     *
     * Public
     */

    template <typename T>
    void set_column_nth(t_column* col, t_uindex idx, T value);

    /**
     * Helper function for computed columns
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    template <typename T>
    void table_add_computed_column(t_table& table, T computed_defs);

    /**
     * DataAccessor
     *
     * parses and converts input data into a canonical format for
     * interfacing with Perspective.
     */

    // Name parsing
    template <typename T>
    std::vector<std::string> column_names(T data, std::int32_t format);

    // Type inferrence for fill_col and data_types
    template <typename T, typename U>
    t_dtype infer_type(T x, U date_validator);

    template <typename T, typename U>
    t_dtype get_data_type(T data, std::int32_t format, std::string name, U date_validator);

    template <typename T, typename U>
    std::vector<t_dtype> data_types(
        T data, std::int32_t format, std::vector<std::string> names, U date_validator);

    /**
     * Create a default gnode.
     *
     * Params
     * ------
     * j_colnames - a JS Array of column names.
     * j_dtypes - a JS Array of column types.
     *
     * Returns
     * -------
     * A gnode.
     */
    std::shared_ptr<t_gnode> make_gnode(const t_schema& iscm);

    /**
     * Create a populated table.
     *
     * Params
     * ------
     * chunk - a JS object containing parsed data and associated metadata
     * offset
     * limit
     * index
     * is_delete - sets the table operation
     *
     * Returns
     * -------
     * a populated table.
     */
    template <typename T>
    std::shared_ptr<t_gnode> make_table(t_pool* pool, T gnode, T accessor, T computed,
        std::uint32_t offset, std::uint32_t limit, std::string index, bool is_update,
        bool is_delete, bool is_arrow);

    /**
     * Copies the internal table from a gnode
     *
     * Params
     * ------
     *
     * Returns
     * -------
     * A gnode.
     */
    template <typename T>
    std::shared_ptr<t_gnode> clone_gnode_table(
        t_pool* pool, std::shared_ptr<t_gnode> gnode, T computed);

    /**
     * Creates the configuration object for a new View.
     *
     * Params
     * ------
     *
     * Returns
     * -------
     * A t_config object.
     */
    template <typename T>
    t_config make_view_config(
        const t_schema& schema, std::string separator, T date_parser, T config);

    /**
     * Creates a new zero-sided View.
     *
     * Params
     * ------
     *
     * Returns
     * -------
     * A shared pointer to a View<CTX_T>.
     */

    template <typename T>
    std::shared_ptr<View<t_ctx0>> make_view_zero(t_pool* pool, std::shared_ptr<t_gnode> gnode,
        std::string name, std::string separator, T config, T date_parser);

    /**
     * Creates a new one-sided View.
     *
     * Params
     * ------
     *
     * Returns
     * -------
     * A shared pointer to a View<t_ctx1>.
     */

    template <typename T>
    std::shared_ptr<View<t_ctx1>> make_view_one(t_pool* pool, std::shared_ptr<t_gnode> gnode,
        std::string name, std::string separator, T config, T date_parser);

    /**
     * Creates a new two-sided View.
     *
     * Params
     * ------
     *
     * Returns
     * -------
     * A shared pointer to a View<t_ctx2>.
     */

    template <typename T>
    std::shared_ptr<View<t_ctx2>> make_view_two(t_pool* pool, std::shared_ptr<t_gnode> gnode,
        std::string name, std::string separator, T config, T date_parser);

    /**
     *
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    std::shared_ptr<t_ctx0> make_context_zero(t_schema schema, t_filter_op combiner,
        std::vector<std::string> columns, std::vector<t_fterm> filters,
        std::vector<t_sortspec> sorts, t_pool* pool, std::shared_ptr<t_gnode> gnode,
        std::string name);

    /**
     *
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    std::shared_ptr<t_ctx1> make_context_one(t_schema schema, std::vector<t_pivot> pivots,
        t_filter_op combiner, std::vector<t_fterm> filters, std::vector<t_aggspec> aggregates,
        std::vector<t_sortspec> sorts, std::int32_t pivot_depth, t_pool* pool,
        std::shared_ptr<t_gnode> gnode, std::string name);

    /**
     *
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    std::shared_ptr<t_ctx2> make_context_two(t_schema schema, std::vector<t_pivot> rpivots,
        std::vector<t_pivot> cpivots, t_filter_op combiner, std::vector<t_fterm> filters,
        std::vector<t_aggspec> aggregates, std::vector<t_sortspec> sorts,
        std::vector<t_sortspec> col_sorts, std::int32_t rpivot_depth, std::int32_t cpivot_depth,
        bool column_only, t_pool* pool, std::shared_ptr<t_gnode> gnode, std::string name);

    template <typename T>
    void sort(std::shared_ptr<t_ctx2> ctx2, T j_sortby);

    template <typename T>
    T get_column_data(std::shared_ptr<t_table> table, std::string colname);

    /**
     *
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    template <typename CTX_T, typename T>
    T get_data(std::shared_ptr<View<CTX_T>> view, std::uint32_t start_row,
        std::uint32_t end_row, std::uint32_t start_col, std::uint32_t end_col);

    template <typename T>
    T get_data_two_skip_headers(std::shared_ptr<View<t_ctx2>> view, std::uint32_t depth,
        std::uint32_t start_row, std::uint32_t end_row, std::uint32_t start_col,
        std::uint32_t end_col);

    /**
     * @brief Get the t_data_slice object, which contains an underlying slice of data and
     * metadata required to interact with it.
     *
     * @param view
     * @param start_row
     * @param end_row
     * @param start_col
     * @param end_col
     */
    template <typename CTX_T>
    std::shared_ptr<t_data_slice<CTX_T>> get_data_slice(std::shared_ptr<View<CTX_T>> view,
        std::uint32_t start_row, std::uint32_t end_row, std::uint32_t start_col,
        std::uint32_t end_col);

    /**
     * @brief Retrieve a single value from the data slice and serialize it to an output
     * type that interfaces with the binding language.
     *
     * @param view
     * @param start_row
     * @param end_row
     * @param start_col
     * @param end_col
     * @return val
     */
    template <typename CTX_T, typename T>
    T get_from_data_slice(
        std::shared_ptr<t_data_slice<CTX_T>> data_slice, t_uindex ridx, t_uindex cidx);

} // end namespace binding
} // end namespace perspective

#endif