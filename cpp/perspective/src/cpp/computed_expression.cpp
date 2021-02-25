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
exprtk::symbol_table<t_tscalar>
t_computed_expression_parser::GLOBAL_SYMTABLE = exprtk::symbol_table<t_tscalar>();

t_computed_expression::t_computed_expression(
        const std::string& expression_string,
        const std::string& parsed_expression_string,
        const std::vector<std::pair<std::string, std::string>>& column_ids,
        t_dtype dtype)
    : m_expression_string(expression_string)
    , m_parsed_expression_string(parsed_expression_string)
    , m_column_ids(std::move(column_ids))
    , m_dtype(dtype) {}

void
t_computed_expression::compute(
    std::shared_ptr<t_data_table> data_table) const {
    exprtk::symbol_table<t_tscalar> sym_table;

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

    expr_definition.register_symbol_table(t_computed_expression_parser::GLOBAL_SYMTABLE);
    expr_definition.register_symbol_table(sym_table);

    if (!t_computed_expression_parser::PARSER->compile(m_parsed_expression_string, expr_definition)) {
        std::stringstream ss;
        ss << "[t_computed_expression::compute] Failed to parse expression: `"
            << m_parsed_expression_string
            << "`, failed with error: "
            << t_computed_expression_parser::PARSER->error().c_str()
            << std::endl;

        PSP_COMPLAIN_AND_ABORT(ss.str());
    }

    // create or get output column - m_expression_string is the string as
    // the user typed it.
    auto output_column = data_table->add_column_sptr(m_expression_string, m_dtype, true);
    auto num_rows = data_table->size();
    output_column->reserve(num_rows);

    for (t_uindex ridx = 0; ridx < num_rows; ++ridx) {
        for (t_uindex cidx = 0; cidx < num_input_columns; ++cidx) {
            const std::string& column_id = m_column_ids[cidx].first;
            values[cidx].second.set(columns[column_id]->get_scalar(ridx));
        }
    
        t_tscalar value = expr_definition.value();

        output_column->set_scalar(ridx, value);
    }
};

void
t_computed_expression::recompute(
    std::shared_ptr<t_data_table> gstate_table,
    std::shared_ptr<t_data_table> flattened,
    const std::vector<t_rlookup>& changed_rows) const {
    exprtk::symbol_table<t_tscalar> sym_table;

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

    expr_definition.register_symbol_table(t_computed_expression_parser::GLOBAL_SYMTABLE);
    expr_definition.register_symbol_table(sym_table);

    if (!t_computed_expression_parser::PARSER->compile(m_parsed_expression_string, expr_definition)) {
        std::stringstream ss;
        ss << "[t_computed_expression::recompute] Failed to parse expression: `"
            << m_parsed_expression_string
            << "`, failed with error: "
            << t_computed_expression_parser::PARSER->error().c_str()
            << std::endl;

        PSP_COMPLAIN_AND_ABORT(ss.str());
    }

    auto output_column = flattened->add_column_sptr(m_expression_string, m_dtype, true);

    output_column->reserve(gstate_table->size());

    t_uindex num_rows = changed_rows.size();

    if (num_rows == 0) {
        num_rows = gstate_table->size();
    } 

    for (t_uindex idx = 0; idx < num_rows; ++idx) {
        bool row_already_exists = false;
        t_uindex ridx = idx;

        if (changed_rows.size() > 0) {
            ridx = changed_rows[idx].m_idx;
            row_already_exists = changed_rows[idx].m_exists;
        }

        bool skip_row = false;

        for (t_uindex cidx = 0; cidx < num_input_columns; ++cidx) {
            const std::string& column_id = m_column_ids[cidx].first;

            t_tscalar arg = flattened_columns[column_id]->get_scalar(ridx);

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
                    // Use the value in the master table to compute.
                    arg = gstate_table_columns[column_id]->get_scalar(ridx);
                }
            }

            values[cidx].second.set(arg);
        }

        if (skip_row) continue;

        t_tscalar value = expr_definition.value();
        output_column->set_scalar(ridx, value);
    }
}

std::string
t_computed_expression::get_expression_string() const {
    return m_expression_string;
}

std::string
t_computed_expression::get_parsed_expression_string() const {
    return m_parsed_expression_string;
}

std::vector<std::pair<std::string, std::string>>
t_computed_expression::get_column_ids() const {
    return m_column_ids;
}

t_dtype
t_computed_expression::get_dtype() const {
    return m_dtype;
}

void
t_computed_expression_parser::init() {
    t_computed_expression_parser::GLOBAL_SYMTABLE.add_constants();
}

t_computed_expression
t_computed_expression_parser::precompute(
    const std::string& expression_string,
    const std::string& parsed_expression_string,
    const std::vector<std::pair<std::string, std::string>>& column_ids,
    std::shared_ptr<t_schema> schema
) {
    exprtk::symbol_table<t_tscalar> sym_table;
    exprtk::expression<t_tscalar> expr_definition;

    // We aren't accessing values over multiple iterations, so we don't need
    // to track the column name.
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

        // Needs to be valid here, as invalid scalars will return DTYPE_NONE
        // and all we care about is the dtype and not validity.
        rval.m_status = STATUS_VALID;
        values[cidx] = rval;

        sym_table.add_variable(column_id, values[cidx]);
    }

    expr_definition.register_symbol_table(t_computed_expression_parser::GLOBAL_SYMTABLE);
    expr_definition.register_symbol_table(sym_table);

    if (!t_computed_expression_parser::PARSER->compile(parsed_expression_string, expr_definition)) {
        std::stringstream ss;
        ss << "[t_computed_expression_parser::precompute] Failed to parse expression: `"
            << parsed_expression_string
            << "`, failed with error: "
            << t_computed_expression_parser::PARSER->error().c_str()
            << std::endl;
        PSP_COMPLAIN_AND_ABORT(ss.str());
    }

    t_tscalar v = expr_definition.value();

    return t_computed_expression(
        expression_string,
        parsed_expression_string,
        column_ids,
        v.get_dtype());
}

t_dtype
t_computed_expression_parser::get_dtype(
    const std::string& expression_string,
    const std::string& parsed_expression_string,
    const std::vector<std::pair<std::string, std::string>>& column_ids,
    const t_schema& schema
) {
    exprtk::symbol_table<t_tscalar> sym_table;
    exprtk::expression<t_tscalar> expr_definition;

    // We aren't accessing values over multiple iterations, so we don't need
    // to track the column name.
    std::vector<t_tscalar> values;

    auto num_input_columns = column_ids.size();
    values.resize(num_input_columns);

    bool has_invalid_column = false;

    // Add a new scalar of the input column type to the symtable, which
    // will use the scalar to validate the output type of the expression.
    for (t_uindex cidx = 0; cidx < num_input_columns; ++cidx) {
        const std::string& column_id = column_ids[cidx].first;
        const std::string& column_name = column_ids[cidx].second;

        if (!schema.has_column(column_name)) {
            std::cerr << "[t_computed_expression_parser::get_dtype] Column `"
                << column_name << "` does not exist in the schema!"
                << std::endl;
            has_invalid_column = false;
            break;
        }

        t_tscalar rval;
        rval.m_type = schema.get_dtype(column_name);

        // Needs to be valid here, as invalid scalars will return DTYPE_NONE
        // and all we care about is the dtype and not validity.
        rval.m_status = STATUS_VALID;
        values[cidx] = rval;

        sym_table.add_variable(column_id, values[cidx]);
    }

    if (has_invalid_column) {
        return DTYPE_NONE;
    }

    expr_definition.register_symbol_table(t_computed_expression_parser::GLOBAL_SYMTABLE);
    expr_definition.register_symbol_table(sym_table);

    if (!t_computed_expression_parser::PARSER->compile(parsed_expression_string, expr_definition)) {
        return DTYPE_NONE;
    }

    t_tscalar v = expr_definition.value();
    return v.get_dtype();
}

} // end namespace perspective