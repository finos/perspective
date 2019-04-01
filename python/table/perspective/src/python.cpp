/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#ifdef PSP_ENABLE_PYTHON

#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/python.h>
#include <perspective/gnode.h>
#include <perspective/table.h>
#include <perspective/pool.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <perspective/sym_table.h>
#include <random>
#include <cmath>
#include <sstream>
#include <codecvt>
#include <boost/optional.hpp>
#include <cstdint>

namespace perspective {
namespace binding {

perspective::t_schema* t_schema_init(py::list& columns, py::list& types)
{
    std::vector<std::string> cols;
    std::vector<perspective::t_dtype> ts;

    for(ssize_t i=0; i < py::len(columns); i++) {
        cols.push_back(py::extract<std::string>(columns[i]));
    }

    for(ssize_t i=0; i < py::len(types); i++) {
        ts.push_back(py::extract<perspective::t_dtype>(types[i]));
    }

    return new perspective::t_schema(cols, ts);
}

template<typename T>
void _fill_col(std::vector<T>& dcol, std::shared_ptr<perspective::t_column> col)
{
    perspective::t_uindex nrows = col->size();

    for (auto i = 0; i < nrows; ++i)
    {
        auto elem = dcol[i];
        // std::cout << elem << std::endl;
        col->set_nth(i, elem);
    }
}

template<typename T>
void _fill_col_np(np::ndarray& dcol, std::shared_ptr<perspective::t_column>col)
{
    perspective::t_uindex nrows = col->size();
    for (auto i = 0; i < nrows; ++i)
    {
        // auto elem = dcol[i];
        auto elem = reinterpret_cast<T *>(dcol.get_data()+(i*sizeof(T)));
        // T elem = py::extract<T>(dcol[i]);
        // std::cout << *elem << std::endl;
        col->set_nth(i, *elem);
    }
}

void _fill_data_single_column(perspective::t_table& tbl,
                              const std::string& colname_i,
                              py::list& data_cols_i,
                              perspective::t_dtype col_type)
{
    std::string name = colname_i;
    std::shared_ptr<perspective::t_column> col = tbl.get_column(name);

    switch(col_type){
        case perspective::DTYPE_INT64 : {
            std::vector<std::int64_t> dcol;

            for(ssize_t i=0; i < py::len(data_cols_i); i++)
            {
                dcol.push_back(py::extract<std::int64_t>(data_cols_i[i]));
            }

            _fill_col<std::int64_t>(dcol, col);
            break;
        }
        case perspective::DTYPE_UINT64 : {
            std::vector<std::uint64_t> dcol;

            for(ssize_t i=0; i < py::len(data_cols_i); i++)
            {
                dcol.push_back(py::extract<std::uint64_t>(data_cols_i[i]));
            }

            _fill_col<std::uint64_t>(dcol, col);
            break;
        }
        case perspective::DTYPE_FLOAT64 : {
            std::vector<double> dcol;

            for(ssize_t i=0; i < py::len(data_cols_i); i++)
            {
                dcol.push_back(py::extract<double>(data_cols_i[i]));
            }

            _fill_col<double>(dcol, col);
            break;
        }
        case perspective::DTYPE_BOOL : {
            //FIXME segfault
            std::vector<bool> dcol;

            for(ssize_t i=0; i < py::len(data_cols_i); i++)
            {
                dcol.push_back(py::extract<bool>(data_cols_i[i]));
            }

            _fill_col<bool>(dcol, col);
            break;
        }
        case perspective::DTYPE_STR : {

            std::vector<std::string> dcol;

            for(ssize_t i=0; i < py::len(data_cols_i); i++)
            {
                dcol.push_back(py::extract<std::string>(data_cols_i[i]));
            }

            _fill_col<std::string>(dcol, col);
            break;
        }
        default: {
            break;
        }
    }
}

void
_fill_data_single_column_np(perspective::t_table& tbl,
                            const std::string& colname_i,
                            np::ndarray& dcol,
                            perspective::t_dtype col_type)
{
    std::string name = colname_i;
    std::shared_ptr<perspective::t_column> col = tbl.get_column(name);

    switch(col_type){
        case perspective::DTYPE_INT64 : {
            _fill_col_np<std::int64_t>(dcol, col);
            break;
        }
        case perspective::DTYPE_FLOAT64 : {
            _fill_col_np<double>(dcol, col);
            break;
        }
        case perspective::DTYPE_STR : {
            _fill_col_np<std::string>(dcol, col);
            break;
        }
        default: {
            break;
        }
    }
}


np::ndarray _get_as_numpy(perspective::t_table& tbl, const std::string& colname_i)
{
    std::string name = colname_i;
    std::shared_ptr<perspective::t_column> col = tbl.get_column(name);
    return col->_as_numpy();
}









template <typename T, typename U>
std::vector<U> vecFromArray(T& arr){
    //TODO
    std::vector<U> ret;
    return ret;
}


/******************************************************************************
 *
 * Data Loading
 */
template <>
std::vector<t_sortspec> _get_sort(
        std::vector<std::string>& col_names, bool is_column_sort, py::object j_sortby) {
    // TODO
    std::vector<t_sortspec> svec{};
    return svec;
}

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
template <> 
std::vector<t_fterm>
_get_fterms(t_schema schema, py::object j_date_parser, py::object j_filters) {
    // TODO
    std::vector<t_fterm> fvec{};
    return fvec;
}

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
std::vector<t_aggspec>
_get_aggspecs(py::object j_aggs) {
    // TODO
    std::vector<t_aggspec> aggspecs;
    return aggspecs;
}

/**
 * Converts a scalar value to its Python representation.
 *
 * Params
 * ------
 * t_tscalar scalar
 *
 * Returns
 * -------
 * py::object
 */
template <>
py::object scalar_to(const t_tscalar& scalar) {
    if (!scalar.is_valid()) {
        return py::object(); //None
    }
    switch (scalar.get_dtype()) {
        case DTYPE_BOOL: {
            if (scalar) {
                return py::object(true);
            } else {
                return py::object(false);
            }
        }
        case DTYPE_TIME:
        case DTYPE_FLOAT64:
        case DTYPE_FLOAT32: {
            return py::object(scalar.to_double());
        }
        case DTYPE_DATE: {
            // TODO
            // return t_date_to_jsdate(scalar.get<t_date>()).call<val>("getTime");
        }
        case DTYPE_UINT8:
        case DTYPE_UINT16:
        case DTYPE_UINT32:
        case DTYPE_INT8:
        case DTYPE_INT16:
        case DTYPE_INT32: {
            return py::object(static_cast<std::int32_t>(scalar.to_int64()));
        }
        case DTYPE_UINT64:
        case DTYPE_INT64: {
            // This could potentially lose precision
            return py::object(static_cast<std::int32_t>(scalar.to_int64()));
        }
        case DTYPE_NONE: {
            return py::object(); //None
        }
        case DTYPE_STR:
        default: {
            std::wstring_convert<utf8convert_type, wchar_t> converter("", L"<Invalid>");
            return py::str(converter.from_bytes(scalar.to_string()));
        }
    }
}


/**
 * Fills the table with data from Javascript.
 *
 * Params
 * ------
 * tbl - pointer to the table object
 * ocolnames - vector of column names
 * accessor - the JS data accessor interface
 * odt - vector of data types
 * offset
 * is_arrow - flag for arrow data
 *
 * Returns
 * -------
 *
 */
void
_fill_data(t_table& tbl, std::vector<std::string> ocolnames, py::object accessor,
    std::vector<t_dtype> odt, std::uint32_t offset, bool is_arrow, bool is_update) {
    //TODO
}

/******************************************************************************
 *
 * Public
 */
template<typename T>
void set_column_nth(t_column* col, t_uindex idx, T value) {
    //TODO
}

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
template<typename T>
void table_add_computed_column(t_table& table, T computed_defs) {
    //TODO
}

/**
 * DataAccessor
 *
 * parses and converts input data into a canonical format for
 * interfacing with Perspective.
 */

// Name parsing
std::vector<std::string>
column_names(py::object data, std::int32_t format) {
    //TODO
    std::vector<std::string> names;
    return names;
}

// Type inferrence for fill_col and data_types
t_dtype
infer_type(py::object x, py::object date_validator) {
    //TODO
    t_dtype t = t_dtype::DTYPE_STR;
    return t;
}

t_dtype
get_data_type(py::object data, std::int32_t format, std::string name, py::object date_validator) {
    //TODO
    return t_dtype::DTYPE_STR;
}

std::vector<t_dtype>
data_types(py::object data, std::int32_t format, std::vector<std::string> names, py::object date_validator) {
    //TODO
    if (names.size() == 0) {
        PSP_COMPLAIN_AND_ABORT("Cannot determine data types without column names!");
    }
    std::vector<t_dtype> types;
    return types;
}

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
std::shared_ptr<t_gnode>
make_gnode(const t_schema& iscm) {
    std::vector<std::string> ocolnames(iscm.columns());
    std::vector<t_dtype> odt(iscm.types());

    if (iscm.has_column("psp_pkey")) {
        t_uindex idx = iscm.get_colidx("psp_pkey");
        ocolnames.erase(ocolnames.begin() + idx);
        odt.erase(odt.begin() + idx);
    }

    if (iscm.has_column("psp_op")) {
        t_uindex idx = iscm.get_colidx("psp_op");
        ocolnames.erase(ocolnames.begin() + idx);
        odt.erase(odt.begin() + idx);
    }

    t_schema oscm(ocolnames, odt);

    // Create a gnode
    auto gnode = std::make_shared<t_gnode>(oscm, iscm);
    gnode->init();

    return gnode;
}



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
template<typename T>
std::shared_ptr<t_gnode>
make_table(t_pool* pool, T gnode, T accessor, T computed, std::uint32_t offset,
    std::uint32_t limit, std::string index, bool is_update, bool is_delete, bool is_arrow) {

    std::vector<std::string> colnames;
    std::vector<t_dtype> dtypes;
    // Create the table
    t_table tbl(t_schema(colnames, dtypes));
    tbl.init();
    tbl.extend(0);
    std::shared_ptr<t_gnode> new_gnode;
    return new_gnode;
}

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
template<typename T>
std::shared_ptr<t_gnode>
clone_gnode_table(t_pool* pool, std::shared_ptr<t_gnode> gnode, T computed) {
    t_table* tbl = gnode->_get_pkeyed_table();
    table_add_computed_column(*tbl, computed);
    std::shared_ptr<t_gnode> new_gnode = make_gnode(tbl->get_schema());
    pool->register_gnode(new_gnode.get());
    pool->send(new_gnode->get_id(), 0, *tbl);
    pool->_process();
    return new_gnode;
}

template<>
void sort(std::shared_ptr<t_ctx2> ctx2, py::object j_sortby){

}

template <>
py::object get_column_data(std::shared_ptr<t_table> table, std::string colname) {
    py::list arr;
    return arr;
}

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
template <typename CTX_T>
py::object get_data(std::shared_ptr<View<CTX_T> > view, std::uint32_t start_row, std::uint32_t end_row, std::uint32_t start_col,
    std::uint32_t end_col) {
    py::list arr;
    return arr;
}

template <>
py::object get_data_two_skip_headers(std::shared_ptr<View<t_ctx2> > view, std::uint32_t depth,
    std::uint32_t start_row, std::uint32_t end_row, std::uint32_t start_col,
    std::uint32_t end_col) {
    py::list arr;
    return arr;
}




}
}

#endif