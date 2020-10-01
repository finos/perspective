/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#ifdef PSP_ENABLE_PYTHON

#include <perspective/python/computed.h>

namespace perspective {
namespace binding {

void
make_computations() {
    // seed the computations vector
    t_computed_column::make_computations();
}

t_schema
get_table_computed_schema_py(
    std::shared_ptr<Table> table,
    t_val p_computed_columns) {
    // cast into vector of py::dicts
    std::vector<t_val> py_computed = p_computed_columns.cast<std::vector<t_val>>();
    std::vector<t_computed_column_definition> computed_columns(py_computed.size());
    
    for (auto i = 0; i < py_computed.size(); ++i) {
        t_val computed_def = py_computed[i];

        py::dict computed_column = computed_def.cast<py::dict>();

        std::string computed_column_name = 
            computed_def["column"].cast<std::string>();

        t_computed_function_name computed_function_name = 
            str_to_computed_function_name(
                computed_def["computed_function_name"].cast<std::string>());
    
        std::vector<std::string> input_columns = 
            computed_def["inputs"].cast<std::vector<std::string>>();

        t_computation invalid_computation = t_computation();

        // Add the computed column to the config.
        auto tp = std::make_tuple(
            computed_column_name,
            computed_function_name,
            input_columns,
            invalid_computation);

        computed_columns[i] = tp;
    }
    
    t_schema computed_schema = table->get_computed_schema(computed_columns);
    return computed_schema;
}

std::vector<t_dtype>
get_computation_input_types(const std::string& computed_function_name) {
    t_computed_function_name function = str_to_computed_function_name(computed_function_name);
    return t_computed_column::get_computation_input_types(function);
}

std::map<std::string, std::map<std::string, std::string>>
get_computed_functions() {
    return t_computed_column::computed_functions;
}

} //namespace binding
} //namespace perspective

#endif