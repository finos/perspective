
#ifdef PSP_ENABLE_PYTHON
#include <iostream>

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/table.h>
 

#ifndef __PSP_BINDING_HPP__
#define __PSP_BINDING_HPP__


void test(const char* name);


perspective::t_schema* t_schema_init(py::list& columns, py::list& types);

template<typename T>
void _fill_col(std::vector<T>& dcol, perspective::t_col_sptr col);

template<typename T>
void _fill_col_np(np::ndarray& dcol, perspective::t_col_sptr col);


void _fill_data_single_column(perspective::t_table& tbl,
                              const std::string& colname_i,
                              py::list& data_cols_i,
                              perspective::t_dtype col_type);

void _fill_data_single_column_np(perspective::t_table& tbl,
                                 const std::string& colname_i,
                                 np::ndarray& data_cols_i,
                                 perspective::t_dtype col_type);

np::ndarray _get_as_numpy(perspective::t_table& tbl, const std::string& colname_i);


BOOST_PYTHON_MODULE(libbinding)
{
    np::initialize(true);
    _import_array();

    py::def("test", test);

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



    py::class_<perspective::t_schema>("t_schema",
        py::init<perspective::t_svec, perspective::t_dtypevec>())
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

        // when returning const, need return_value_policy<copy_const_reference>
        .def("columns", &perspective::t_schema::columns, py::return_value_policy<py::copy_const_reference>())
        // .def("types", &perspective::t_schema::types, return_value_policy<copy_const_reference>())
    ;


    //TODO
    py::class_<perspective::t_column>("t_column", 
        py::init<>())
    ;

    // need boost:noncopyable for PSP_NON_COPYABLE
    py::class_<perspective::t_table, boost::noncopyable>("t_table", py::init<perspective::t_schema>())

        .def("init", &perspective::t_table::init)
        .def("clear", &perspective::t_table::clear)
        .def("reset", &perspective::t_table::reset)
        .def("size", &perspective::t_table::size)
        .def("reserve", &perspective::t_table::reserve)
        .def("extend", &perspective::t_table::extend)
        .def("set_size", &perspective::t_table::set_size)

        .def("num_columns", &perspective::t_table::num_columns)
        .def("get_capacity", &perspective::t_table::get_capacity)

        // when returning const, need return_value_policy<copy_const_reference>
        .def("name", &perspective::t_table::name, py::return_value_policy<py::copy_const_reference>())
        .def("get_schema", &perspective::t_table::get_schema, py::return_value_policy<py::copy_const_reference>())

        // when multiple overloading methods, need to static_cast to specify
        .def("num_rows", static_cast<perspective::t_uindex (perspective::t_table::*)() const> (&perspective::t_table::num_rows))
        
        .def("pprint", static_cast<void (perspective::t_table::*)() const>(&perspective::t_table::pprint))
        .def("pprint", static_cast<void (perspective::t_table::*)(perspective::t_uindex, std::ostream*) const>(&perspective::t_table::pprint))
        .def("pprint", static_cast<void (perspective::t_table::*)(const perspective::t_str&) const>(&perspective::t_table::pprint))
        .def("pprint", static_cast<void (perspective::t_table::*)(const perspective::t_uidxvec&) const>(&perspective::t_table::pprint))


        // custom add ins
        // .def("load_column", _fill_data_single_column)
        .def("load_column", static_cast<void (*)(perspective::t_table& tbl, const std::string& colname_i, py::list& data_cols_i, perspective::t_dtype col_type)>(_fill_data_single_column))
        .def("load_column", static_cast<void (*)(perspective::t_table& tbl, const std::string& colname_i, np::ndarray& data_cols_i, perspective::t_dtype col_type)>(_fill_data_single_column_np))
        .def("get_column", _get_as_numpy)
    ;
}


#endif

#endif