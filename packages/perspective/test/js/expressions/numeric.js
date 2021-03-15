/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const common = require("./common.js");
const NUMERIC_TYPES = ["i8", "ui8", "i16", "ui16", "i32", "ui32", "i64", "ui64", "f32", "f64"];

/**
 * Return all possible permutations of unary operators for all numeric types.
 */
function generate_unary_operations(operator) {
    const expressions = [];
    for (const expr of NUMERIC_TYPES) {
        expressions.push(`${operator}"${expr}"`);
    }
    return expressions;
}

/**
 * Return all possible permutations of binary operators for all numeric types.
 */
function generate_binary_operations(operator) {
    const expressions = [];
    for (const expr of NUMERIC_TYPES) {
        for (let i = 0; i < NUMERIC_TYPES.length; i++) {
            expressions.push(`"${expr}" ${operator} "${NUMERIC_TYPES[i]}"`);
        }
    }
    return expressions;
}

function calc_unary(operator, value) {
    switch (operator) {
        case "+":
            return +value;
        case "-":
            return -value;
        default:
            throw new Error("Unknown operator");
    }
}

function calc_binary(operator, left, right) {
    switch (operator) {
        case "+":
            return left + right;
        case "-":
            return left - right;
        case "*":
            return left * right;
        case "/":
            return left / right;
        case "%":
            return left % right;
        case "^":
            return Math.pow(left, right);
        default:
            throw new Error("Unknown operator");
    }
}

/**
 * Validate the results of operations against all numeric types.
 *
 * @param {*} operator
 */
function validate_unary_operations(output, expressions, operator) {
    for (const expr of expressions) {
        const output_col = output[expr];
        const input = expr.substr(2, expr.length - 3);
        console.log(input);
        expect(output_col).toEqual(output[input].map(v => calc_unary(operator, v)));
    }
}

/**
 * Validate the results of operations against all numeric types.
 *
 * @param {*} operator
 */
function validate_binary_operations(output, expressions, operator) {
    for (const expr of expressions) {
        const output_col = output[expr];
        const inputs = expr.split(` ${operator} `);
        const left = inputs[0].substr(1, inputs[0].length - 2);
        const right = inputs[1].substr(1, inputs[1].length - 2);
        expect(output_col).toEqual(output[left].map((v, idx) => calc_binary(operator, v, output[right][idx])));
    }
}
/**
 * Tests the correctness of expressions allowed by exprtk, using as many
 * of the expression structures as we can, such as conditionals, loops, etc.
 */
module.exports = perspective => {
    describe("Numeric operations", function() {
        describe("All numeric types", function() {
            describe("unary", function() {
                it("negative", async function() {
                    const table = await perspective.table(common.all_types_arrow.slice());
                    const expressions = generate_unary_operations("+");
                    const view = await table.view({
                        expressions
                    });

                    const col_names = await view.column_paths();

                    for (const expr of expressions) {
                        expect(col_names.includes(expr)).toBe(true);
                    }

                    const result = await view.to_columns();
                    validate_unary_operations(result, expressions, "+");
                    await view.delete();
                    await table.delete();
                });
            });

            describe("binary", function() {
                it("add", async function() {
                    const table = await perspective.table(common.all_types_arrow.slice());
                    const expressions = generate_binary_operations("+");
                    const view = await table.view({
                        expressions
                    });

                    const col_names = await view.column_paths();

                    for (const expr of expressions) {
                        expect(col_names.includes(expr)).toBe(true);
                    }

                    const result = await view.to_columns();
                    validate_binary_operations(result, expressions, "+");
                    await view.delete();
                    await table.delete();
                });

                it("subtract", async function() {
                    const table = await perspective.table(common.all_types_arrow.slice());
                    const expressions = generate_binary_operations("-");
                    const view = await table.view({
                        expressions
                    });

                    const col_names = await view.column_paths();

                    for (const expr of expressions) {
                        expect(col_names.includes(expr)).toBe(true);
                    }

                    const result = await view.to_columns();
                    validate_binary_operations(result, expressions, "-");
                    await view.delete();
                    await table.delete();
                });

                it("multiply", async function() {
                    const table = await perspective.table(common.all_types_arrow.slice());
                    const expressions = generate_binary_operations("*");
                    const view = await table.view({
                        expressions
                    });

                    const col_names = await view.column_paths();

                    for (const expr of expressions) {
                        expect(col_names.includes(expr)).toBe(true);
                    }

                    const result = await view.to_columns();
                    validate_binary_operations(result, expressions, "*");
                    await view.delete();
                    await table.delete();
                });

                it("divide", async function() {
                    const table = await perspective.table(common.all_types_arrow.slice());
                    const expressions = generate_binary_operations("/");

                    const view = await table.view({
                        expressions
                    });

                    const col_names = await view.column_paths();

                    for (const expr of expressions) {
                        expect(col_names.includes(expr)).toBe(true);
                    }

                    const result = await view.to_columns();
                    validate_binary_operations(result, expressions, "/");
                    await view.delete();
                    await table.delete();
                });

                it("modulus", async function() {
                    const table = await perspective.table(common.all_types_arrow.slice());
                    const expressions = generate_binary_operations("%");

                    const view = await table.view({
                        expressions
                    });

                    const col_names = await view.column_paths();

                    for (const expr of expressions) {
                        expect(col_names.includes(expr)).toBe(true);
                    }

                    const result = await view.to_columns();
                    console.log(result);
                    validate_binary_operations(result, expressions, "%");
                    await view.delete();
                    await table.delete();
                });

                it("power", async function() {
                    const table = await perspective.table(common.arrow.slice());
                    const expressions = generate_binary_operations("^");
                    const view = await table.view({
                        expressions
                    });

                    const col_names = await view.column_paths();

                    for (const expr of expressions) {
                        expect(col_names.includes(expr)).toBe(true);
                    }

                    const result = await view.to_columns();
                    console.log(result);
                    validate_binary_operations(result, expressions, "^");
                });
            });
        });

        describe("Operators", function() {});
        describe("Functions", function() {});
        describe("Comparisons", function() {
            it("scalar AND", async function() {});

            it("scalar OR", async function() {});

            it("scalar NAND", async function() {});

            it("scalar NOR", async function() {});

            it("scalar XOR", async function() {});

            it("column AND", async function() {});

            it("column OR", async function() {});

            it("column NAND", async function() {});

            it("column NOR", async function() {});

            it("column XOR", async function() {});
        });
    });

    describe("String operations", function() {
        describe("Functions", function() {});
        describe("Comparisons", function() {});
    });

    describe("Conditionals", function() {
        it("if float == float", async function() {});

        it("if float == int should always be false due to differing types", async function() {});
    });

    describe("Loops", function() {});
};
