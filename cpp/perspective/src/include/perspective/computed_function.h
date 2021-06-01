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

namespace computed_function {

typedef typename exprtk::igeneric_function<t_tscalar>::parameter_list_t t_parameter_list;
typedef typename exprtk::igeneric_function<t_tscalar>::generic_type t_generic_type;
typedef typename t_generic_type::scalar_view t_scalar_view;
typedef typename t_generic_type::string_view t_string_view;

#define STRING_FUNCTION_HEADER(NAME)                                    \
    struct NAME : public exprtk::igeneric_function<t_tscalar> {        \
        NAME(std::shared_ptr<t_vocab> expression_vocab);               \
        ~NAME();                                                       \
        t_tscalar operator()(t_parameter_list parameters);              \
        std::shared_ptr<t_vocab> m_expression_vocab;                    \
        t_tscalar m_sentinel;                                           \
    };                                                                  \

// Place string literals into `expression_vocab` so they do not go out
// of scope and remain valid for the lifetime of the table.
STRING_FUNCTION_HEADER(intern)

// Concat any number of columns and string literals together.
STRING_FUNCTION_HEADER(concat)

// Uppercase a string, storing intermediates in `expression_vocab`
STRING_FUNCTION_HEADER(upper)

// Lowercase a string
STRING_FUNCTION_HEADER(lower)

// Length of the string
STRING_FUNCTION_HEADER(length)

/**
 * @brief Given a string column and 1...n string parameters, generate a numeric
 * column that will act as a custom sort order for the string column:
 * 
 * category = ['A', 'B', 'C', 'D']
 * order("Category", 'B', 'C', 'A') => [2, 0, 1, 3]
 * 
 * This allows string sort order to be overridden from the default alphabetical
 * sort, which is useful for categories or string timestamps. Strings in the
 * column not provided to `order()` will by default appear at the end.
 */
struct order : public exprtk::igeneric_function<t_tscalar> {
    order(std::shared_ptr<t_vocab> expression_vocab);
    ~order();
    t_tscalar operator()(t_parameter_list parameters);

    tsl::hopscotch_map<std::string, double> m_order_map;
    double m_order_idx;

    std::shared_ptr<t_vocab> m_expression_vocab;
    t_tscalar m_sentinel;
};

/**
 * @brief Given a string column and a non-regex string literal, check whether
 * each row in the string column contains the string literal.
 */
STRING_FUNCTION_HEADER(contains)


#define FUNCTION_HEADER(NAME)                                           \
    struct NAME : public exprtk::igeneric_function<t_tscalar> {         \
        NAME();                                                         \
        ~NAME();                                                        \
        t_tscalar operator()(t_parameter_list parameters);              \
    };                                                                  \

/**
 * @brief Return the hour of the day the date/datetime belongs to.
 */
FUNCTION_HEADER(hour_of_day)

// Day of Week/Month of Year write strings directly, and use custom strings
// so they are sorted by day/month and *not* alphabetically

extern const std::string days_of_week[7];
extern const std::string months_of_year[12];

// Return the day of the week the date/datetime belongs to
STRING_FUNCTION_HEADER(day_of_week)

// Return the month of the year the date/datetime belongs to
STRING_FUNCTION_HEADER(month_of_year)

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
 * @brief Bucket the input by the unit:
 * 
 * - If the input is a date or a datetime, the unit is one of the following:
 *   [s]econds, [m]inutes, [h]ours, [D]ays, [W]eeks, [M]onths, [Y]ears.
 * 
 * - If the input is a number, the unit is also a number.
 * 
 * Any other inputs are invalid.
 */
struct bucket : public exprtk::igeneric_function<t_tscalar> {
    bucket();
    ~bucket();

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

/**
 * @brief Returns the current datetime. Will be recalculated on view creation
 * and table update.
 * 
 * @return t_tscalar 
 */
t_tscalar now();

/**
 * @brief Returns the current date. Will be recalculated on view creation
 * and table update.
 * 
 * @return t_tscalar 
 */
t_tscalar today();

/**
 * @brief Get the minimum of all the inputs.
 */
FUNCTION_HEADER(min_fn)

/**
 * @brief Get the maximum of all the inputs.
 */
FUNCTION_HEADER(max_fn)

/**
 * @brief Get a as percent of b.
 * 
 */
FUNCTION_HEADER(percent_of)

/**
 * @brief Whether the input is null.
 * 
 */
FUNCTION_HEADER(is_null)

/**
 * @brief Whether the input is not null.
 * 
 */
FUNCTION_HEADER(is_not_null)

/**
 * @brief Convert a column or scalar of any type to a string.
 * 
 */
FUNCTION_HEADER(to_string)

/**
 * @brief Convert a column or scalar of any type to an integer, or null
 * if the value is not parsable as an integer.
 */
FUNCTION_HEADER(to_integer)

/**
 * @brief Convert a column or scalar of any type to a float, or null
 * if the value is not parsable as an float.
 */
FUNCTION_HEADER(to_float)

/**
 * @brief Given a Year, Month (1-12), and Day, create a new date value.
 * Because we also extensively use `date.h` which exports its symbols under
 * `date`, this function is given a name that does not conflict (even though
 * it is registered using "date").
 */
FUNCTION_HEADER(make_date)

/**
 * @brief Given a POSIX timestamp of milliseconds since epoch, create a
 * new datetime value.
 */
FUNCTION_HEADER(make_datetime)

} // end namespace computed_function
} // end namespace perspective