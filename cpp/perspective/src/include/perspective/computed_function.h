/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/exports.h>
#include <perspective/raw_types.h>
#include <perspective/scalar.h>
#include <perspective/column.h>
#include <perspective/data_table.h>
#include <perspective/exprtk.h>
#include <boost/algorithm/string.hpp>
#include <type_traits>
#include <date/date.h>
#include <tsl/hopscotch_set.h>

namespace perspective {

/**
 * @brief The `computed_function` namespace contains all functions that will be
 * used to generate values for a computed column.
 * 
 * Computed functions should receive one or more `t_tscalar`s and return a 
 * single `t_tscalar` value, or receive a shared pointer to a `t_column` along
 * with an input scalar, and return void.
 * 
 */
namespace computed_function {
    
/**
 * @brief A custom exprtk function that reaches into a column and returns the
 * value of the next row. Basically like an iterator but slow and bad, and this
 * should be fully deleted with a better implementation of "get a value from
 * a column". Unfortunately, because ExprTk UDFs don't allow vector return
 * this seems like a logical first step.
 * 
 * @tparam T 
 */
template <typename T>
struct col : public exprtk::igeneric_function<T> {
    typedef typename exprtk::igeneric_function<T>::parameter_list_t t_parameter_list;
    typedef typename exprtk::igeneric_function<T>::generic_type t_generic_type;
    typedef typename t_generic_type::string_view t_string_view;

    col(std::shared_ptr<t_data_table> data_table, const tsl::hopscotch_set<std::string>& input_columns);
    col(std::shared_ptr<t_schema> schema);

    ~col();

    T next(const std::string& column_name);

    T operator()(t_parameter_list parameters);

    std::shared_ptr<t_schema> m_schema;
    tsl::hopscotch_set<std::string> m_input_columns;
    std::map<std::string, std::shared_ptr<t_column>> m_columns;
    std::map<std::string, t_uindex> m_ridxs;
};

template <typename T>
struct upper : public exprtk::igeneric_function<T> {
    typedef typename exprtk::igeneric_function<T>::parameter_list_t t_parameter_list;
    typedef typename exprtk::igeneric_function<T>::generic_type t_generic_type;
    typedef typename t_generic_type::string_view t_string_view;

    upper();

    ~upper();

    T operator()(t_parameter_list parameters);
};

/**
 * @brief Generate headers for numeric computations with one operand.
 */
#define NUMERIC_FUNCTION_1_HEADER(NAME)          \
    t_tscalar NAME##_uint8(t_tscalar uint8);    \
    t_tscalar NAME##_uint16(t_tscalar uint16);   \
    t_tscalar NAME##_uint32(t_tscalar uint32);   \
    t_tscalar NAME##_uint64(t_tscalar uint64);   \
    t_tscalar NAME##_int8(t_tscalar int8);     \
    t_tscalar NAME##_int16(t_tscalar int16);    \
    t_tscalar NAME##_int32(t_tscalar int32);    \
    t_tscalar NAME##_int64(t_tscalar int64);    \
    t_tscalar NAME##_float32(t_tscalar float32);  \
    t_tscalar NAME##_float64(t_tscalar float64);  \

NUMERIC_FUNCTION_1_HEADER(pow2);
NUMERIC_FUNCTION_1_HEADER(sqrt);
NUMERIC_FUNCTION_1_HEADER(abs);
NUMERIC_FUNCTION_1_HEADER(invert);
NUMERIC_FUNCTION_1_HEADER(log);
NUMERIC_FUNCTION_1_HEADER(exp);
NUMERIC_FUNCTION_1_HEADER(bucket_10);
NUMERIC_FUNCTION_1_HEADER(bucket_100);
NUMERIC_FUNCTION_1_HEADER(bucket_1000);
NUMERIC_FUNCTION_1_HEADER(bucket_0_1);
NUMERIC_FUNCTION_1_HEADER(bucket_0_0_1);
NUMERIC_FUNCTION_1_HEADER(bucket_0_0_0_1);
    
template <t_dtype T>
t_tscalar add(t_tscalar x, t_tscalar y);

template <t_dtype T>
t_tscalar subtract(t_tscalar x, t_tscalar y);

template <t_dtype T>
t_tscalar multiply(t_tscalar x, t_tscalar y);

template <t_dtype T>
t_tscalar divide(t_tscalar x, t_tscalar y);

template <t_dtype T>
t_tscalar percent_of(t_tscalar x, t_tscalar y);

template <t_dtype T>
t_tscalar equals(t_tscalar x, t_tscalar y);

template <t_dtype T>
t_tscalar not_equals(t_tscalar x, t_tscalar y);

template <t_dtype T>
t_tscalar greater_than(t_tscalar x, t_tscalar y);

template <t_dtype T>
t_tscalar less_than(t_tscalar x, t_tscalar y);

/**
 * @brief Return x to the power of y.
 * 
 * @tparam T 
 * @param x 
 * @param y 
 * @return t_tscalar 
 */
template <t_dtype T>
t_tscalar pow(t_tscalar x, t_tscalar y);

#define NUMERIC_FUNCTION_2_HEADER(NAME)                                    \
    template <> t_tscalar NAME<DTYPE_UINT8>(t_tscalar x, t_tscalar y);     \
    template <> t_tscalar NAME<DTYPE_UINT16>(t_tscalar x, t_tscalar y);    \
    template <> t_tscalar NAME<DTYPE_UINT32>(t_tscalar x, t_tscalar y);    \
    template <> t_tscalar NAME<DTYPE_UINT64>(t_tscalar x, t_tscalar y);    \
    template <> t_tscalar NAME<DTYPE_INT8>(t_tscalar x, t_tscalar y);      \
    template <> t_tscalar NAME<DTYPE_INT16>(t_tscalar x, t_tscalar y);     \
    template <> t_tscalar NAME<DTYPE_INT32>(t_tscalar x, t_tscalar y);     \
    template <> t_tscalar NAME<DTYPE_INT64>(t_tscalar x, t_tscalar y);     \
    template <> t_tscalar NAME<DTYPE_FLOAT32>(t_tscalar x, t_tscalar y);   \
    template <> t_tscalar NAME<DTYPE_FLOAT64>(t_tscalar x, t_tscalar y);   \

NUMERIC_FUNCTION_2_HEADER(add);
NUMERIC_FUNCTION_2_HEADER(subtract);
NUMERIC_FUNCTION_2_HEADER(multiply);
NUMERIC_FUNCTION_2_HEADER(divide);
NUMERIC_FUNCTION_2_HEADER(equals);
NUMERIC_FUNCTION_2_HEADER(not_equals);
NUMERIC_FUNCTION_2_HEADER(greater_than);
NUMERIC_FUNCTION_2_HEADER(less_than);
NUMERIC_FUNCTION_2_HEADER(pow);

// String functions
t_tscalar length(t_tscalar x);
t_tscalar is(t_tscalar x, t_tscalar y);

// Functions that return a string/write into a string column should not return,
// and instead write directly into the output column. This prevents pointers to
// strings from going out of scope/leaking.
void uppercase(t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column);
void lowercase(t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column);
void concat_space(t_tscalar x, t_tscalar y, std::int32_t idx, std::shared_ptr<t_column> output_column);
void concat_comma(t_tscalar x, t_tscalar y, std::int32_t idx, std::shared_ptr<t_column> output_column);

// Datetime functions
template <t_dtype T>
t_tscalar hour_of_day(t_tscalar x);

template <t_dtype T>
void day_of_week(
    t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column);

template <t_dtype T>
void month_of_year(
    t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column);

template <t_dtype T>
t_tscalar second_bucket(t_tscalar x);

template <t_dtype T>
t_tscalar minute_bucket(t_tscalar x);

template <t_dtype T>
t_tscalar hour_bucket(t_tscalar x);

template <t_dtype T>
t_tscalar day_bucket(t_tscalar x);

template <t_dtype T>
t_tscalar week_bucket(t_tscalar x);

template <t_dtype T>
t_tscalar month_bucket(t_tscalar x);

template <t_dtype T>
t_tscalar year_bucket(t_tscalar x);

#define DATETIME_FUNCTION_HEADER(NAME)                                      \
    template <> t_tscalar NAME<DTYPE_DATE>(t_tscalar x);                    \
    template <> t_tscalar NAME<DTYPE_TIME>(t_tscalar x);                    \

DATETIME_FUNCTION_HEADER(hour_of_day);
DATETIME_FUNCTION_HEADER(second_bucket);
DATETIME_FUNCTION_HEADER(minute_bucket);
DATETIME_FUNCTION_HEADER(hour_bucket);
DATETIME_FUNCTION_HEADER(day_bucket);
DATETIME_FUNCTION_HEADER(week_bucket);
DATETIME_FUNCTION_HEADER(month_bucket);
DATETIME_FUNCTION_HEADER(year_bucket);

// Day of Week/Month of Year write strings directly, and use custom strings
// so they are sorted by day/month and *not* alphabetically

extern const std::string days_of_week[7];
extern const std::string months_of_year[12];

template <>
void day_of_week<DTYPE_DATE>(
    t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column);

template <>
void day_of_week<DTYPE_TIME>(
    t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column);

template <>
void month_of_year<DTYPE_DATE>(
    t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column);

template <>
void month_of_year<DTYPE_TIME>(
    t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column);

} // end namespace computed_function
} // end namespace perspective