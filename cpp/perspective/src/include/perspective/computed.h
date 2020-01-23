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
#include <perspective/computed_method.h>

namespace perspective {

/**
 * @brief The name for a single computed method. Names should be defined here,
 * and are unique for each method.
 */
enum t_computation_method_name {
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
    UPPERCASE,
    LOWERCASE,
    LENGTH,
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
    
    constexpr t_computation(
        t_dtype input_type_1,
        t_dtype input_type_2,
        t_dtype return_type,
        t_computation_method_name name
    );

    t_dtype m_input_type_1;
    t_dtype m_input_type_2;
    t_dtype m_return_type;
    t_computation_method_name m_name;
};

constexpr t_computation::t_computation(
    t_dtype input_type_1,
    t_dtype input_type_2,
    t_dtype return_type,
    t_computation_method_name name)
    : m_input_type_1(input_type_1)
    , m_input_type_2(input_type_2)
    , m_return_type(return_type)
    , m_name(name) {}

/**
 * @brief Stores metadata for a single computed column, including its name,
 * input columns, and its `t_computation`.
 * 
 */
struct PERSPECTIVE_EXPORT t_computed_column_def {

    t_computed_column_def(
        const std::string& column_name,
        const std::vector<std::string> input_columns,
        const t_computation& computation
    );

    std::string m_column_name;
    std::vector<std::string> m_input_columns;
    t_computation m_computation;
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
        t_computation_method_name name, const std::vector<t_dtype>& input_types);
    
    /**
     * @brief Given a `t_computation`, return the std::function that should be
     * called to perform the computation on each cell. 
     * 
     * @param computation 
     * @return std::function<t_tscalar(t_tscalar, t_tscalar)> 
     */
    static std::function<t_tscalar(t_tscalar, t_tscalar)> get_computed_method(
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
        const std::function<t_tscalar(t_tscalar, t_tscalar)>& method);

    /**
     * @brief Pregenerate all combinations of `t_computation` structs for
     * each `t_dtype` and `t_computed_method_name`. This method should be run
     * once at initialization of the Perspective C++ module.
     */
    static void make_computations();

    static std::vector<t_computation> computations;
};

} // end namespace perspective