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
        let columns = [];
        this.visit(ctx.Expression, columns);
        return columns;
    }

    Expression(ctx, columns) {
        this.visit(ctx.FunctionComputedColumn, columns);
    }

    FunctionComputedColumn(ctx, columns) {
        this.visit(ctx.ComputedColumn, columns);

        if (ctx.FunctionComputedColumn) {
            ctx.FunctionComputedColumn.forEach(col => {
                const fn = this.visit(col.Function);
                const column = this.visit(col.ColumnName, columns);

                // TODO: must parse recursive here and add to list in correct
                // order
                const as = this.visit(col.as);

                let column_name = COMPUTED_FUNCTION_FORMATTERS[fn](column);

                // Use custom name if provided through `AS/as/As`
                if (as) {
                    column_name = as;
                }

                const computed = {
                    column: column_name,
                    computed_function_name: fn,
                    inputs: [column]
                };

                columns.push(computed);
            });
        }
    }

    /**
     * Generate a single computed column configuration.
     * @param {*} ctx
     */
    ComputedColumn(ctx, columns) {
        let left = this.visit(ctx.left, columns);

        if (typeof left === "undefined") {
            left = columns[columns.length - 1].column;
        }

        let operator = this.visit(ctx.Operator);

        if (!operator) {
            return;
        }

        let right = this.visit(ctx.right, columns);

        if (typeof right === "undefined") {
            right = columns[columns.length - 1].column;
        }

        let as = this.visit(ctx.as);

        let column_name = COMPUTED_FUNCTION_FORMATTERS[operator](left, right);

        // Use custom name if provided through `AS/as/As`
        if (as) {
            column_name = as;
        }

        columns.push({
            column: column_name,
            computed_function_name: operator,
            inputs: [left, right]
        });
    }

    /**
     * Parse and return a column name to be included in the computed config.
     * @param {*} ctx
     */
    ColumnName(ctx, columns) {
        // `image` contains the raw string, `payload` contains the string
        // without quotes.
        if (ctx.ParentheticalExpression) {
            return this.visit(ctx.ParentheticalExpression, columns);
        } else {
            // FIXME: multiple column names in list?
            return ctx.columnName[0].payload;
        }
    }

    /**
     * Parse a single mathematical operator (+, -, *, /).
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
        } else {
            return;
        }
    }

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
        } else {
            return;
        }
    }

    /**
     * Give a custom name to the created computed column using "AS" or "as".
     * @param {*} ctx
     */
    As(ctx) {
        return ctx.ColumnName[0].children.columnName[0].payload;
    }

    ParentheticalExpression(ctx, columns) {
        return this.visit(ctx.Expression, columns);
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
