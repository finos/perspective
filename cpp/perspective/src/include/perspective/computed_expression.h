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

class PERSPECTIVE_EXPORT t_computed_expression {
public:
    // allow this struct to be copy constructed since we store it in
    // gnode, config, etc.
    t_computed_expression() = default;

    t_computed_expression(
        const std::string& expression_string,
        const std::string& parsed_expression_string,
        const std::vector<std::pair<std::string, std::string>>& column_ids,
        t_dtype dtype);

    /**
     * @brief Compute this expression and add the output column to
     * `data_table.`
     * 
     * @param data_table 
     */
    void compute(std::shared_ptr<t_data_table> data_table) const;

    /**
     * @brief Compute this expression for the rows in `changed_rows`, and
     * add the output column to `flattened`.
     */
    void recompute(
        std::shared_ptr<t_data_table> gstate_table,
        std::shared_ptr<t_data_table> flattened,
        const std::vector<t_rlookup>& changed_rows) const;

    std::string get_expression_string() const;
    std::string get_parsed_expression_string() const;
    std::vector<std::pair<std::string, std::string>> get_column_ids() const;
    t_dtype get_dtype() const;

private:
    std::string m_expression_string;
    std::string m_parsed_expression_string;
    std::vector<std::pair<std::string, std::string>> m_column_ids;
    t_dtype m_dtype;
};

class PERSPECTIVE_EXPORT t_computed_expression_parser {
public:
    static void init();

    /**
     * @brief Given expression strings, validate the expression's dtype and
     * return a new `t_computed_expression`. This method will abort() if
     * an input column is invalid or the expression cannot be parsed.
     * 
     * @param expression_string 
     * @param parsed_expression_string 
     * @param column_ids 
     * @param schema 
     * @return t_computed_expression 
     */
    static t_computed_expression precompute(
        const std::string& expression_string,
        const std::string& parsed_expression_string,
        const std::vector<std::pair<std::string, std::string>>& column_ids,
        std::shared_ptr<t_schema> schema
    );

    /**
     * @brief Returns the dtype of the given expression, or `DTYPE_NONE`
     * if the expression is invalid. Unlike `precompute`, this method
     * implements additional checks for column validity and is guaranteed
     * to return a value, even if the expression cannot be parsed.
     * 
     * @param expression_string 
     * @param parsed_expression_string 
     * @param column_ids 
     * @param schema 
     * @return t_dtype 
     */
    static t_dtype get_dtype(
        const std::string& expression_string,
        const std::string& parsed_expression_string,
        const std::vector<std::pair<std::string, std::string>>& column_ids,
        const t_schema& schema);

    static std::shared_ptr<exprtk::parser<t_tscalar>> PARSER;

    // Symbol table for constants and functions that don't have any state.
    static exprtk::symbol_table<t_tscalar> GLOBAL_SYMTABLE;

    // Instances of Exprtk functions
    static std::vector<exprtk::igeneric_function<t_tscalar>> FUNCTIONS;
};

} // end namespace perspective