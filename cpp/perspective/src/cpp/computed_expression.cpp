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

std::shared_ptr<exprtk::parser<t_tscalar>>
t_computed_expression_parser::PARSER = std::make_shared<exprtk::parser<t_tscalar>>();

// Exprtk functions without any state can be initialized statically
computed_function::bucket t_computed_expression_parser::BUCKET_FN
    = computed_function::bucket();

computed_function::hour_of_day
t_computed_expression_parser::HOUR_OF_DAY_FN = computed_function::hour_of_day();

computed_function::min_fn
t_computed_expression_parser::MIN_FN = computed_function::min_fn();

computed_function::max_fn
t_computed_expression_parser::MAX_FN = computed_function::max_fn();

computed_function::percent_of
t_computed_expression_parser::PERCENT_OF_FN = computed_function::percent_of();

computed_function::is_null
t_computed_expression_parser::IS_NULL_FN = computed_function::is_null();

computed_function::is_not_null
t_computed_expression_parser::IS_NOT_NULL_FN = computed_function::is_not_null();

computed_function::make_date
t_computed_expression_parser::MAKE_DATE_FN = computed_function::make_date();

computed_function::make_datetime
t_computed_expression_parser::MAKE_DATETIME_FN = computed_function::make_datetime();

// As well as functions used for validation that have state but don't
// need it to validate input types.
computed_function::day_of_week
t_computed_expression_parser::DAY_OF_WEEK_VALIDATOR_FN = computed_function::day_of_week(nullptr);

computed_function::month_of_year
t_computed_expression_parser::MONTH_OF_YEAR_VALIDATOR_FN = computed_function::month_of_year(nullptr);

computed_function::intern
t_computed_expression_parser::INTERN_VALIDATOR_FN = computed_function::intern(nullptr);

computed_function::concat
t_computed_expression_parser::CONCAT_VALIDATOR_FN = computed_function::concat(nullptr);

computed_function::order
t_computed_expression_parser::ORDER_VALIDATOR_FN = computed_function::order(nullptr);

computed_function::upper
t_computed_expression_parser::UPPER_VALIDATOR_FN = computed_function::upper(nullptr);

computed_function::lower
t_computed_expression_parser::LOWER_VALIDATOR_FN = computed_function::lower(nullptr);

computed_function::length
t_computed_expression_parser::LENGTH_VALIDATOR_FN = computed_function::length(nullptr);

#define REGISTER_COMPUTE_FUNCTIONS(vocab)                                                        \
    computed_function::day_of_week day_of_week_fn = computed_function::day_of_week(vocab);         \
    computed_function::month_of_year month_of_year_fn = computed_function::month_of_year(vocab);   \
    computed_function::intern intern_fn = computed_function::intern(vocab);    \
    computed_function::concat concat_fn = computed_function::concat(vocab);    \
    computed_function::order order_fn = computed_function::order(vocab);       \
    computed_function::upper upper_fn = computed_function::upper(vocab);       \
    computed_function::lower lower_fn = computed_function::lower(vocab);       \
    computed_function::length length_fn = computed_function::length(vocab);    \
    sym_table.add_function("today", computed_function::today);                              \
    sym_table.add_function("now", computed_function::now);                                  \
    sym_table.add_function("bucket", t_computed_expression_parser::BUCKET_FN);              \
    sym_table.add_function("hour_of_day", t_computed_expression_parser::HOUR_OF_DAY_FN);    \
    sym_table.add_function("day_of_week", day_of_week_fn);                                  \
    sym_table.add_function("month_of_year", month_of_year_fn);                              \
    sym_table.add_function("intern", intern_fn);                                            \
    sym_table.add_function("concat", concat_fn);                                            \
    sym_table.add_function("order", order_fn);                                              \
    sym_table.add_function("upper", upper_fn);                                              \
    sym_table.add_function("lower", lower_fn);                                              \
    sym_table.add_function("length", length_fn);                                            \
    sym_table.add_reserved_function("min", t_computed_expression_parser::MIN_FN);           \
    sym_table.add_reserved_function("max", t_computed_expression_parser::MAX_FN);           \
    sym_table.add_function("percent_of", t_computed_expression_parser::PERCENT_OF_FN);      \
    sym_table.add_function("is_null", t_computed_expression_parser::IS_NULL_FN);            \
    sym_table.add_function("is_not_null", t_computed_expression_parser::IS_NOT_NULL_FN);    \
    sym_table.add_function("date", t_computed_expression_parser::MAKE_DATE_FN);             \
    sym_table.add_function("datetime", t_computed_expression_parser::MAKE_DATETIME_FN);     \

#define REGISTER_VALIDATION_FUNCTIONS()                                                     \
    sym_table.add_function("today", computed_function::today);                              \
    sym_table.add_function("now", computed_function::now);                                  \
    sym_table.add_function("bucket", t_computed_expression_parser::BUCKET_FN);              \
    sym_table.add_function("hour_of_day", t_computed_expression_parser::HOUR_OF_DAY_FN);    \
    sym_table.add_function("day_of_week", t_computed_expression_parser::DAY_OF_WEEK_VALIDATOR_FN);    \
    sym_table.add_function("month_of_year", t_computed_expression_parser::MONTH_OF_YEAR_VALIDATOR_FN);    \
    sym_table.add_function("intern", t_computed_expression_parser::INTERN_VALIDATOR_FN);    \
    sym_table.add_function("concat", t_computed_expression_parser::CONCAT_VALIDATOR_FN);    \
    sym_table.add_function("order", t_computed_expression_parser::ORDER_VALIDATOR_FN);      \
    sym_table.add_function("upper", t_computed_expression_parser::UPPER_VALIDATOR_FN);      \
    sym_table.add_function("lower", t_computed_expression_parser::LOWER_VALIDATOR_FN);      \
    sym_table.add_function("length", t_computed_expression_parser::LENGTH_VALIDATOR_FN);    \
    sym_table.add_reserved_function("min", t_computed_expression_parser::MIN_FN);           \
    sym_table.add_reserved_function("max", t_computed_expression_parser::MAX_FN);           \
    sym_table.add_function("percent_of", t_computed_expression_parser::PERCENT_OF_FN);      \
    sym_table.add_function("is_null", t_computed_expression_parser::IS_NULL_FN);            \
    sym_table.add_function("is_not_null", t_computed_expression_parser::IS_NOT_NULL_FN);    \
    sym_table.add_function("date", t_computed_expression_parser::MAKE_DATE_FN);             \
    sym_table.add_function("datetime", t_computed_expression_parser::MAKE_DATETIME_FN);     \

/******************************************************************************
 *
 * t_computed_expression
 */

t_computed_expression::t_computed_expression(
        const std::string& expression_alias,
        const std::string& expression_string,
        const std::string& parsed_expression_string,
        const std::vector<std::pair<std::string, std::string>>& column_ids,
        t_dtype dtype)
    : m_expression_alias(expression_alias)
    , m_expression_string(expression_string)
    , m_parsed_expression_string(parsed_expression_string)
    , m_column_ids(std::move(column_ids))
    , m_expression_vocab(nullptr)
    , m_dtype(dtype) {}

void
t_computed_expression::compute(
    std::shared_ptr<t_data_table> source_table,
    std::shared_ptr<t_data_table> destination_table,
    std::shared_ptr<t_vocab> vocab) const {
    // TODO: share symtables across pre/re/compute
    exprtk::symbol_table<t_tscalar> sym_table;
    sym_table.add_constants();

    REGISTER_COMPUTE_FUNCTIONS(vocab)

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
        rval.m_type = columns[column_id]->get_dtype();

        values[cidx] = std::pair<std::string, t_tscalar>(column_id, rval);
        sym_table.add_variable(column_id, values[cidx].second);
    }

    expr_definition.register_symbol_table(sym_table);

    if (!t_computed_expression_parser::PARSER->compile(m_parsed_expression_string, expr_definition)) {
        std::stringstream ss;
        ss << "[t_computed_expression::compute] Failed to parse expression: `"
            << m_parsed_expression_string
            << "`, failed with error: "
            << t_computed_expression_parser::PARSER->error()
            << std::endl;

        PSP_COMPLAIN_AND_ABORT(ss.str());
    }

    // create or get output column using m_expression_alias
    auto output_column = destination_table->add_column_sptr(m_expression_alias, m_dtype, true);
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
        .disable_control_structure(exprtk::parser<t_tscalar>::settings_store::e_ctrl_repeat_loop)
        .disable_base_function(exprtk::parser<t_tscalar>::settings_store::e_bf_min)
        .disable_base_function(exprtk::parser<t_tscalar>::settings_store::e_bf_max);
}

std::shared_ptr<t_computed_expression>
t_computed_expression_parser::precompute(
    const std::string& expression_alias,
    const std::string& expression_string,
    const std::string& parsed_expression_string,
    const std::vector<std::pair<std::string, std::string>>& column_ids,
    std::shared_ptr<t_schema> schema
) {
    exprtk::symbol_table<t_tscalar> sym_table;
    sym_table.add_constants();

    REGISTER_VALIDATION_FUNCTIONS()

    std::vector<t_tscalar> values;

    auto num_input_columns = column_ids.size();
    values.resize(num_input_columns);

    // Add a new scalar of the input column type to the symtable, which
    // will use the scalar to validate the output type of the expression.
    for (t_uindex cidx = 0; cidx < num_input_columns; ++cidx) {
        const std::string& column_id = column_ids[cidx].first;
        const std::string& column_name = column_ids[cidx].second;

        t_tscalar rval;
        rval.m_type = schema->get_dtype(column_name);
        rval.m_status = STATUS_INVALID;
        values[cidx] = rval;

        sym_table.add_variable(column_id, values[cidx]);
    }

    exprtk::expression<t_tscalar> expr_definition;
    expr_definition.register_symbol_table(sym_table);

    if (!t_computed_expression_parser::PARSER->compile(parsed_expression_string, expr_definition)) {
        std::stringstream ss;
        ss << "[t_computed_expression_parser::precompute] Failed to parse expression: `"
            << parsed_expression_string
            << "`, failed with error: "
            << t_computed_expression_parser::PARSER->error()
            << std::endl;
        PSP_COMPLAIN_AND_ABORT(ss.str());
    }

    t_tscalar v = expr_definition.value();

    return std::make_shared<t_computed_expression>(
        expression_alias,
        expression_string,
        parsed_expression_string,
        column_ids,
        v.get_dtype());
}

t_dtype
t_computed_expression_parser::get_dtype(
    const std::string& expression_alias,
    const std::string& expression_string,
    const std::string& parsed_expression_string,
    const std::vector<std::pair<std::string, std::string>>& column_ids,
    const t_schema& schema,
    std::string& error_string
) {
    exprtk::symbol_table<t_tscalar> sym_table;
    sym_table.add_constants();

    std::vector<t_tscalar> values;

    REGISTER_VALIDATION_FUNCTIONS()

    auto num_input_columns = column_ids.size();
    values.resize(num_input_columns);

    // Add a new scalar of the input column type to the symtable, which
    // will use the scalar to validate the output type of the expression.
    for (t_uindex cidx = 0; cidx < num_input_columns; ++cidx) {
        const std::string& column_id = column_ids[cidx].first;
        const std::string& column_name = column_ids[cidx].second;

        if (!schema.has_column(column_name)) {
            error_string += ("Value Error - Input column \"" + column_name + "\" does not exist.");
            return DTYPE_NONE;
        }

        t_tscalar rval;
        rval.m_type = schema.get_dtype(column_name);
        rval.m_status = STATUS_INVALID;
        values[cidx] = rval;

        sym_table.add_variable(column_id, values[cidx]);
    }

    exprtk::expression<t_tscalar> expr_definition;
    expr_definition.register_symbol_table(sym_table);

    if (!t_computed_expression_parser::PARSER->compile(parsed_expression_string, expr_definition)) {
        auto error = t_computed_expression_parser::PARSER->error();
        // strip the Exprtk error codes such as "ERR001 -"
        error_string += "Parser Error " + error.substr(error.find("- "));
        return DTYPE_NONE;
    }

    t_tscalar v = expr_definition.value();

    if (v.m_status == STATUS_CLEAR) {
        error_string += "Type Error - inputs do not resolve to a valid expression.";
        return DTYPE_NONE;
    }

    return v.get_dtype();
}

t_validated_expression_map::t_validated_expression_map(t_uindex capacity) {
    if (capacity > 0) {
        m_expressions.reserve(capacity);
        m_results.reserve(capacity);
        m_expression_map.reserve(capacity);
    }
}

void
t_validated_expression_map::add(
    const std::string& expression_alias, const std::string& result) {
    if (m_expression_map.count(expression_alias)) {
        t_uindex idx = m_expression_map[expression_alias];
        m_results[idx] = result;
    } else {
        m_expressions.push_back(expression_alias);
        m_results.push_back(result);
        m_expression_map[expression_alias] = m_expressions.size() - 1;
    }
}

t_uindex
t_validated_expression_map::size() const {
    return m_expression_map.size();
}

const std::vector<std::string>&
t_validated_expression_map::get_expressions() const {
    return m_expressions;
}

const std::vector<std::string>&
t_validated_expression_map::get_results() const {
    return m_results;
}
} // end namespace perspective