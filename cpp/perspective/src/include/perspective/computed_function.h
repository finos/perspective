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

typedef typename exprtk::igeneric_function<t_tscalar>::parameter_list_t t_parameter_list;
typedef typename exprtk::igeneric_function<t_tscalar>::generic_type t_generic_type;
typedef typename t_generic_type::scalar_view t_scalar_view;
typedef typename t_generic_type::string_view t_string_view;

/**
 * @brief A custom exprtk function that reaches into a column and returns the
 * value of the next row. Basically like an iterator but slow and bad, and this
 * should be fully deleted with a better implementation of "get a value from
 * a column". Unfortunately, because ExprTk UDFs don't allow vector return
 * this seems like a logical first step.
 * 
 * @tparam T 
 */
// template <typename T>
// struct col : public exprtk::igeneric_function<T> {
//     typedef typename exprtk::igeneric_function<T>::parameter_list_t t_parameter_list;
//     typedef typename exprtk::igeneric_function<T>::generic_type t_generic_type;
//     typedef typename t_generic_type::string_view t_string_view;

//     col(std::shared_ptr<t_data_table> data_table, const tsl::hopscotch_set<std::string>& input_columns);
//     col(std::shared_ptr<t_schema> schema);

//     ~col();

//     T next(const std::string& column_name);

//     T operator()(t_parameter_list parameters);

//     std::shared_ptr<t_schema> m_schema;
//     tsl::hopscotch_set<std::string> m_input_columns;
//     std::map<std::string, std::shared_ptr<t_column>> m_columns;
//     std::map<std::string, t_uindex> m_ridxs;
// };

#define STRING_FUNCTION_HEADER(NAME)                                    \
    struct NAME : public exprtk::igeneric_function<t_tscalar> {        \
        NAME(std::shared_ptr<t_vocab> expression_vocab);               \
        ~NAME();                                                       \
        t_tscalar operator()(t_parameter_list parameters);              \
        std::shared_ptr<t_vocab> m_expression_vocab;                    \
        t_tscalar m_sentinel;                                           \
        t_tscalar m_none;                                               \
    };                                                                  \

// Place string literals into an intermediate vocab and return a scalar so
// that they can be used in all scalar operations.
STRING_FUNCTION_HEADER(intern)

// Concat any number of columns and string literals together.
STRING_FUNCTION_HEADER(concat)

// Uppercase a string, storing intermediates in `expression_vocab`
STRING_FUNCTION_HEADER(upper)

// Lowercase a string
STRING_FUNCTION_HEADER(lower)

enum t_date_bucket_unit {
    SECONDS,
    MINUTES,
    HOURS,
    DAYS,
    WEEKS,
    MONTHS,
    YEARS
};

/**
 * @brief Bucket a date/datetime by seconds, minutes, hours, days, weeks,
 * months, and years.
 */
struct date_bucket : public exprtk::igeneric_function<t_tscalar> {
    date_bucket();
    ~date_bucket();

    t_tscalar operator()(t_parameter_list parameters);

    // faster unit lookups, since we are calling this lookup in a tight loop.
    static tsl::hopscotch_map<std::string, t_date_bucket_unit> UNIT_MAP;
};

void _second_bucket(t_tscalar& val, t_tscalar& rval);
void _minute_bucket(t_tscalar& val, t_tscalar& rval);
void _hour_bucket(t_tscalar& val, t_tscalar& rval);
void _day_bucket(t_tscalar& val, t_tscalar& rval);
void _week_bucket(t_tscalar& val, t_tscalar& rval);
void _month_bucket(t_tscalar& val, t_tscalar& rval);
void _year_bucket(t_tscalar& val, t_tscalar& rval);

t_tscalar now();
t_tscalar today();

/**
 * @brief Get the minimum of all the inputs.
 */
struct min_fn : public exprtk::igeneric_function<t_tscalar> {
    min_fn();
    ~min_fn();

    t_tscalar operator()(t_parameter_list parameters);
};

/**
 * @brief Get the maximum of all the inputs.
 */
struct max_fn : public exprtk::igeneric_function<t_tscalar> {
    max_fn();
    ~max_fn();

    t_tscalar operator()(t_parameter_list parameters);
};

struct is_null : public exprtk::igeneric_function<t_tscalar> {
    is_null();
    ~is_null();

    t_tscalar operator()(t_parameter_list parameters);
};

struct is_not_null : public exprtk::igeneric_function<t_tscalar> {
    is_not_null();
    ~is_not_null();

    t_tscalar operator()(t_parameter_list parameters);
};

} // end namespace computed_function
} // end namespace perspective