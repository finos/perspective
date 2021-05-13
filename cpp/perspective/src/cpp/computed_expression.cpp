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

// Register functions in a centralized macro instead of copy-pasting the same
// lines between compute/recompute
#define REGISTER_COMPUTE_FUNCTIONS()                                                        \
    computed_function::day_of_week day_of_week_fn = computed_function::day_of_week(m_expression_vocab);         \
    computed_function::month_of_year month_of_year_fn = computed_function::month_of_year(m_expression_vocab);   \
    computed_function::intern intern_fn = computed_function::intern(m_expression_vocab);    \
    computed_function::concat concat_fn = computed_function::concat(m_expression_vocab);    \
    computed_function::order order_fn = computed_function::order(m_expression_vocab);       \
    computed_function::upper upper_fn = computed_function::upper(m_expression_vocab);       \
    computed_function::lower lower_fn = computed_function::lower(m_expression_vocab);       \
    computed_function::length length_fn = computed_function::length(m_expression_vocab);    \
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
    std::shared_ptr<t_data_table> data_table) const {
    // TODO: share symtables across pre/re/compute
    exprtk::symbol_table<t_tscalar> sym_table;
    sym_table.add_constants();

    REGISTER_COMPUTE_FUNCTIONS()

    exprtk::expression<t_tscalar> expr_definition;
    std::vector<std::pair<std::string, t_tscalar>> values;
    tsl::hopscotch_map<std::string, std::shared_ptr<t_column>> columns;

    auto num_input_columns = m_column_ids.size();
    values.resize(num_input_columns);
    columns.reserve(num_input_columns);

    for (t_uindex cidx = 0; cidx < num_input_columns; ++cidx) {
        const std::string& column_id = m_column_ids[cidx].first;
        const std::string& column_name = m_column_ids[cidx].second;
        columns[column_id] = data_table->get_column(column_name);

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

    // Store the expression column under the entire string as typed by the user
    auto output_column = data_table->add_column_sptr(m_expression_string, m_dtype, true);
    auto num_rows = data_table->size();

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

void
t_computed_expression::recompute(
    std::shared_ptr<t_data_table> gstate_table,
    std::shared_ptr<t_data_table> flattened,
    const std::vector<t_rlookup>& changed_rows) const {
    exprtk::symbol_table<t_tscalar> sym_table;
    sym_table.add_constants();

    REGISTER_COMPUTE_FUNCTIONS()

    exprtk::expression<t_tscalar> expr_definition;
    std::vector<std::pair<std::string, t_tscalar>> values;

    /**
     * To properly recompute columns when updates have been applied, we need 
     * to keep both the columns from flattened (the table that contains the 
     * new round of update data) and the gstate_table (the master table that 
     * contains the entire state of the Perspective table up to this point).
     * 
     * This is especially important for partial updates, where cells can be
     * `null` or `undefined`, and we need to apply/not apply computations
     * based on both the value in `flattened` and the `gstate_table`.
     */
    tsl::hopscotch_map<std::string, std::shared_ptr<t_column>> flattened_columns;
    tsl::hopscotch_map<std::string, std::shared_ptr<t_column>> gstate_table_columns;

    auto num_input_columns = m_column_ids.size();

    values.resize(num_input_columns);
    flattened_columns.reserve(num_input_columns);
    gstate_table_columns.reserve(num_input_columns);

    for (t_uindex cidx = 0; cidx < num_input_columns; ++cidx) {
        const std::string& column_id = m_column_ids[cidx].first;
        const std::string& column_name = m_column_ids[cidx].second;
        flattened_columns[column_id] = flattened->get_column(column_name);
        gstate_table_columns[column_id] = gstate_table->get_column(column_name);

        t_tscalar rval;
        rval.m_type = flattened_columns[column_id]->get_dtype();
        values[cidx] = std::pair<std::string, t_tscalar>(column_id, rval);
        sym_table.add_variable(column_id, values[cidx].second);
    }

    expr_definition.register_symbol_table(sym_table);

    if (!t_computed_expression_parser::PARSER->compile(m_parsed_expression_string, expr_definition)) {
        std::stringstream ss;
        ss << "[t_computed_expression::recompute] Failed to parse expression: `"
            << m_parsed_expression_string
            << "`, failed with error: "
            << t_computed_expression_parser::PARSER->error()
            << std::endl;

        PSP_COMPLAIN_AND_ABORT(ss.str());
    }

    // get or create the output column
    auto output_column = flattened->add_column_sptr(m_expression_string, m_dtype, true);
    output_column->reserve(gstate_table->size());

    t_uindex num_rows = changed_rows.size();

    if (num_rows == 0) {
        num_rows = gstate_table->size();
    } 

    for (t_uindex idx = 0; idx < num_rows; ++idx) {
        bool row_already_exists = false;

        // if changed_rows is not empty, ridx will point to a row index in
        // the gnode state master table, whereas idx will always point to
        // the row index in the flattened table containing the data from
        // this update/process cycle.
        t_uindex ridx = idx;

        if (changed_rows.size() > 0) {
            ridx = changed_rows[idx].m_idx;
            row_already_exists = changed_rows[idx].m_exists;
        }
    
        bool skip_row = false;

        for (t_uindex cidx = 0; cidx < num_input_columns; ++cidx) {
            const std::string& column_id = m_column_ids[cidx].first;

            t_tscalar arg = flattened_columns[column_id]->get_scalar(idx);

            if (!arg.is_valid()) {
                /**
                 * TODO: should these semantics change now that we don't
                 * check or maintain intermediates?
                 * 
                 * If the row already exists on the gstate table and the cell
                 * in `flattened` is `STATUS_CLEAR`, do not compute the row and
                 * unset its value in the output column.
                 * 
                 * If the row does not exist, and the cell in `flattened` is
                 * `STATUS_INVALID`, do not compute the row and unset its value
                 * in the output column.
                 * 
                 * `idx` is used here instead of `ridx`, as `ridx` refers
                 * to the row index in changed_rows, i.e. the changed row
                 * on the gstate table, whereas idx is the row index
                 * in the flattened table.
                 */
                bool should_unset = 
                    (row_already_exists && flattened_columns[column_id]->is_cleared(idx)) ||
                    (!row_already_exists && !flattened_columns[column_id]->is_valid(idx));

                /**
                 * Use `unset` instead of `clear`, as
                 * `t_gstate::update_master_table` will reconcile `STATUS_CLEAR`
                 * into `STATUS_INVALID`.
                 */
                if (should_unset) {
                    output_column->unset(idx);
                    skip_row = true;
                    break;  
                } else {
                    // Get the value from the master table using `ridx`,
                    // which points to a row in the master table that is
                    // being overwritten in this partial update.
                    arg = gstate_table_columns[column_id]->get_scalar(ridx);
                }
            }

            values[cidx].second.set(arg);
        }

        if (skip_row) continue;

        t_tscalar value = expr_definition.value();

        if (!value.is_valid() || value.is_none()) {
            output_column->clear(idx);
            continue;
        }
        
        output_column->set_scalar(idx, value);
    }
}

void
t_computed_expression::set_expression_vocab(std::shared_ptr<t_vocab> expression_vocab) {
    m_expression_vocab = expression_vocab;
}

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

t_computed_expression
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

    return t_computed_expression(
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