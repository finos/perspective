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

#ifdef PSP_ENABLE_WASM
#include <codecvt>
typedef std::codecvt_utf8<wchar_t> utf8convert_type;
typedef std::codecvt_utf8_utf16<wchar_t> utf16convert_type;
#endif

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
     * Manipulate scalar values
     */

    /**
     * @brief Converts a `t_scalar` to a value in the binding language.
     *
     * @tparam T
     * @param scalar
     */
    template <typename T>
    T scalar_to(const t_tscalar& scalar);

    /**
     * @brief namespace `arraybuffer` contains utilities for writing data in the Apache arrow format.
     *
     * Implementations of these methods access underlying heap memory and create contiguous
     * blocks of data which conform to the arrow schema; these methods should not be used to
     * parse `.arrow` files or access arrow-formatted data in memory. Instead, arrow data
     * parsing and manipulation should be implemented in the binding language, using appropriate
     * libraries.
     */
    namespace arraybuffer {

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
        const std::string& name, std::int32_t cidx, t_dtype type, bool is_update);

    template <typename T>
    void _fill_col_int64(T accessor, std::shared_ptr<t_column> col, const std::string& name,
        std::int32_t cidx, t_dtype type, bool is_update);

    template <typename T>
    void _fill_col_time(T accessor, std::shared_ptr<t_column> col, const std::string& name,
        std::int32_t cidx, t_dtype type, bool is_update);

    template <typename T>
    void _fill_col_date(T accessor, std::shared_ptr<t_column> col, const std::string& name,
        std::int32_t cidx, t_dtype type, bool is_update);

    template <typename T>
    void _fill_col_bool(T accessor, std::shared_ptr<t_column> col, const std::string& name,
        std::int32_t cidx, t_dtype type, bool is_update);

    template <typename T>
    void _fill_col_string(T accessor, std::shared_ptr<t_column> col, const std::string& name,
        std::int32_t cidx, t_dtype type, bool is_update);

    /**
     * @brief Change a value at a given index inside the column.
     */
    template <typename T>
    void set_column_nth(std::shared_ptr<t_column> col, t_uindex idx, T value);

    /**
     * @brief Create a computed column.
     * 
     * @tparam T 
     * @param table 
     * @param row_indices 
     * @param computed_def 
     */
    template <typename T>
    void add_computed_column(std::shared_ptr<t_data_table> table, std::shared_ptr<t_data_table> flattened, const std::vector<t_rlookup>& row_indices, T computed_def);

    /**
     * @brief Given a list of computed column declarations in the binding 
     * language, convert them to C++ lambdas that allow access from deeper 
     * inside the engine without importing the semantics of t_val. 
     * 
     * @tparam T 
     * @param computed 
     * @return std::vector<t_computed_column_lambda> 
     */
    template <typename T>
    std::vector<t_computed_column_lambda>
    make_computed_lambdas(std::vector<T> computed);

    /**
     * @brief Return a map of computed function metadata for use in the binding
     * language. Keys are strings that map to maps containing strings of
     * the following metadata:
     * 
     * - computed_function_name: the name of the computed function
     * - input_type: the type of its input columns (all input columns are of
     * the same type)
     * - return_type: the return type of its output column
     * - group: a category for the function
     * 
     * @return std::map<std::string, std::map<std::string, std::string>> 
     */
    std::map<std::string, std::map<std::string, std::string>>
    get_computed_functions();

    /**
     * @brief Utility function for accessing columns and adding data.
     * 
     * @tparam T 
     * @param accessor 
     * @param tbl 
     * @param col 
     * @param name 
     * @param cidx 
     * @param type 
     * @param is_update 
     */
    template <typename T>
    void _fill_data_helper(T accessor, t_data_table& tbl,
        std::shared_ptr<t_column> col, const std::string& name, std::int32_t cidx, t_dtype type,
        bool is_update);

    /**
     * @brief Given a table, iterate through each column and fill it with data.
     *
     * @tparam T
     * @param tbl
     * @param accessor
     * @param input_schema 
     * @param is_update
     */
    template <typename T>
    void _fill_data(t_data_table& tbl, T accessor, const t_schema& input_schema, const std::string& index, std::uint32_t offset, std::uint32_t limit, bool is_update);

    /**
     * @brief Create and populate a table.
     *
     * @tparam
     * @param pool
     * @param gnode
     * @param accessor
     * @param computed
     * @param limit
     * @param index
     * @param is_update
     * @param is_arrow
     * @return std::shared_ptr<t_gnode>
     */
    template <typename T>
    std::shared_ptr<Table> make_table(T table, T accessor, T computed,
        std::uint32_t limit, const std::string& index, t_op op, bool is_update, bool is_arrow);

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

    /******************************************************************************
     *
     * View API
     */

    /**
     * @brief is the filter term and operand combination valid?
     *
     * If the operand is null/not null then it is always valid.
     * Is the filter term is a valid date?  Otherwise, make sure
     * the filter term is not null/undefined.
     *
     * @tparam T
     * @param column_type
     * @param date_parser
     * @param filter_term
     * @param filter_operator
     * @return true
     * @return false
     */
    template <typename T>
    bool is_valid_filter(t_dtype column_type, T date_parser, t_filter_op filter_operator, T filter_term);

    /**
    * @brief Create a filter by parsing the filter term from the binding language.
    * 
    * @tparam T 
    * @param column_type 
    * @param date_parser 
    * @param column_name 
    * @param filter_op_str 
    * @param filter_term 
    * @return std::tuple<std::string, std::string, std::vector<t_tscalar>> 
    */
    template <typename T>
    std::tuple<std::string, std::string, std::vector<t_tscalar>> make_filter_term(
        t_dtype column_type, T date_parser, const std::string& column_name, const std::string& filter_op_str, T filter_term);
    /**
     * @brief Create a shared pointer to a `t_view_config` object from the
     * binding language's `view_config` object.
     *
     * @tparam T
     * @param schema
     * @param date_parser
     * @param config
     * @return t_config
     */
    template <typename T>
    std::shared_ptr<t_view_config> make_view_config(
        const t_schema& schema, T date_parser, T config);

    /**
     * @brief Create a new view.
     *
     * Zero-sided views have no pivots or aggregates applied.
     *
     * Views are backed by an underlying `t_ctx_*` object, represented by the `CTX_T` template.
     *
     * One-sided views have one or more `row_pivots` applied.
     *
     * Two sided views have one or more `row_pivots` and `column_pivots` applied, or they have
     * one or more `column_pivots` applied without any row pivots, hence the term `column_only`.
     *
     * @tparam T
     * @param table
     * @param name
     * @param separator
     * @param config
     * @param date_parser
     * @return std::shared_ptr<View<CTX_T>>
     */
    template <typename T, typename CTX_T>
    std::shared_ptr<View<CTX_T>> make_view(std::shared_ptr<Table> table, const std::string& name,
        const std::string& separator, T view_config, T date_parser);

    /**
     * @brief Create a new context of type `CTX_T`, which will be one of 3 types:
     *
     * `t_ctx0`, `t_ctx1`, `t_ctx2`.
     *
     *
     * Contexts contain the underlying aggregates, sort specifications, filter terms, and other
     * metadata allowing for data manipulation and view creation.
     *
     * @return std::shared_ptr<CTX_T>
     */
    template <typename CTX_T>
    std::shared_ptr<CTX_T> make_context(
        std::shared_ptr<Table> table,
        const t_schema& schema,
        std::shared_ptr<t_view_config> view_config,
        const std::string& name);

    /**
     * @brief Get a slice of data for a single column, serialized to t_val.
     *
     * @tparam
     * @param table
     * @param colname
     * @return t_val
     */
    template <typename T>
    T get_column_data(std::shared_ptr<t_data_table> table, const std::string& colname);

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
