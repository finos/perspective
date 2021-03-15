/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const jsc = require("jsverify");

const replicate = (n, g) => jsc.tuple(new Array(n).fill(g));

const array_equals = function(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
};

const generator = function(length = 100, has_zero = true) {
    const min = has_zero ? 0 : 1;
    return jsc.record({
        a: replicate(length, jsc.number(min, 1000000)),
        b: replicate(length, jsc.number(min, 1000000)),
        c: replicate(length, jsc.string),
        d: replicate(length, jsc.datetime),
        e: replicate(length, jsc.bool)
    });
};

/**
 * Uses invariant testing to assert base correctness of computed columns.
 */
module.exports = perspective => {
    describe("Invariant testing", function() {
        describe("Inverse computed column operations should be invariant", function() {
            jsc.property("(x - y) + x == y", generator(), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "computed",
                            computed_function_name: "-",
                            inputs: ["a", "b"]
                        },
                        {
                            column: "result",
                            computed_function_name: "+",
                            inputs: ["computed", "b"]
                        }
                    ]
                });
                const result = await view.to_columns();
                const expected = array_equals(result["result"], data["a"]);
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("(x + y) - x - y == 0", generator(), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "computed",
                            computed_function_name: "+",
                            inputs: ["a", "b"]
                        },
                        {
                            column: "computed2",
                            computed_function_name: "-",
                            inputs: ["computed", "a"]
                        },
                        {
                            column: "result",
                            computed_function_name: "-",
                            inputs: ["computed2", "b"]
                        }
                    ]
                });
                const result = await view.to_columns();
                const expected = array_equals(result["result"], Array(data["a"].length).fill(0));
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("(x + y) - (x + y) == 0", generator(), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "computed",
                            computed_function_name: "+",
                            inputs: ["a", "b"]
                        },
                        {
                            column: "result",
                            computed_function_name: "-",
                            inputs: ["computed", "computed"]
                        }
                    ]
                });
                const result = await view.to_columns();
                const expected = array_equals(result["result"], Array(data["a"].length).fill(0));
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("(x - x) == 0", generator(), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "-",
                            inputs: ["a", "a"]
                        }
                    ]
                });
                const result = await view.to_columns();
                const expected = array_equals(result["result"], Array(data["a"].length).fill(0));
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("(x / x) == 1", generator(), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "/",
                            inputs: ["a", "a"]
                        }
                    ]
                });
                const result = await view.to_columns();
                const expected = array_equals(result["result"], Array(data["a"].length).fill(1));
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("(x + x) - x - x == 0", generator(), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "computed",
                            computed_function_name: "+",
                            inputs: ["a", "a"]
                        },
                        {
                            column: "computed2",
                            computed_function_name: "-",
                            inputs: ["computed", "a"]
                        },
                        {
                            column: "result",
                            computed_function_name: "-",
                            inputs: ["computed2", "a"]
                        }
                    ]
                });
                const result = await view.to_columns();
                const expected = array_equals(result["result"], Array(data["a"].length).fill(0));
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("sqrt(x ^ 2) == x", generator(100, false), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "computed",
                            computed_function_name: "x^2",
                            inputs: ["a"]
                        },
                        {
                            column: "result",
                            computed_function_name: "sqrt",
                            inputs: ["computed"]
                        }
                    ]
                });
                const result = await view.to_columns();
                const expected = array_equals(result["result"], data["a"]);
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("x ^ 2 == (x * x)", generator(100, false), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "computed",
                            computed_function_name: "x^2",
                            inputs: ["a"]
                        },
                        {
                            column: "result",
                            computed_function_name: "*",
                            inputs: ["a", "a"]
                        }
                    ]
                });
                const result = await view.to_columns();
                const expected = array_equals(
                    result["result"],
                    data["a"].map(x => x * x)
                );
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("x % x == 100", generator(100, false), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "percent_of",
                            inputs: ["a", "a"]
                        }
                    ]
                });
                const result = await view.to_columns();
                const expected = array_equals(result["result"], Array(data["a"].length).fill(100));
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("abs(x) ? x > 0 == x", generator(100, false), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "abs",
                            inputs: ["a"]
                        }
                    ]
                });
                const result = await view.to_columns();
                const expected = array_equals(result["result"], data["a"]);
                view.delete();
                table.delete();
                return expected;
            });
        });

        describe("Comparison operations should be pure with the same inputs.", function() {
            jsc.property("== should always be true with the same input column", generator(), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "==",
                            inputs: ["a", "a"]
                        }
                    ]
                });

                const result = await view.to_columns();
                const expected = array_equals(result["result"], Array(data["a"].length).fill(true));
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("> should always be false with the same input column", generator(), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: ">",
                            inputs: ["a", "a"]
                        }
                    ]
                });

                const result = await view.to_columns();
                const expected = array_equals(result["result"], Array(data["a"].length).fill(false));
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("< should always be false with the same input column", generator(), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "<",
                            inputs: ["a", "a"]
                        }
                    ]
                });

                const result = await view.to_columns();
                const expected = array_equals(result["result"], Array(data["a"].length).fill(false));
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("is should always be true with the same input column", generator(), async data => {
                const table = await perspective.table({
                    a: "float",
                    b: "float",
                    c: "string",
                    d: "datetime",
                    e: "boolean"
                });

                table.update(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "result",
                            computed_function_name: "is",
                            inputs: ["c", "c"]
                        }
                    ]
                });

                const result = await view.to_columns();
                const expected = array_equals(result["result"], Array(data["a"].length).fill(true));
                view.delete();
                table.delete();
                return expected;
            });
        });

        describe("Inverse operations on multiple views inheriting computed columns should be idempotent.", function() {
            jsc.property("(x + y) - x - y == 0", generator(), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "computed",
                            computed_function_name: "+",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const view2 = await table.view({
                    computed_columns: [
                        {
                            column: "computed",
                            computed_function_name: "+",
                            inputs: ["a", "b"]
                        },
                        {
                            column: "computed2",
                            computed_function_name: "-",
                            inputs: ["computed", "a"]
                        }
                    ]
                });

                const view3 = await table.view({
                    computed_columns: [
                        {
                            column: "computed",
                            computed_function_name: "+",
                            inputs: ["a", "b"]
                        },
                        {
                            column: "computed2",
                            computed_function_name: "-",
                            inputs: ["computed", "a"]
                        },
                        {
                            column: "result",
                            computed_function_name: "-",
                            inputs: ["computed2", "b"]
                        }
                    ]
                });
                const result = await view3.to_columns();
                const expected = array_equals(result["result"], Array(data["a"].length).fill(0));
                view3.delete();
                view2.delete();
                view.delete();
                table.delete();
                return expected;
            });

            jsc.property("(x - y) + y == x", generator(), async data => {
                const table = await perspective.table(data);

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "computed",
                            computed_function_name: "-",
                            inputs: ["a", "b"]
                        }
                    ]
                });

                const view2 = await table.view({
                    computed_columns: [
                        {
                            column: "computed",
                            computed_function_name: "-",
                            inputs: ["a", "b"]
                        },
                        {
                            column: "result",
                            computed_function_name: "+",
                            inputs: ["computed", "b"]
                        }
                    ]
                });

                const result = await view2.to_columns();
                const expected = array_equals(result["result"], data["a"]);

                view2.delete();
                view.delete();
                table.delete();
                return expected;
            });
        });
    });

    // describe("", function() {});
    // describe("Equivalent computations on different views are idempotent", function() {
    //     it("", async function() {
    //         perspective;
    //     });
    // });
};
