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
#include <perspective/column.h>
#include <perspective/data_table.h>
#include <perspective/rlookup.h>
#include <perspective/computed_function.h>
#include <date/date.h>
#include <tsl/hopscotch_set.h>

// a header that includes exprtk and overload definitions for `t_tscalar` so
// it can be used inside exprtk.
#include <perspective/exprtk.h>

namespace perspective {

/**
 * @brief A thin container for an error message and position (start and end
 * row/column) from Exprtk.
 */
struct PERSPECTIVE_EXPORT t_expression_error {
    std::string m_error_message;
    t_index m_line;
    t_index m_column;
};

/**
 * @brief Contains the metadata for a single expression and the methods which
 * will compute the expression's output.
 */
class PERSPECTIVE_EXPORT t_computed_expression {
public:
    PSP_NON_COPYABLE(t_computed_expression);

    t_computed_expression(const std::string& expression_alias,
        const std::string& expression_string,
        const std::string& parsed_expression_string,
        const std::vector<std::pair<std::string, std::string>>& column_ids,
        t_dtype dtype);

    void compute(std::shared_ptr<t_data_table> source_table,
        std::shared_ptr<t_data_table> destination_table,
        std::shared_ptr<t_vocab> vocab) const;

    const std::string& get_expression_alias() const;
    const std::string& get_expression_string() const;
    const std::string& get_parsed_expression_string() const;
    const std::vector<std::pair<std::string, std::string>>&
    get_column_ids() const;
    t_dtype get_dtype() const;

private:
    std::string m_expression_alias;
    std::string m_expression_string;
    std::string m_parsed_expression_string;
    std::vector<std::pair<std::string, std::string>> m_column_ids;
    std::shared_ptr<t_vocab> m_expression_vocab;
    t_dtype m_dtype;
};

class PERSPECTIVE_EXPORT t_computed_expression_parser {
public:
    static void init();

    /**
     * @brief Given expression strings, validate the expression's dtype and
     * return a shared pointer to a new `t_computed_expression`. This method
     * will abort() if an input column is invalid or the expression cannot be
     * parsed.
     *
     * @param expression_alias an alias for the expression, which will become
     * the name of the new expression column on the table.
     * @param expression_string the expression, as the user typed it.
     * @param parsed_expression_string the expression after having been
     * parsed through the Perspective engine to replace column names, add
     * intern(), etc.
     * @param column_ids A map of column IDs to column names, which is used to
     * properly access column names from the symbol table.
     * @param schema
     * @return std::shared_ptr<t_computed_expression>
     */
    static std::shared_ptr<t_computed_expression> precompute(
        const std::string& expression_alias,
        const std::string& expression_string,
        const std::string& parsed_expression_string,
        const std::vector<std::pair<std::string, std::string>>& column_ids,
        std::shared_ptr<t_schema> schema);

    /**
     * @brief Returns the dtype of the given expression, or `DTYPE_NONE`
     * if the expression is invalid. Unlike `precompute`, this method
     * implements additional checks for column validity and is guaranteed
     * to return a value, even if the expression cannot be parsed. If the
     * expression has an error in it, this function will return `DTYPE_NONE`
     * and the `error_string` will have an error message set.
     *
     * @param expression_alias an alias for the expression, which will become
     * the name of the new expression column on the table.
     * @param expression_string the expression, as the user typed it.
     * @param parsed_expression_string the expression after having been
     * parsed through the Perspective engine to replace column names, add
     * intern(), etc.
     * @param column_ids A map of column IDs to column names, which is used to
     * properly access column names from the symbol table.
     * @param schema
     * @param error_string
     * @return t_dtype
     */
    static t_dtype get_dtype(const std::string& expression_alias,
        const std::string& expression_string,
        const std::string& parsed_expression_string,
        const std::vector<std::pair<std::string, std::string>>& column_ids,
        const t_schema& schema, t_expression_error& error);

    static std::shared_ptr<exprtk::parser<t_tscalar>> PARSER;

    // Applied to the parser
    static std::size_t PARSER_COMPILE_OPTIONS;

    // Instances of Exprtk functions
    static computed_function::bucket BUCKET_FN;
    static computed_function::hour_of_day HOUR_OF_DAY_FN;
    static computed_function::day_of_week DAY_OF_WEEK_VALIDATOR_FN;
    static computed_function::month_of_year MONTH_OF_YEAR_VALIDATOR_FN;
    static computed_function::intern INTERN_VALIDATOR_FN;
    static computed_function::concat CONCAT_VALIDATOR_FN;
    static computed_function::order ORDER_VALIDATOR_FN;
    static computed_function::upper UPPER_VALIDATOR_FN;
    static computed_function::lower LOWER_VALIDATOR_FN;
    static computed_function::length LENGTH_VALIDATOR_FN;
    static computed_function::percent_of PERCENT_OF_FN;
    static computed_function::inrange_fn INRANGE_FN;
    static computed_function::min_fn MIN_FN;
    static computed_function::max_fn MAX_FN;
    static computed_function::is_null IS_NULL_FN;
    static computed_function::is_not_null IS_NOT_NULL_FN;
    static computed_function::to_string TO_STRING_VALIDATOR_FN;
    static computed_function::to_integer TO_INTEGER_FN;
    static computed_function::to_float TO_FLOAT_FN;
    static computed_function::to_boolean TO_BOOLEAN_FN;
    static computed_function::make_date MAKE_DATE_FN;
    static computed_function::make_datetime MAKE_DATETIME_FN;

    // constants for True and False as DTYPE_BOOL scalars
    static t_tscalar TRUE_SCALAR;
    static t_tscalar FALSE_SCALAR;
};

/**
 * @brief a `t_schema`-like container for validated expression results that
 * offers fast lookups.
 */
struct PERSPECTIVE_EXPORT t_validated_expression_map {
    t_validated_expression_map();

    void add_expression(
        const std::string& expression_alias, const std::string& type_string);
    void add_error(
        const std::string& expression_alias, t_expression_error& error);

    std::map<std::string, std::string> get_expression_schema() const;
    std::map<std::string, t_expression_error> get_expression_errors() const;

    std::map<std::string, std::string> m_expression_schema;
    std::map<std::string, t_expression_error> m_expression_errors;
};

} // end namespace perspective