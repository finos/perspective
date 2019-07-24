/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#ifdef PSP_ENABLE_PYTHON
#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/data_table.h>
#include <perspective/column.h>
#include <perspective/gnode.h>
#include <iostream>


namespace perspective {
namespace binding {
perspective::t_schema* t_schema_init(py::list& columns, py::list& types);

template<typename T>
void _fill_col(std::vector<T>& dcol, std::shared_ptr<perspective::t_column> col);

template<typename T>
void _fill_col_np(np::ndarray& dcol, std::shared_ptr<perspective::t_column> col);


void _fill_data_single_column(perspective::t_data_table& tbl,
                              const std::string& colname_i,
                              py::list& data_cols_i,
                              perspective::t_dtype col_type);

void _fill_data_single_column_np(perspective::t_data_table& tbl,
                                 const std::string& colname_i,
                                 np::ndarray& data_cols_i,
                                 perspective::t_dtype col_type);

np::ndarray _get_as_numpy(perspective::t_data_table& tbl, const std::string& colname_i);
}
}



/******************************************************************************
 *
 * Boost Python binding
 */
using namespace perspective::binding;

BOOST_PYTHON_MODULE(libbinding)
{
    np::initialize(true);
    _import_array();

    /******************************************************************************
     *
     * t_column
     */
    py::class_<perspective::t_column>("t_column", py::init<>())
        // when multiple overloading methods, need to static_cast to specify
        .def("pprint", static_cast<void (perspective::t_column::*)() const>(&perspective::t_column::pprint))
        .def("set_scalar", &perspective::t_column::set_scalar)
    ;

    /******************************************************************************
     *
     * t_data_table
     */
    // need boost:noncopyable for PSP_NON_COPYABLE
    py::class_<perspective::t_data_table, boost::noncopyable>("t_data_table", py::init<perspective::t_schema>())
        .def("init", &perspective::t_data_table::init)
        .def("clear", &perspective::t_data_table::clear)
        .def("reset", &perspective::t_data_table::reset)
        .def("size", &perspective::t_data_table::size)
        .def("reserve", &perspective::t_data_table::reserve)
        .def("extend", &perspective::t_data_table::extend)
        .def("set_size", &perspective::t_data_table::set_size)

        .def("num_columns", &perspective::t_data_table::num_columns)
        .def("get_capacity", &perspective::t_data_table::get_capacity)

        // when returning const, need return_value_policy<copy_const_reference>
        .def("name", &perspective::t_data_table::name, py::return_value_policy<py::copy_const_reference>())
        .def("get_schema", &perspective::t_data_table::get_schema, py::return_value_policy<py::copy_const_reference>())

        // when multiple overloading methods, need to static_cast to specify
        .def("num_rows", static_cast<perspective::t_uindex (perspective::t_data_table::*)() const> (&perspective::t_data_table::num_rows))
        
        .def("pprint", static_cast<void (perspective::t_data_table::*)() const>(&perspective::t_data_table::pprint))
        .def("pprint", static_cast<void (perspective::t_data_table::*)(perspective::t_uindex, std::ostream*) const>(&perspective::t_data_table::pprint))
        .def("pprint", static_cast<void (perspective::t_data_table::*)(const std::string&) const>(&perspective::t_data_table::pprint))
        .def("pprint", static_cast<void (perspective::t_data_table::*)(const std::vector<perspective::t_uindex>&) const>(&perspective::t_data_table::pprint))


        // custom add ins
        // .def("load_column", _fill_data_single_column)
        .def("load_column", static_cast<void (*)(perspective::t_data_table& tbl, const std::string& colname_i, py::list& data_cols_i, perspective::t_dtype col_type)>(_fill_data_single_column))
        .def("load_column", static_cast<void (*)(perspective::t_data_table& tbl, const std::string& colname_i, np::ndarray& data_cols_i, perspective::t_dtype col_type)>(_fill_data_single_column_np))
        .def("get_column", _get_as_numpy)
        .def("add_column", &perspective::t_data_table::add_column, py::return_value_policy<py::reference_existing_object>())
    ;

    /******************************************************************************
     *
     * t_schema
     */
    py::class_<perspective::t_schema>("t_schema",
        py::init<std::vector<std::string>, std::vector<perspective::t_dtype> >())
        .def(py::init<>())
        .def(py::init<perspective::t_schema_recipe>())

        // custom constructor wrapper to make from python lists
        .def("__init__", py::make_constructor(&t_schema_init))

        // regular methods
        .def("get_num_columns", &perspective::t_schema::get_num_columns)
        .def("size", &perspective::t_schema::size)
        .def("get_colidx", &perspective::t_schema::get_colidx)
        .def("get_dtype", &perspective::t_schema::get_dtype)
        .def("is_pkey", &perspective::t_schema::is_pkey)
        .def("add_column", &perspective::t_schema::add_column)
        .def("get_recipe", &perspective::t_schema::get_recipe)
        .def("has_column", &perspective::t_schema::has_column)
        .def("get_table_context", &perspective::t_schema::get_table_context)
        .def("get_table_context", &perspective::t_schema::get_table_context)
        .def("str", &perspective::t_schema::str)

        // when returning const, need return_value_policy<copy_const_reference>
        .def("columns", &perspective::t_schema::columns, py::return_value_policy<py::copy_const_reference>())
        .def("types", &perspective::t_schema::types)
    ;

    /******************************************************************************
     *
     * t_gnode
     */
    py::class_<perspective::t_gnode>("t_gnode", py::init<perspective::t_schema, perspective::t_schema>())
        .def(py::init<
            perspective::t_gnode_processing_mode,
            const perspective::t_schema&,
            const std::vector<perspective::t_schema>&,
            const std::vector<perspective::t_schema>&,
            const std::vector<perspective::t_custom_column>
            >())
        .def("pprint", static_cast<void (perspective::t_gnode::*)() const>(&perspective::t_gnode::pprint))
        .def("get_id", &perspective::t_gnode::get_id)
        .def("get_tblschema", &perspective::t_gnode::get_id)
        .def("get_table", &perspective::t_gnode::get_id)
    ;


    /******************************************************************************
     *
     * t_ctx0
     */
    py::class_<perspective::t_ctx0>("t_ctx0", py::init<perspective::t_schema, perspective::t_config>())
        .def("sidedness", &perspective::t_ctx0::sidedness)
        .def("get_row_count", &perspective::t_ctx0::get_row_count)
        .def("get_column_count", &perspective::t_ctx0::get_column_count)
        .def("get_data", &perspective::t_ctxbase<perspective::t_ctx0>::get_data)
        .def("get_step_delta", &perspective::t_ctx0::get_step_delta)
        .def("get_cell_delta", &perspective::t_ctx0::get_cell_delta)
        .def("get_column_names", &perspective::t_ctx0::get_column_names)
        .def("unity_get_row_data", &perspective::t_ctx0::unity_get_row_data)
        .def("unity_get_column_data", &perspective::t_ctx0::unity_get_column_data)
        .def("unity_get_row_path", &perspective::t_ctx0::unity_get_row_path)
        .def("unity_get_column_path", &perspective::t_ctx0::unity_get_column_path)
        .def("unity_get_row_depth", &perspective::t_ctx0::unity_get_row_depth)
        .def("unity_get_column_depth", &perspective::t_ctx0::unity_get_column_depth)
        .def("unity_get_column_name", &perspective::t_ctx0::unity_get_column_name)
        .def("unity_get_column_display_name", &perspective::t_ctx0::unity_get_column_display_name)
        .def("unity_get_column_names", &perspective::t_ctx0::unity_get_column_names)
        .def("unity_get_column_display_names", &perspective::t_ctx0::unity_get_column_display_names)
        .def("unity_get_column_count", &perspective::t_ctx0::unity_get_column_count)
        .def("unity_get_row_count", &perspective::t_ctx0::unity_get_row_count)
        .def("unity_get_row_expanded", &perspective::t_ctx0::unity_get_row_expanded)
        .def("unity_get_column_expanded", &perspective::t_ctx0::unity_get_column_expanded)
        .def("unity_init_load_step_end", &perspective::t_ctx0::unity_init_load_step_end)
    ;

    /******************************************************************************
     *
     * t_ctx1
     */
    py::class_<perspective::t_ctx1>("t_ctx1", py::init<perspective::t_schema, perspective::t_config>())
        .def("sidedness", &perspective::t_ctx1::sidedness)
        .def("get_row_count", &perspective::t_ctx1::get_row_count)
        .def("get_column_count", &perspective::t_ctx1::get_column_count)
        .def("get_data", &perspective::t_ctxbase<perspective::t_ctx1>::get_data)
        .def("get_step_delta", &perspective::t_ctx1::get_step_delta)
        .def("get_cell_delta", &perspective::t_ctx1::get_cell_delta)
        .def("set_depth", &perspective::t_ctx1::set_depth)
        // .def("open", &perspective::t_ctx1::open)
        // .def("close", &perspective::t_ctx1::close)
        .def("get_trav_depth", &perspective::t_ctx1::get_trav_depth)
        .def("get_column_names", &perspective::t_ctx1::get_aggregates)
        .def("unity_get_row_data", &perspective::t_ctx1::unity_get_row_data)
        .def("unity_get_column_data", &perspective::t_ctx1::unity_get_column_data)
        .def("unity_get_row_path", &perspective::t_ctx1::unity_get_row_path)
        .def("unity_get_column_path", &perspective::t_ctx1::unity_get_column_path)
        .def("unity_get_row_depth", &perspective::t_ctx1::unity_get_row_depth)
        .def("unity_get_column_depth", &perspective::t_ctx1::unity_get_column_depth)
        .def("unity_get_column_name", &perspective::t_ctx1::unity_get_column_name)
        .def("unity_get_column_display_name", &perspective::t_ctx1::unity_get_column_display_name)
        .def("unity_get_column_names", &perspective::t_ctx1::unity_get_column_names)
        .def("unity_get_column_display_names", &perspective::t_ctx1::unity_get_column_display_names)
        .def("unity_get_column_count", &perspective::t_ctx1::unity_get_column_count)
        .def("unity_get_row_count", &perspective::t_ctx1::unity_get_row_count)
        .def("unity_get_row_expanded", &perspective::t_ctx1::unity_get_row_expanded)
        .def("unity_get_column_expanded", &perspective::t_ctx1::unity_get_column_expanded)
        .def("unity_init_load_step_end", &perspective::t_ctx1::unity_init_load_step_end)
    ;

    /******************************************************************************
     *
     * t_ctx2
     */
    py::class_<perspective::t_ctx2>("t_ctx2", py::init<perspective::t_schema, perspective::t_config>())
        .def("sidedness", &perspective::t_ctx2::sidedness)
        .def("get_row_count", &perspective::t_ctx2::get_row_count)
        .def("get_column_count", &perspective::t_ctx2::get_column_count)
        .def("get_data", &perspective::t_ctxbase<perspective::t_ctx2>::get_data)
        .def("get_step_delta", &perspective::t_ctx2::get_step_delta)
        .def("set_depth", &perspective::t_ctx2::set_depth)
        // .def("open", &perspective::t_ctx2::open)
        // .def("close", &perspective::t_ctx2::close)
        .def("get_column_names", &perspective::t_ctx2::get_aggregates)
        .def("unity_get_row_data", &perspective::t_ctx2::unity_get_row_data)
        .def("unity_get_column_data", &perspective::t_ctx2::unity_get_column_data)
        .def("unity_get_row_path", &perspective::t_ctx2::unity_get_row_path)
        .def("unity_get_column_path", &perspective::t_ctx2::unity_get_column_path)
        .def("unity_get_row_depth", &perspective::t_ctx2::unity_get_row_depth)
        .def("unity_get_column_depth", &perspective::t_ctx2::unity_get_column_depth)
        .def("unity_get_column_name", &perspective::t_ctx2::unity_get_column_name)
        .def("unity_get_column_display_name", &perspective::t_ctx2::unity_get_column_display_name)
        .def("unity_get_column_names", &perspective::t_ctx2::unity_get_column_names)
        .def("unity_get_column_display_names", &perspective::t_ctx2::unity_get_column_display_names)
        .def("unity_get_column_count", &perspective::t_ctx2::unity_get_column_count)
        .def("unity_get_row_count", &perspective::t_ctx2::unity_get_row_count)
        .def("unity_get_row_expanded", &perspective::t_ctx2::unity_get_row_expanded)
        .def("unity_get_column_expanded", &perspective::t_ctx2::unity_get_column_expanded)
        .def("unity_init_load_step_end", &perspective::t_ctx2::unity_init_load_step_end)
        .def("get_totals", &perspective::t_ctx2::get_totals)
        .def("get_column_path_userspace", &perspective::t_ctx2::get_column_path_userspace)
    ;


    /******************************************************************************
     *
     * t_pool
     */
    py::class_<perspective::t_pool, boost::noncopyable>("t_pool", py::no_init)
        .def("register_gnode", &perspective::t_pool::register_gnode)
        .def("process", &perspective::t_pool::_process)
        .def("send", &perspective::t_pool::send)
        .def("epoch", &perspective::t_pool::epoch)
        .def("unregister_gnode", &perspective::t_pool::unregister_gnode)
        // .def("set_update_delegate", &perspective::t_pool::set_update_delegate)
        .def("register_context", &perspective::t_pool::register_context)
        .def("unregister_context", &perspective::t_pool::unregister_context)
        .def("get_contexts_last_updated", &perspective::t_pool::get_contexts_last_updated)
        .def("get_gnodes_last_updated", &perspective::t_pool::get_gnodes_last_updated)
        .def("get_gnode", &perspective::t_pool::get_gnode, py::return_value_policy<py::reference_existing_object>())
    ;


    /******************************************************************************
     *
     * t_aggspec
     */
    py::class_<perspective::t_aggspec>("t_aggspec", py::init<>())
        .def("name", &perspective::t_aggspec::name)
    ;

    /******************************************************************************
     *
     * t_tscalar
     */
    py::class_<perspective::t_tscalar>("t_tscalar", py::init<>())
    ;

    /******************************************************************************
     *
     * t_updctx
     */
    // TODO
    // value_object<t_updctx>("t_updctx")
    //     .field("gnode_id", &t_updctx::m_gnode_id)
    //     .field("ctx_name", &t_updctx::m_ctx);

    /******************************************************************************
     *
     * t_cellupd
     */
    // TODO
    // value_object<t_cellupd>("t_cellupd")
    //     .field("row", &t_cellupd::row)
    //     .field("column", &t_cellupd::column)
    //     .field("old_value", &t_cellupd::old_value)
    //     .field("new_value", &t_cellupd::new_value);

    /******************************************************************************
     *
     * t_stepdelta
     */
    // TODO
    // value_object<t_stepdelta>("t_stepdelta")
    //     .field("rows_changed", &t_stepdelta::rows_changed)
    //     .field("columns_changed", &t_stepdelta::columns_changed)
    //     .field("cells", &t_stepdelta::cells);

    /******************************************************************************
     *
     * vector
     */
    // TODO
    // register_vector<t_dtype>("std::vector<t_dtype>");
    // register_vector<t_cellupd>("std::vector<t_cellupd>");
    // register_vector<t_aggspec>("std::vector<t_aggspec>");
    // register_vector<t_tscalar>("std::vector<t_tscalar>");
    // register_vector<std::string>("std::vector<std::string>");
    // register_vector<t_updctx>("std::vector<t_updctx>");
    // register_vector<t_uindex>("std::vector<t_uindex>");

    /******************************************************************************
     *
     * t_header
     */
    py::enum_<perspective::t_header>("t_header")
        .value("HEADER_ROW", perspective::HEADER_ROW)
        .value("HEADER_COLUMN", perspective::HEADER_COLUMN);

    /******************************************************************************
     *
     * t_ctx_type
     */
    py::enum_<perspective::t_ctx_type>("t_ctx_type")
        .value("ZERO_SIDED_CONTEXT", perspective::ZERO_SIDED_CONTEXT)
        .value("ONE_SIDED_CONTEXT", perspective::ONE_SIDED_CONTEXT)
        .value("TWO_SIDED_CONTEXT", perspective::TWO_SIDED_CONTEXT)
        .value("GROUPED_ZERO_SIDED_CONTEXT", perspective::GROUPED_ZERO_SIDED_CONTEXT)
        .value("GROUPED_PKEY_CONTEXT", perspective::GROUPED_PKEY_CONTEXT)
        .value("GROUPED_COLUMNS_CONTEXT", perspective::GROUPED_COLUMNS_CONTEXT);

    /******************************************************************************
     *
     * t_filter_op
     */
    py::enum_<perspective::t_filter_op>("t_filter_op")
        .value("FILTER_OP_LT", perspective::FILTER_OP_LT)
        .value("FILTER_OP_LTEQ", perspective::FILTER_OP_LTEQ)
        .value("FILTER_OP_GT", perspective::FILTER_OP_GT)
        .value("FILTER_OP_GTEQ", perspective::FILTER_OP_GTEQ)
        .value("FILTER_OP_EQ", perspective::FILTER_OP_EQ)
        .value("FILTER_OP_NE", perspective::FILTER_OP_NE)
        .value("FILTER_OP_BEGINS_WITH", perspective::FILTER_OP_BEGINS_WITH)
        .value("FILTER_OP_ENDS_WITH", perspective::FILTER_OP_ENDS_WITH)
        .value("FILTER_OP_CONTAINS", perspective::FILTER_OP_CONTAINS)
        .value("FILTER_OP_OR", perspective::FILTER_OP_OR)
        .value("FILTER_OP_IN", perspective::FILTER_OP_IN)
        .value("FILTER_OP_NOT_IN", perspective::FILTER_OP_NOT_IN)
        .value("FILTER_OP_AND", perspective::FILTER_OP_AND)
        .value("FILTER_OP_IS_VALID", perspective::FILTER_OP_IS_VALID)
        .value("FILTER_OP_IS_NOT_VALID", perspective::FILTER_OP_IS_NOT_VALID);

    /******************************************************************************
     *
     * t_dtype
     */
    py::enum_<perspective::t_dtype>("t_dtype")
        .value("NONE", perspective::DTYPE_NONE)
        .value("INT64", perspective::DTYPE_INT64)
        .value("INT32", perspective::DTYPE_INT32)
        .value("INT16", perspective::DTYPE_INT16)
        .value("INT8", perspective::DTYPE_INT8)
        .value("UINT64", perspective::DTYPE_UINT64)
        .value("UINT32", perspective::DTYPE_UINT32)
        .value("UINT16", perspective::DTYPE_UINT16)
        .value("UINT8", perspective::DTYPE_UINT8)
        .value("FLOAT64", perspective::DTYPE_FLOAT64)
        .value("FLOAT32", perspective::DTYPE_FLOAT32)
        .value("BOOL", perspective::DTYPE_BOOL)
        .value("TIME", perspective::DTYPE_TIME)
        .value("DATE", perspective::DTYPE_DATE)
        .value("ENUM", perspective::DTYPE_ENUM)
        .value("OID", perspective::DTYPE_OID)
        .value("PTR", perspective::DTYPE_PTR)
        .value("F64PAIR", perspective::DTYPE_F64PAIR)
        .value("USER_FIXED", perspective::DTYPE_USER_FIXED)
        .value("STR", perspective::DTYPE_STR)
        .value("USER_VLEN", perspective::DTYPE_USER_VLEN)
        .value("LAST_VLEN", perspective::DTYPE_LAST_VLEN)
        .value("LAST", perspective::DTYPE_LAST)
    ;

    /******************************************************************************
     *
     * t_aggtype
     */
    py::enum_<perspective::t_aggtype>("t_aggtype")
        .value("AGGTYPE_SUM", perspective::AGGTYPE_SUM)
        .value("AGGTYPE_MUL", perspective::AGGTYPE_MUL)
        .value("AGGTYPE_COUNT", perspective::AGGTYPE_COUNT)
        .value("AGGTYPE_MEAN", perspective::AGGTYPE_MEAN)
        .value("AGGTYPE_WEIGHTED_MEAN", perspective::AGGTYPE_WEIGHTED_MEAN)
        .value("AGGTYPE_UNIQUE", perspective::AGGTYPE_UNIQUE)
        .value("AGGTYPE_ANY", perspective::AGGTYPE_ANY)
        .value("AGGTYPE_MEDIAN", perspective::AGGTYPE_MEDIAN)
        .value("AGGTYPE_JOIN", perspective::AGGTYPE_JOIN)
        .value("AGGTYPE_SCALED_DIV", perspective::AGGTYPE_SCALED_DIV)
        .value("AGGTYPE_SCALED_ADD", perspective::AGGTYPE_SCALED_ADD)
        .value("AGGTYPE_SCALED_MUL", perspective::AGGTYPE_SCALED_MUL)
        .value("AGGTYPE_DOMINANT", perspective::AGGTYPE_DOMINANT)
        .value("AGGTYPE_FIRST", perspective::AGGTYPE_FIRST)
        .value("AGGTYPE_LAST", perspective::AGGTYPE_LAST)
        .value("AGGTYPE_PY_AGG", perspective::AGGTYPE_PY_AGG)
        .value("AGGTYPE_AND", perspective::AGGTYPE_AND)
        .value("AGGTYPE_OR", perspective::AGGTYPE_OR)
        .value("AGGTYPE_LAST_VALUE", perspective::AGGTYPE_LAST_VALUE)
        .value("AGGTYPE_HIGH_WATER_MARK", perspective::AGGTYPE_HIGH_WATER_MARK)
        .value("AGGTYPE_LOW_WATER_MARK", perspective::AGGTYPE_LOW_WATER_MARK)
        .value("AGGTYPE_UDF_COMBINER", perspective::AGGTYPE_UDF_COMBINER)
        .value("AGGTYPE_UDF_REDUCER", perspective::AGGTYPE_UDF_REDUCER)
        .value("AGGTYPE_SUM_ABS", perspective::AGGTYPE_SUM_ABS)
        .value("AGGTYPE_SUM_NOT_NULL", perspective::AGGTYPE_SUM_NOT_NULL)
        .value("AGGTYPE_MEAN_BY_COUNT", perspective::AGGTYPE_MEAN_BY_COUNT)
        .value("AGGTYPE_IDENTITY", perspective::AGGTYPE_IDENTITY)
        .value("AGGTYPE_DISTINCT_COUNT", perspective::AGGTYPE_DISTINCT_COUNT)
        .value("AGGTYPE_DISTINCT_LEAF", perspective::AGGTYPE_DISTINCT_LEAF)
        .value("AGGTYPE_PCT_SUM_PARENT", perspective::AGGTYPE_PCT_SUM_PARENT)
        .value("AGGTYPE_PCT_SUM_GRAND_TOTAL", perspective::AGGTYPE_PCT_SUM_GRAND_TOTAL);

    /******************************************************************************
     *
     * t_totals
     */
    py::enum_<perspective::t_totals>("t_totals")
        .value("TOTALS_BEFORE", perspective::TOTALS_BEFORE)
        .value("TOTALS_HIDDEN", perspective::TOTALS_HIDDEN)
        .value("TOTALS_AFTER", perspective::TOTALS_AFTER);

    /******************************************************************************
     *
     * assorted functions
     */
    // py::def("sort", sort<py::object>);
    py::def("make_table", make_table<py::object>);
    py::def("make_gnode", make_gnode);
    py::def("clone_gnode_table", clone_gnode_table<py::object>);
    // py::def("make_context_zero", make_context_zero);
    // py::def("make_context_one", make_context_one);
    // py::def("make_context_two", make_context_two);
    // py::def("scalar_to_val", scalar_to_val);
    // py::def("scalar_vec_to_val", scalar_vec_to_val);
    py::def("table_add_computed_column", table_add_computed_column<py::object>);
    py::def("set_column_nth", set_column_nth<py::object>);
    // py::def("get_data_zero", get_data<std::shared_ptr<perspective::t_ctx0>>);
    // py::def("get_data_one", get_data<std::shared_ptr<perspective::t_ctx1>>);
    // py::def("get_data_two", get_data<std::shared_ptr<perspective::t_ctx2>>);
    // py::def("get_data_two_skip_headers", get_data_two_skip_headers<py::object>);
    // py::def("col_to_js_typed_array_zero", col_to_js_typed_array<std::shared_ptr<t_ctx0>>);
    // py::def("col_to_js_typed_array_one", col_to_js_typed_array<std::shared_ptr<t_ctx1>>);
    // py::def("col_to_js_typed_array_two", col_to_js_typed_array<std::shared_ptr<t_ctx2>>);


/******************************************************************************/
}


#endif
