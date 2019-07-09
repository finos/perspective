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
#include <perspective/data_table.h>
#include <perspective/pool.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <perspective/sym_table.h>
#include <perspective/table.h>
#include <perspective/view.h>
#include <perspective/view_config.h>
#include <random>
#include <cmath>
#include <sstream>
#include <codecvt>

typedef std::codecvt_utf8<wchar_t> utf8convert_type;
typedef std::codecvt_utf8_utf16<wchar_t> utf16convert_type;

namespace perspective {

/**
 * @brief the `binding` namespace contains methods which ingest, return, or otherwise manipulate
 * values in Perspective's binding language.
 *
 * For Emscripten WASM builds, the type is defined as `emscripten::val`, shadowed using our
 * `t_val` construct.
 *
 * For Python, the type is `py::object`.
 *
 * Templated functions in this namespace should be explicitly instantiated with
 * the correct object type for the binding language.
 *
 */
namespace binding {

    /******************************************************************************
     *
     * Utility
     */

    template <typename T, typename U>
    std::vector<U> vecFromArray(T& arr);

    template <typename T>
    bool has_value(T val);

    /******************************************************************************
     *
     * Data Loading
     */

    t_index _get_aggregate_index(const std::vector<std::string>& agg_names, std::string name);

    std::vector<std::string> _get_aggregate_names(const std::vector<t_aggspec>& aggs);

    /**
     * @brief Calculate aggregates specified in `j_aggs` and use default aggregates for
     * columns marked in `columns`.
     *
     * @tparam
     * @param schema
     * @param row_pivots
     * @param column_pivots
     * @param sortbys
     * @param columns
     * @param j_aggs
     */
    template <typename T>
    std::vector<t_aggspec> _get_aggspecs(const t_schema& schema,
        const std::vector<std::string>& row_pivots,
        const std::vector<std::string>& column_pivots, bool column_only,
        const std::vector<std::string>& columns, const std::vector<T>& sortbys, T j_aggs);

    /**
     * @brief Retrieve and validate how we sort the dataset in the view.
     *
     * @tparam T
     * @param columns
     * @param is_column_sort
     * @param sortbys
     * @return std::vector<t_sortspec>
     */
    template <typename T>
    std::vector<t_sortspec> _get_sort(const std::vector<std::string>& columns,
        const std::vector<T>& sortbys, bool is_column_sort);

    /**
     * @brief From the binding language, retrieve what we need to filter the dataset by.
     *
     * @tparam T
     * @param schema
     * @param j_date_parser
     * @param j_filters
     * @return std::vector<t_fterm>
     */
    template <typename T>
    std::vector<t_fterm> _get_fterms(const t_schema& schema, T j_date_parser, T j_filters);

    /**
     * @brief Converts a `t_scalar` to a value in the binding language.
     *
     * @tparam T
     * @param scalar
     */
    template <typename T>
    T scalar_to(const t_tscalar& scalar);

    /**
     * @brief Converts a `t_scalar` in a vector to a value in the binding language.
     *
     * @tparam T
     * @param scalar
     */
    template <typename T>
    T scalar_vec_to(const std::vector<t_tscalar>& scalars, std::uint32_t idx);

    /**
     * @brief namespace `arrow` contains utilities for writing data in the Apache arrow format.
     *
     * Implementations of these methods access underlying heap memory and create contiguous
     * blocks of data which conform to the arrow schema; these methods should not be used to
     * parse `.arrow` files or access arrow-formatted data in memory. Instead, arrow data
     * parsing and manipulation should be implemented in the binding language, using appropriate
     * libraries.
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

    /**
     * @brief Retrieve and cast a `t_scalar` value.
     *
     * @tparam F
     * @tparam F
     * @param t
     * @return T
     */
    template <typename F, typename T = F>
    T get_scalar(t_tscalar& t);

    /**
     * DataAccessor
     *
     * parses and converts input data into a canonical format for
     * interfacing with Perspective.
     */

    // Name parsing
    template <typename T>
    std::vector<std::string> get_column_names(T data, std::int32_t format);

    // Type inferrence for fill_col and data_types
    template <typename T, typename U>
    t_dtype infer_type(T x, U date_validator);

    template <typename T, typename U>
    t_dtype get_data_type(T data, std::int32_t format, std::string name, U date_validator);

    template <typename T, typename U>
    std::vector<t_dtype> get_data_types(
        T data, std::int32_t format, std::vector<std::string> names, U date_validator);

    /**
     * @brief Given a data accessor and a pointer to a column, iterate through the data and fill
     * the column.
     */
    template <typename T>
    void _fill_col_numeric(T accessor, t_data_table& tbl, std::shared_ptr<t_column> col,
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
     * @brief Change a value at a given index inside the column.
     */
    template <typename T>
    void set_column_nth(t_column* col, t_uindex idx, T value);

    /**
     * @brief Create a new computed column.
     */
    template <typename T>
    void table_add_computed_column(t_data_table& table, T computed_defs);

    /**
     * @brief Given a table, iterate through each column and fill it with data.
     *
     * @tparam T
     * @param tbl
     * @param accessor
     * @param col_names
     * @param data_types
     * @param offset
     * @param is_arrow
     * @param is_update
     */
    template <typename T>
    void _fill_data(t_data_table& tbl, T accessor, std::vector<std::string> col_names,
        std::vector<t_dtype> data_types, std::uint32_t offset, bool is_arrow, bool is_update);

    /**
     * @brief Create and populate a table.
     *
     * @tparam
     * @param pool
     * @param gnode
     * @param accessor
     * @param computed
     * @param offset
     * @param limit
     * @param index
     * @param is_update
     * @param is_delete
     * @param is_arrow
     * @return std::shared_ptr<t_gnode>
     */
    template <typename T>
    std::shared_ptr<Table> make_table(T table, T accessor, T computed, std::uint32_t offset,
        std::uint32_t limit, std::string index, t_op op, bool is_arrow);

    /**
     * @brief Given an array-like container with new computed columns, add them to the
     * already-existing `Table`.
     *
     * @tparam T
     * @param pool
     * @param gnode
     * @param computed
     * @return std::shared_ptr<t_gnode>
     */
    template <typename T>
    std::shared_ptr<Table> make_computed_table(std::shared_ptr<Table> table, T computed);

    template <typename T>
    t_view_config make_view_config2(
        const t_schema& schema, std::string separator, T date_parser, T config);

    /**
     * @brief Extracts and validates the config from the binding language,
     * creating a t_config for the new View.
     *
     * @tparam T
     * @param schema
     * @param separator
     * @param date_parser
     * @param config
     * @return t_config
     */
    template <typename T>
    t_config make_view_config(
        const t_schema& schema, std::string separator, T date_parser, T config);

    /**
     * @brief Create a new zero-sided view.
     *
     * Zero-sided views have no aggregates applied.
     *
     * @tparam T
     * @param table
     * @param name
     * @param separator
     * @param config
     * @param date_parser
     * @return std::shared_ptr<View<t_ctx0>>
     */
    template <typename T>
    std::shared_ptr<View<t_ctx0>> make_view_zero(std::shared_ptr<Table> table, std::string name,
        std::string separator, T config, T date_parser);

    /**
     * @brief Create a new one-sided view.
     *
     * One-sided views have one or more `row-pivots` applied,
     *
     * @tparam T
     * @param table
     * @param name
     * @param separator
     * @param config
     * @param date_parser
     * @return std::shared_ptr<View<t_ctx1>>
     */
    template <typename T>
    std::shared_ptr<View<t_ctx1>> make_view_one(std::shared_ptr<Table> table, std::string name,
        std::string separator, T config, T date_parser);

    /**
     * @brief Create a new two-sided view.
     *
     * Two sided views have one or more `row-pivots` and `column-pivots` applied, or they have
     * one or more `column-pivots` applied without any row pivots, hence the term `column_only`.
     *
     * @tparam T
     * @param table
     * @param name
     * @param separator
     * @param config
     * @param date_parser
     * @return std::shared_ptr<View<t_ctx2>>
     */
    template <typename T>
    std::shared_ptr<View<t_ctx2>> make_view_two(std::shared_ptr<Table> table, std::string name,
        std::string separator, T config, T date_parser);

    /**
     * @brief Create a new zero-sided context.
     *
     * Contexts contain the underlying aggregates, sort specifications, filter terms, and other
     * metadata allowing for data manipulation and view creation.
     *
     * @return std::shared_ptr<t_ctx0>
     */
    std::shared_ptr<t_ctx0> make_context_zero(std::shared_ptr<Table> table, t_schema schema,
        t_filter_op combiner, std::vector<std::string> columns, std::vector<t_fterm> filters,
        std::vector<t_sortspec> sorts, std::string name);

    /**
     * @brief Create a new one-sided context.
     *
     * @return std::shared_ptr<t_ctx1>
     */
    std::shared_ptr<t_ctx1> make_context_one(std::shared_ptr<Table> table, t_schema schema,
        std::vector<t_pivot> pivots, t_filter_op combiner, std::vector<t_fterm> filters,
        std::vector<t_aggspec> aggregates, std::vector<t_sortspec> sorts,
        std::int32_t pivot_depth, std::string name);

    /**
     * @brief Create a new two-sided context.
     *
     * @return std::shared_ptr<t_ctx2>
     */
    std::shared_ptr<t_ctx2> make_context_two(std::shared_ptr<Table> table, t_schema schema,
        std::vector<t_pivot> rpivots, std::vector<t_pivot> cpivots, t_filter_op combiner,
        std::vector<t_fterm> filters, std::vector<t_aggspec> aggregates,
        std::vector<t_sortspec> sorts, std::vector<t_sortspec> col_sorts,
        std::int32_t rpivot_depth, std::int32_t cpivot_depth, bool column_only,
        std::string name);

    /**
     * @brief Get a slice of data for a single column, serialized to t_val.
     *
     * @tparam
     * @param table
     * @param colname
     * @return t_val
     */
    template <typename T>
    T get_column_data(std::shared_ptr<t_data_table> table, std::string colname);

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