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

namespace perspective {

/**
 * @brief The name for a single computed method. Names should be defined here,
 * and are unique for each method.
 */
enum t_computed_function_name {
    INVALID_COMPUTATION_METHOD,
    ADD,
    SUBTRACT,
    MULTIPLY,
    DIVIDE,
    INVERT,
    POW,
    SQRT,
    ABS,
    PERCENT_A_OF_B,
    EQUALS,
    NOT_EQUALS,
    GREATER_THAN,
    LESS_THAN,
    UPPERCASE,
    LOWERCASE,
    LENGTH,
    IS,
    CONCAT_SPACE,
    CONCAT_COMMA,
    BUCKET_10,
    BUCKET_100,
    BUCKET_1000,
    BUCKET_0_1,
    BUCKET_0_0_1,
    BUCKET_0_0_0_1,
    HOUR_OF_DAY,
    DAY_OF_WEEK,
    MONTH_OF_YEAR,
    SECOND_BUCKET,
    MINUTE_BUCKET,
    HOUR_BUCKET,
    DAY_BUCKET,
    WEEK_BUCKET,
    MONTH_BUCKET,
    YEAR_BUCKET
};

/**
 * @brief Stores metadata for a single computation method.
 * 
 */
struct PERSPECTIVE_EXPORT t_computation {
    
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
 * @brief Stores static functions used for computed columns, and a string to
 * function pointer map 
 * 
 */
class PERSPECTIVE_EXPORT t_computed_column {
public:

    /**
     * @brief Returns a `t_computation` object corresponding to the provided
     * name and input types. Aborts if a method cannot be found.
     * 
     * @param name 
     * @param input_types 
     * @return t_computation 
     */
    static t_computation get_computation(
        t_computed_function_name name, const std::vector<t_dtype>& input_types);
        
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
        const std::vector<std::shared_ptr<t_column>>& flattened_columns,
        std::shared_ptr<t_column> output_column,
        const std::vector<t_rlookup>& row_indices,
        t_computation computation);

    /**
     * @brief Pregenerate all combinations of `t_computation` structs for
     * each `t_dtype` and `t_computed_function_name`. This method should be run
     * once at initialization of the Perspective C++ module.
     */
    static void make_computations();

    static std::vector<t_computation> computations;
};

} // end namespace perspective