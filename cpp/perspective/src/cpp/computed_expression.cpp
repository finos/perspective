/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/computed_expression.h>

namespace perspective {

// Change ExprTk's default compilation options to only check for correctness
// of brackets and sequences. ExprTk defaults will replace "true" and "false"
// with 1 and 0, which we don't want. Using the tokens "true" and "false"
// will raise a syntax error, which is the correct behavior.
std::size_t t_computed_expression_parser::PARSER_COMPILE_OPTIONS
    = exprtk::parser<t_tscalar>::settings_t::e_joiner
    + exprtk::parser<t_tscalar>::settings_t::e_numeric_check
    + exprtk::parser<t_tscalar>::settings_t::e_bracket_check
    + exprtk::parser<t_tscalar>::settings_t::e_sequence_check;
// exprtk::parser<t_tscalar>::settings_t::e_commutative_check;
// exprtk::parser<t_tscalar>::settings_t::e_strength_reduction;

std::shared_ptr<exprtk::parser<t_tscalar>> t_computed_expression_parser::PARSER
    = std::make_shared<exprtk::parser<t_tscalar>>(
        t_computed_expression_parser::PARSER_COMPILE_OPTIONS);

computed_function::bucket t_computed_expression_parser::BUCKET_FN
    = computed_function::bucket();

computed_function::hour_of_day t_computed_expression_parser::HOUR_OF_DAY_FN
    = computed_function::hour_of_day();

computed_function::percent_of t_computed_expression_parser::PERCENT_OF_FN
    = computed_function::percent_of();

computed_function::inrange_fn t_computed_expression_parser::INRANGE_FN
    = computed_function::inrange_fn();

computed_function::min_fn t_computed_expression_parser::MIN_FN
    = computed_function::min_fn();

computed_function::max_fn t_computed_expression_parser::MAX_FN
    = computed_function::max_fn();

computed_function::length t_computed_expression_parser::LENGTH_FN
    = computed_function::length();

computed_function::is_null t_computed_expression_parser::IS_NULL_FN
    = computed_function::is_null();

computed_function::is_not_null t_computed_expression_parser::IS_NOT_NULL_FN
    = computed_function::is_not_null();

computed_function::to_integer t_computed_expression_parser::TO_INTEGER_FN
    = computed_function::to_integer();

computed_function::to_float t_computed_expression_parser::TO_FLOAT_FN
    = computed_function::to_float();

computed_function::to_boolean t_computed_expression_parser::TO_BOOLEAN_FN
    = computed_function::to_boolean();

computed_function::make_date t_computed_expression_parser::MAKE_DATE_FN
    = computed_function::make_date();

computed_function::make_datetime t_computed_expression_parser::MAKE_DATETIME_FN
    = computed_function::make_datetime();

computed_function::random t_computed_expression_parser::RANDOM_FN
    = computed_function::random();

t_tscalar t_computed_expression_parser::TRUE_SCALAR = mktscalar(true);

t_tscalar t_computed_expression_parser::FALSE_SCALAR = mktscalar(false);

/******************************************************************************
 *
 * t_computed_expression
 */

t_computed_expression::t_computed_expression(
    const std::string& expression_alias, const std::string& expression_string,
    const std::string& parsed_expression_string,
    const std::vector<std::pair<std::string, std::string>>& column_ids,
    t_dtype dtype)
    : m_expression_alias(expression_alias)
    , m_expression_string(expression_string)
    , m_parsed_expression_string(parsed_expression_string)
    , m_column_ids(std::move(column_ids))
    , m_dtype(dtype) {}

void
t_computed_expression::compute(std::shared_ptr<t_data_table> source_table,
    std::shared_ptr<t_data_table> destination_table, t_expression_vocab& vocab,
    t_regex_mapping& regex_mapping) const {
    // TODO: share symtables across pre/re/compute
    exprtk::symbol_table<t_tscalar> sym_table;

    // pi, infinity, etc.
    sym_table.add_constants();

    // Create a function store, with is_type_validator set to false as we
    // are calculating values, not type-checking.
    t_computed_function_store function_store(vocab, regex_mapping, false);
    function_store.register_computed_functions(sym_table);

    exprtk::expression<t_tscalar> expr_definition;
    std::vector<std::pair<std::string, t_tscalar>> values;
    tsl::hopscotch_map<std::string, std::shared_ptr<t_column>> columns;

    auto num_input_columns = m_column_ids.size();
    values.resize(num_input_columns);
    columns.reserve(num_input_columns);

    for (t_uindex cidx = 0; cidx < num_input_columns; ++cidx) {
        const std::string& column_id = m_column_ids[cidx].first;
        const std::string& column_name = m_column_ids[cidx].second;
        columns[column_id] = source_table->get_column(column_name);

        t_tscalar rval;
        rval.clear();
        rval.m_type = columns[column_id]->get_dtype();

        values[cidx] = std::pair<std::string, t_tscalar>(column_id, rval);
        sym_table.add_variable(column_id, values[cidx].second);
    }

    expr_definition.register_symbol_table(sym_table);

    if (!t_computed_expression_parser::PARSER->compile(
            m_parsed_expression_string, expr_definition)) {
        std::stringstream ss;
        ss << "[t_computed_expression::compute] Failed to parse expression: `"
           << m_parsed_expression_string << "`, failed with error: "
           << t_computed_expression_parser::PARSER->error() << std::endl;

        PSP_COMPLAIN_AND_ABORT(ss.str());
    }

    // create or get output column using m_expression_alias
    auto output_column
        = destination_table->add_column_sptr(m_expression_alias, m_dtype, true);
    auto num_rows = source_table->size();
    output_column->reserve(num_rows);

    for (t_uindex ridx = 0; ridx < num_rows; ++ridx) {
        for (t_uindex cidx = 0; cidx < num_input_columns; ++cidx) {
            const std::string& column_id = m_column_ids[cidx].first;
            values[cidx].second.set(columns[column_id]->get_scalar(ridx));
        }

        t_tscalar value = expr_definition.value();

        if (!value.is_valid() || value.is_none()) {
            output_column->clear(ridx);
            continue;
        }

        output_column->set_scalar(ridx, value);
    }

    function_store.clear_computed_function_state();
};

const std::string&
t_computed_expression::get_expression_alias() const {
    return m_expression_alias;
}

const std::string&
t_computed_expression::get_expression_string() const {
    return m_expression_string;
}

const std::string&
t_computed_expression::get_parsed_expression_string() const {
    return m_parsed_expression_string;
}

const std::vector<std::pair<std::string, std::string>>&
t_computed_expression::get_column_ids() const {
    return m_column_ids;
}

t_dtype
t_computed_expression::get_dtype() const {
    return m_dtype;
}

/******************************************************************************
 *
 * t_computed_expression_parser
 */

void
t_computed_expression_parser::init() {
    t_computed_expression_parser::PARSER->settings()
        .disable_control_structure(
            exprtk::parser<t_tscalar>::settings_store::e_ctrl_repeat_loop)
        .disable_base_function(
            exprtk::parser<t_tscalar>::settings_store::e_bf_inrange)
        .disable_base_function(
            exprtk::parser<t_tscalar>::settings_store::e_bf_min)
        .disable_base_function(
            exprtk::parser<t_tscalar>::settings_store::e_bf_max);
}

std::shared_ptr<t_computed_expression>
t_computed_expression_parser::precompute(const std::string& expression_alias,
    const std::string& expression_string,
    const std::string& parsed_expression_string,
    const std::vector<std::pair<std::string, std::string>>& column_ids,
    std::shared_ptr<t_schema> schema, t_expression_vocab& vocab,
    t_regex_mapping& regex_mapping) {
    exprtk::symbol_table<t_tscalar> sym_table;
    sym_table.add_constants();

    // Create a function store, with is_type_validator set to true as we are
    // just getting the output types.
    t_computed_function_store function_store(vocab, regex_mapping, true);
    function_store.register_computed_functions(sym_table);

    std::vector<t_tscalar> values;

    auto num_input_columns = column_ids.size();
    values.resize(num_input_columns);

    // Add a new scalar of the input column type to the symtable, which
    // will use the scalar to validate the output type of the expression.
    for (t_uindex cidx = 0; cidx < num_input_columns; ++cidx) {
        const std::string& column_id = column_ids[cidx].first;
        const std::string& column_name = column_ids[cidx].second;

        t_tscalar rval;
        rval.clear();
        rval.m_type = schema->get_dtype(column_name);

        // If we are accessing string columns, the scalar CANNOT have a
        // nullptr as a string - use the empty string that we interned
        // in the gnode's expression vocab in t_gnode::init() at idx 0
        if (rval.m_type == DTYPE_STR) {
            rval.set(vocab.get_empty_string());
            rval.m_status = STATUS_INVALID;
        }

        values[cidx] = rval;

        sym_table.add_variable(column_id, values[cidx]);
    }

    exprtk::expression<t_tscalar> expr_definition;
    expr_definition.register_symbol_table(sym_table);

    if (!t_computed_expression_parser::PARSER->compile(
            parsed_expression_string, expr_definition)) {
        std::stringstream ss;
        ss << "[t_computed_expression_parser::precompute] Failed to parse "
              "expression: `"
           << parsed_expression_string << "`, failed with error: "
           << t_computed_expression_parser::PARSER->error() << std::endl;
        PSP_COMPLAIN_AND_ABORT(ss.str());
    }

    t_tscalar v = expr_definition.value();
    function_store.clear_computed_function_state();

    return std::make_shared<t_computed_expression>(expression_alias,
        expression_string, parsed_expression_string, column_ids, v.get_dtype());
}

t_dtype
t_computed_expression_parser::get_dtype(const std::string& expression_alias,
    const std::string& expression_string,
    const std::string& parsed_expression_string,
    const std::vector<std::pair<std::string, std::string>>& column_ids,
    const t_schema& schema, t_expression_error& error,
    t_expression_vocab& vocab, t_regex_mapping& regex_mapping) {
    exprtk::symbol_table<t_tscalar> sym_table;
    sym_table.add_constants();

    std::vector<t_tscalar> values;

    // Create a function store, with is_type_validator set to true as we are
    // just validating the output types.
    t_computed_function_store function_store(vocab, regex_mapping, true);
    function_store.register_computed_functions(sym_table);

    auto num_input_columns = column_ids.size();
    values.resize(num_input_columns);

    // Add a new scalar of the input column type to the symtable, which
    // will use the scalar to validate the output type of the expression.
    for (t_uindex cidx = 0; cidx < num_input_columns; ++cidx) {
        const std::string& column_id = column_ids[cidx].first;
        const std::string& column_name = column_ids[cidx].second;

        if (!schema.has_column(column_name)) {
            error.m_error_message = ("Value Error - Input column \""
                + column_name + "\" does not exist.");
            error.m_line = 0;
            error.m_column = 0;
            return DTYPE_NONE;
        }

        t_tscalar rval;

        // clear() is important as it sets the status to valid and the
        // underlying union value to 0, which prevents any reading of
        // uninitialized values out of the union.
        rval.clear();
        rval.m_type = schema.get_dtype(column_name);

        // If we are accessing string columns, the scalar CANNOT have a
        // nullptr as a string - use the empty string that we interned
        // in the gnode's expression vocab in t_gnode::init() at idx 0
        if (rval.m_type == DTYPE_STR) {
            rval.set(vocab.get_empty_string());
            rval.m_status = STATUS_INVALID;
        }

        values[cidx] = rval;

        sym_table.add_variable(column_id, values[cidx]);
    }

    exprtk::expression<t_tscalar> expr_definition;
    expr_definition.register_symbol_table(sym_table);

    if (!t_computed_expression_parser::PARSER->compile(
            parsed_expression_string, expr_definition)) {
        // Error count should always be above 0 if there is a compile error -
        // We simply take the first error and return it.
        if (t_computed_expression_parser::PARSER->error_count() > 0) {
            auto parser_error
                = t_computed_expression_parser::PARSER->get_error(0);

            // Given an error object and an expression, `update_error` maps the
            // error to a line and column number inside the expression.
            exprtk::parser_error::update_error(
                parser_error, parsed_expression_string);

            // Take the error message and strip the ExprTk error code
            std::string error_message(parser_error.diagnostic.c_str());

            // strip the Exprtk error codes such as "ERR001 -"
            error.m_error_message
                = error_message.substr(error_message.find("- ") + 2);

            error.m_line = parser_error.line_no;
            error.m_column = parser_error.column_no;
        } else {
            // If for whatever reason the error count is at 0, output a generic
            // parser error so that we report back a valid error object.
            error.m_error_message = "Parser Error";
            error.m_line = 0;
            error.m_column = 0;
        }

        return DTYPE_NONE;
    }

    t_tscalar v = expr_definition.value();
    t_dtype dtype = v.get_dtype();

    function_store.clear_computed_function_state();

    if (v.m_status == STATUS_CLEAR || dtype == DTYPE_NONE) {
        error.m_error_message
            = "Type Error - inputs do not resolve to a valid expression.";
        error.m_line = 0;
        error.m_column = 0;
        return DTYPE_NONE;
    }

    return dtype;
}

t_validated_expression_map::t_validated_expression_map() {}

void
t_validated_expression_map::add_expression(
    const std::string& expression_alias, const std::string& type_string) {
    // If the expression is in the error map, it should be removed as it is now
    // valid. This can happen when validating multiple expressions with the same
    // alias where the first instance is invalid, and the next occurence is
    // valid, and so on. This maintains the property that an expression will
    // exist in the schema OR the error map.
    auto error_iter = m_expression_errors.find(expression_alias);

    if (error_iter != m_expression_errors.end()) {
        m_expression_errors.erase(error_iter);
    }

    m_expression_schema[expression_alias] = type_string;
}

void
t_validated_expression_map::add_error(
    const std::string& expression_alias, t_expression_error& error) {
    // If the expression is in the schema, it should be removed as it is now
    // invalid. This can happen when validating multiple expressions with the
    // same alias where the first instance is valid, and the next occurence is
    // invalid, and so on. This maintains the property that an expression will
    // exist in the schema OR the error map.
    auto schema_iter = m_expression_schema.find(expression_alias);

    if (schema_iter != m_expression_schema.end()) {
        m_expression_schema.erase(schema_iter);
    }

    m_expression_errors[expression_alias] = error;
}

std::map<std::string, std::string>
t_validated_expression_map::get_expression_schema() const {
    return m_expression_schema;
}

std::map<std::string, t_expression_error>
t_validated_expression_map::get_expression_errors() const {
    return m_expression_errors;
}

t_computed_function_store::t_computed_function_store(t_expression_vocab& vocab,
    t_regex_mapping& regex_mapping, bool is_type_validator)
    : m_day_of_week_fn(computed_function::day_of_week(vocab, is_type_validator))
    , m_month_of_year_fn(
          computed_function::month_of_year(vocab, is_type_validator))
    , m_intern_fn(computed_function::intern(vocab, is_type_validator))
    , m_concat_fn(computed_function::concat(vocab, is_type_validator))
    , m_order_fn(computed_function::order(is_type_validator))
    , m_upper_fn(computed_function::upper(vocab, is_type_validator))
    , m_lower_fn(computed_function::lower(vocab, is_type_validator))
    , m_to_string_fn(computed_function::to_string(vocab, is_type_validator))
    , m_match_fn(computed_function::match(regex_mapping))
    , m_match_all_fn(computed_function::match_all(regex_mapping))
    , m_search_fn(
          computed_function::search(vocab, regex_mapping, is_type_validator))
    , m_indexof_fn(computed_function::indexof(regex_mapping))
    , m_substring_fn(computed_function::substring(vocab, is_type_validator))
    , m_replace_fn(
          computed_function::replace(vocab, regex_mapping, is_type_validator))
    , m_replace_all_fn(computed_function::replace_all(
          vocab, regex_mapping, is_type_validator)) {}

void
t_computed_function_store::register_computed_functions(
    exprtk::symbol_table<t_tscalar>& sym_table) {
    // General/numeric functions
    sym_table.add_function("bucket", t_computed_expression_parser::BUCKET_FN);
    sym_table.add_reserved_function(
        "inrange", t_computed_expression_parser::INRANGE_FN);
    sym_table.add_reserved_function(
        "min", t_computed_expression_parser::MIN_FN);
    sym_table.add_reserved_function(
        "max", t_computed_expression_parser::MAX_FN);
    sym_table.add_function(
        "percent_of", t_computed_expression_parser::PERCENT_OF_FN);
    sym_table.add_function("is_null", t_computed_expression_parser::IS_NULL_FN);
    sym_table.add_function(
        "is_not_null", t_computed_expression_parser::IS_NOT_NULL_FN);
    sym_table.add_function("random", t_computed_expression_parser::RANDOM_FN);

    // Date/datetime functions
    sym_table.add_function(
        "hour_of_day", t_computed_expression_parser::HOUR_OF_DAY_FN);
    sym_table.add_function("day_of_week", m_day_of_week_fn);
    sym_table.add_function("month_of_year", m_month_of_year_fn);
    sym_table.add_function("today", computed_function::today);
    sym_table.add_function("now", computed_function::now);

    // String functions
    sym_table.add_function("intern", m_intern_fn);
    sym_table.add_function("concat", m_concat_fn);
    sym_table.add_function("order", m_order_fn);
    sym_table.add_function("upper", m_upper_fn);
    sym_table.add_function("lower", m_lower_fn);
    sym_table.add_function("length", t_computed_expression_parser::LENGTH_FN);

    // Type conversion functions
    sym_table.add_function(
        "integer", t_computed_expression_parser::TO_INTEGER_FN);
    sym_table.add_function("float", t_computed_expression_parser::TO_FLOAT_FN);
    sym_table.add_function(
        "boolean", t_computed_expression_parser::TO_BOOLEAN_FN);
    sym_table.add_function("date", t_computed_expression_parser::MAKE_DATE_FN);
    sym_table.add_function(
        "datetime", t_computed_expression_parser::MAKE_DATETIME_FN);
    sym_table.add_function("string", m_to_string_fn);

    // Regex functions
    sym_table.add_function("match", m_match_fn);
    sym_table.add_function("match_all", m_match_all_fn);
    sym_table.add_function("search", m_search_fn);
    sym_table.add_function("indexof", m_indexof_fn);
    sym_table.add_function("substring", m_substring_fn);
    sym_table.add_function("replace", m_replace_fn);
    sym_table.add_function("replace_all", m_replace_all_fn);

    // And scalar constants
    sym_table.add_constant("True", t_computed_expression_parser::TRUE_SCALAR);
    sym_table.add_constant("False", t_computed_expression_parser::FALSE_SCALAR);
}

void
t_computed_function_store::clear_computed_function_state() {
    m_order_fn.clear_order_map();
}

} // end namespace perspective