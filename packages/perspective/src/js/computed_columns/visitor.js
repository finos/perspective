/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {lex} from "./lexer";
import {ComputedColumnParser} from "./parser";
import {COMPUTED_FUNCTION_FORMATTERS} from "./formatter";

const parser = new ComputedColumnParser([]);
const base_visitor = parser.getBaseCstVisitorConstructor();

export class ComputedColumnVisitor extends base_visitor {
    constructor() {
        super();
        this.validateVisitor();
    }

    SuperExpression(ctx) {
        let computed_columns = [];
        this.visit(ctx.Expression, computed_columns);
        return computed_columns;
    }

    Expression(ctx, computed_columns) {
        if (ctx.OperatorComputedColumn) {
            this.visit(ctx.OperatorComputedColumn, computed_columns);
        } else if (ctx.FunctionComputedColumn) {
            this.visit(ctx.FunctionComputedColumn, computed_columns);
        } else {
            return;
        }
    }

    /**
     * Visit a single computed column in operator notation and generate its
     * specification.
     *
     * @param {*} ctx
     */
    OperatorComputedColumn(ctx, computed_columns) {
        let left = this.visit(ctx.left, computed_columns);

        if (typeof left === "undefined") {
            left = computed_columns[computed_columns.length - 1].column;
        }

        let operator = this.visit(ctx.Operator);

        if (!operator) {
            return;
        }

        let right = this.visit(ctx.right, computed_columns);

        if (typeof right === "undefined") {
            right = computed_columns[computed_columns.length - 1].column;
        }

        let as = this.visit(ctx.as);

        let column_name = COMPUTED_FUNCTION_FORMATTERS[operator](left, right);

        // Use custom name if provided through `AS/as/As`
        if (as) {
            column_name = as;
        }

        computed_columns.push({
            column: column_name,
            computed_function_name: operator,
            inputs: [left, right]
        });
    }

    /**
     * Visit a single computed column in functional notation and generate its
     * specification.
     *
     * @param {*} ctx
     * @param {*} computed_columns
     */
    FunctionComputedColumn(ctx, computed_columns) {
        const fn = this.visit(ctx.Function);

        // Functions have 1...n parameters
        let input_columns = [];

        for (const column_name of ctx.ColumnName) {
            let column = this.visit(column_name, computed_columns);
            if (typeof column === "undefined") {
                // Use the column immediately to the left, as that is the
                // name of the parsed column from the expression
                input_columns.push(computed_columns[computed_columns.length - 1].column);
            } else {
                input_columns.push(column);
            }
        }

        const as = this.visit(ctx.as);

        let column_name = COMPUTED_FUNCTION_FORMATTERS[fn](...input_columns);

        // Use custom name if provided through `AS/as/As`
        if (as) {
            column_name = as;
        }

        const computed = {
            column: column_name,
            computed_function_name: fn,
            inputs: input_columns
        };

        computed_columns.push(computed);
    }

    /**
     * Parse and return a column name to be included in the computed config.
     * @param {*} ctx
     */
    ColumnName(ctx, computed_columns) {
        // `image` contains the raw string, `payload` contains the string
        // without quotes.
        if (ctx.ParentheticalExpression) {
            return this.visit(ctx.ParentheticalExpression, computed_columns);
        } else {
            return ctx.columnName[0].payload;
        }
    }

    /**
     * Parse and return a column name to be included in the computed config, and
     * explicitly not parsed as a parenthetical expression.
     *
     * @param {*} ctx
     */
    TerminalColumnName(ctx) {
        return ctx.columnName[0].payload;
    }

    /**
     * Parse a single mathematical operator (+, -, *, /, %).
     * @param {*} ctx
     */
    Operator(ctx) {
        if (ctx.add) {
            return ctx.add[0].image;
        } else if (ctx.subtract) {
            return ctx.subtract[0].image;
        } else if (ctx.multiply) {
            return ctx.multiply[0].image;
        } else if (ctx.divide) {
            return ctx.divide[0].image;
        } else if (ctx.percent_of) {
            return ctx.percent_of[0].image;
        } else {
            return;
        }
    }

    /**
     * Identify and return a function name used for computation.
     *
     * @param {*} ctx
     */
    Function(ctx) {
        if (ctx.sqrt) {
            return ctx.sqrt[0].image;
        } else if (ctx.pow2) {
            return ctx.pow2[0].image;
        } else if (ctx.abs) {
            return ctx.abs[0].image;
        } else if (ctx.uppercase) {
            return ctx.uppercase[0].image;
        } else if (ctx.lowercase) {
            return ctx.lowercase[0].image;
        } else if (ctx.concat_comma) {
            return ctx.concat_comma[0].image;
        } else if (ctx.concat_space) {
            return ctx.lowercase[0].image;
        } else if (ctx.bin10) {
            return ctx.bin10[0].image;
        } else if (ctx.bin100) {
            return ctx.bin100[0].image;
        } else if (ctx.bin1000) {
            return ctx.bin1000[0].image;
        } else if (ctx.bin10th) {
            return ctx.bin10th[0].image;
        } else if (ctx.bin100th) {
            return ctx.bin100th[0].image;
        } else if (ctx.bin1000th) {
            return ctx.bin1000th[0].image;
        } else if (ctx.hour_of_day) {
            return ctx.hour_of_day[0].image;
        } else if (ctx.day_of_week) {
            return ctx.day_of_week[0].image;
        } else if (ctx.month_of_year) {
            return ctx.month_of_year[0].image;
        } else if (ctx.second_bucket) {
            return ctx.second_bucket[0].image;
        } else if (ctx.minute_bucket) {
            return ctx.minute_bucket[0].image;
        } else if (ctx.hour_bucket) {
            return ctx.hour_bucket[0].image;
        } else if (ctx.day_bucket) {
            return ctx.day_bucket[0].image;
        } else if (ctx.week_bucket) {
            return ctx.week_bucket[0].image;
        } else if (ctx.month_bucket) {
            return ctx.month_bucket[0].image;
        } else if (ctx.year_bucket) {
            return ctx.year_bucket[0].image;
        } else {
            return;
        }
    }

    /**
     * Give a custom name to the created computed column using "AS" or "as".
     *
     * @param {*} ctx
     */
    As(ctx) {
        return ctx.TerminalColumnName[0].children.columnName[0].payload;
    }

    /**
     * Parse an expression inside parentheses through recursing back up to
     * `Expression`.
     *
     * @param {*} ctx
     * @param {*} computed_columns
     */
    ParentheticalExpression(ctx, computed_columns) {
        return this.visit(ctx.Expression, computed_columns);
    }
}

// We only need one visitor instance - state is reset using `parser.input`.
const visitor = new ComputedColumnVisitor();

/**
 * Given a string expression of the form '"column" +, -, *, / "column",
 * parse it and return a computed column configuration object.
 *
 * @param {String} expression
 */
export const expression_to_computed_column_config = function(expression) {
    const lex_result = lex(expression);

    // calling `parser.input` resets state.
    parser.input = lex_result.tokens;

    const cst = parser.SuperExpression();

    if (parser.errors.length > 0) {
        throw new Error(parser.errors);
    }

    return visitor.visit(cst);
};
