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

namespace perspective {

enum t_computation_method {
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
        t_computation_method name
    );

    t_dtype m_input_type_1;
    t_dtype m_input_type_2;
    t_dtype m_return_type;
    t_computation_method m_name;
};

constexpr t_computation::t_computation(
    t_dtype input_type_1,
    t_dtype input_type_2,
    t_dtype return_type,
    t_computation_method name)
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

    static t_computation get_computation(
        t_computation_method name, const std::vector<t_dtype>& input_types);

    static void apply_computation(
        const std::vector<std::shared_ptr<t_column>>& table_columns,
        const std::vector<std::shared_ptr<t_column>>& flattened_columns,
        std::shared_ptr<t_column> output_column,
        const std::vector<t_rlookup>& row_indices,
        const t_computation& computation);

    template <typename V, typename T = V, typename U = V>
    static V add(T x, U y) {
        return static_cast<V>(static_cast<T>(x) + static_cast<U>(y));
    };

    template <typename V, typename T = V, typename U = V>
    static V subtract(T x, U y) {
        return static_cast<V>(static_cast<T>(x) - static_cast<U>(y));
    };

    static std::int32_t subtract(std::int32_t x, std::int32_t y) {
        return x - y;
    };

    static std::int32_t multiply(std::int32_t x, std::int32_t y) {
        return x * y;
    };

    static std::int32_t divide(std::int32_t x, std::int32_t y) {
        return x / y;
    };

    static std::int32_t invert(std::int32_t x) {
        return 1 / x;
    }

    static std::int32_t sqrt(std::int32_t x) {
        return std::sqrt(x);
    }

    static std::string uppercase(const std::string& x) {
        return x;
    }

    static std::string lowercase(const std::string& x) {
        return x;
    }

    static std::string concat_space(
        const std::string& x, const std::string& y) {
            return x + " " + y;
    }

    static std::string concat_comma(
        const std::string& x, const std::string& y) {
            return x + ", " + y;
    }

    static std::vector<t_computation> computations;
};

} // end namespace perspective