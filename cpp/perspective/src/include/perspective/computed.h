/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <cmath>
#include <type_traits>
#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/exports.h>
#include <perspective/raw_types.h>
#include <perspective/column.h>
#include <perspective/scalar.h>
#include <perspective/rlookup.h>
#include <perspective/computed_function.h>
#include <perspective/exception.h>

namespace perspective {

/**
 * @brief Stores metadata for a single computation method.
 * 
 */
struct PERSPECTIVE_EXPORT t_computation {

    /**
     * @brief Construct a new, invalid `t_computation` with `m_name` set to
     * `INVALID_COMPUTED_FUNCTION`.
     * 
     */
    t_computation();
    
    /**
     * @brief Construct a new, valid `t_computation`.
     * 
     * @param name 
     * @param input_types 
     * @param return_type 
     */
    t_computation(
        t_computed_function_name name,
        const std::vector<t_dtype>& input_types,
        t_dtype return_type
    );

    t_computed_function_name m_name;
    std::vector<t_dtype> m_input_types;
    t_dtype m_return_type;
};

/**
 * @brief A `t_computed_column_definition` is a tuple with four values:
 * 
 * - a string representing the name of the computed column
 * - a `t_computed_function_name` that maps to the computation function
 * - a vector of strings containing the names of input columns
 * - a `t_computation` containing the input data types and return type
 *
 */
typedef std::tuple<std::string, t_computed_function_name, std::vector<std::string>, t_computation> t_computed_column_definition;


/**
 * @brief Stores static functions used for computed columns, and a string to
 * function pointer map 
 * 
 */
class PERSPECTIVE_EXPORT t_computed_column {
public:

    /**
     * @brief Returns a `t_computation` object corresponding to the provided
     * name and input types. 
     * 
     * If a valid computation cannot be found, a `t_computation` object with 
     * `m_name` set to `INVALID_COMPUTED_FUNCTION` and `m_return_type` set to 
     * `DTYPE_NONE`. This allows for error checking without invalidating the
     * View or Table.
     * 
     * @param name 
     * @param input_types 
     * @return t_computation 
     */
    static t_computation get_computation(
        t_computed_function_name name, const std::vector<t_dtype>& input_types);

    /**
     * @brief Given a computation, return the input dtypes it expects. For
     * integer and float types, the type of the highest bit width is returned,
     * and it should be assumed that the function accepts all integer/float
     * types of lower bit widths.
     * 
     * @param name 
     * @return std::vector<t_dtype> 
     */
    static std::vector<t_dtype> get_computation_input_types(
        t_computed_function_name name);
        
    /**
     * @brief Given a `t_computation`, return the std::function that should be
     * called to perform the computation over a single input value.
     * 
     * @param computation 
     * @return std::function<t_tscalar(t_tscalar)> 
     */
    static std::function<t_tscalar(t_tscalar)> get_computed_function_1(
        t_computation computation);

    /**
     * @brief Given a `t_computation`, return the std::function that should be
     * called to perform the computation over two input values.
     * 
     * @param computation 
     * @return std::function<t_tscalar(t_tscalar, t_tscalar)> 
     */
    static std::function<t_tscalar(t_tscalar, t_tscalar)> get_computed_function_2(
        t_computation computation);

    static std::function<void(t_tscalar, std::int32_t, std::shared_ptr<t_column>)> get_computed_function_string_1(
        t_computation computation);

    static std::function<void(t_tscalar, t_tscalar, std::int32_t, std::shared_ptr<t_column>)> get_computed_function_string_2(
        t_computation computation);

    /**
     * @brief Given a set of input columns and an output column, perform the
     * provided computation on the input columns, writing into the output
     * column.
     * 
     * When the `Table` is updated with new data, this method is called
     * automatically to recompute the output column based on new inputs.
     * 
     * @param table_columns 
     * @param flattened_columns 
     * @param output_column 
     * @param row_indices 
     * @param method 
     */
    static void apply_computation(
        const std::vector<std::shared_ptr<t_column>>& table_columns,
        std::shared_ptr<t_column> output_column,
        t_computation computation);

    /**
     * @brief Re-applies a computation on the output column, using two sets of
     * input columns: `table_columns`, which refers to the table of `t_gstate`,
     * and `flattened_columns`, which refers to the table that is produced as
     * part of calling `Table.update`. Using `changed_rows`, this method
     * reapplies the computation only on rows that have been changed.
     * 
     * This method should be called in `t_gnode::_process_table` in order to
     * properly apply computed columns involving partial updates.
     * 
     * @param table_columns 
     * @param flattened_columns 
     * @param output_column 
     * @param row_indices 
     * @param method 
     */
    static void reapply_computation(
        const std::vector<std::shared_ptr<t_column>>& table_columns,
        const std::vector<std::shared_ptr<t_column>>& flattened_columns,
        const std::vector<t_rlookup>& changed_rows,
        std::shared_ptr<t_column> output_column,
        t_computation computation);

    /**
     * @brief Pregenerate all combinations of `t_computation` structs for
     * each `t_dtype` and `t_computed_function_name`. This method should be run
     * once at initialization of the Perspective C++ module.
     */
    static void make_computations();

    static std::vector<t_computation> computations;

    static std::map<std::string, std::map<std::string, std::string>> computed_functions;
};

} // end namespace perspective