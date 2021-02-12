/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const match_delta = async function(perspective, delta, expected) {
    let table = await perspective.table(delta);
    let view = await table.view();
    let json = await view.to_json();
    expect(json).toEqual(expected);
    await view.delete();
    await table.delete();
};

/**
 * Tests the correctness of updates on Tables with computed columns created
 * through `View` and deltas created through `on_update`.
 */
module.exports = perspective => {
    describe("Computed column update deltas", function() {
        describe("0-sided computed column deltas", function() {
            it("Returns appended rows for normal and computed columns", async function(done) {
                const table = await perspective.table({
                    x: [1, 2, 3, 4],
                    y: ["A", "B", "C", "D"]
                });
                const view = await table.view({
                    computed_columns: [
                        {
                            column: "lowercase",
                            computed_function_name: "Lowercase",
                            inputs: ["y"]
                        }
                    ]
                });

                view.on_update(
                    async function(updated) {
                        const expected = [
                            {x: 1, y: "HELLO", lowercase: "hello"},
                            {x: 3, y: "WORLD", lowercase: "world"}
                        ];
                        await match_delta(perspective, updated.delta, expected);
                        await view.delete();
                        await table.delete();
                        done();
                    },
                    {mode: "row"}
                );

                table.update({x: [1, 3], y: ["HELLO", "WORLD"]});
            });

            it("Returns appended rows for normal and computed columns from schema", async function(done) {
                const table = await perspective.table({
                    x: "integer",
                    y: "string"
                });
                const view = await table.view({
                    computed_columns: [
                        {
                            column: "uppercase",
                            computed_function_name: "Uppercase",
                            inputs: ["y"]
                        }
                    ]
                });

                view.on_update(
                    async function(updated) {
                        const expected = [
                            {x: 1, y: "a", uppercase: "A"},
                            {x: 2, y: "b", uppercase: "B"},
                            {x: 3, y: "c", uppercase: "C"},
                            {x: 4, y: "d", uppercase: "D"}
                        ];
                        await match_delta(perspective, updated.delta, expected);
                        await view.delete();
                        await table.delete();
                        done();
                    },
                    {mode: "row"}
                );

                table.update({
                    x: [1, 2, 3, 4],
                    y: ["a", "b", "c", "d"]
                });
            });

            it("Returns partially updated rows for normal and computed columns", async function(done) {
                const table = await perspective.table(
                    {
                        x: [1, 2, 3, 4],
                        y: ["A", "B", "C", "D"]
                    },
                    {index: "x"}
                );
                const view = await table.view({
                    computed_columns: [
                        {
                            column: "lowercase",
                            computed_function_name: "Lowercase",
                            inputs: ["y"]
                        }
                    ]
                });

                view.on_update(
                    async function(updated) {
                        const full = await view.to_columns();
                        const expected = [
                            {x: 1, y: "HELLO", lowercase: "hello"},
                            {x: 3, y: "WORLD", lowercase: "world"}
                        ];
                        expect(full).toEqual({
                            x: [1, 2, 3, 4],
                            y: ["HELLO", "B", "WORLD", "D"],
                            lowercase: ["hello", "b", "world", "d"]
                        });
                        await match_delta(perspective, updated.delta, expected);
                        await view.delete();
                        await table.delete();
                        done();
                    },
                    {mode: "row"}
                );

                table.update({x: [1, 3], y: ["HELLO", "WORLD"]});
            });

            it("Returns appended rows with missing columns for normal and computed columns", async function(done) {
                const self = this;
                const table = await perspective.table({
                    x: [1, 2, 3, 4],
                    y: ["A", "B", "C", "D"]
                });
                self.view = await table.view({
                    computed_columns: [
                        {
                            column: "lowercase",
                            computed_function_name: "Lowercase",
                            inputs: ["y"]
                        }
                    ]
                });

                self.view.on_update(
                    async function(updated) {
                        const full = await self.view.to_columns();
                        const expected = [
                            {x: 1, y: null, lowercase: null},
                            {x: 3, y: null, lowercase: null}
                        ];
                        expect(full).toEqual({
                            x: [1, 2, 3, 4, 1, 3],
                            y: ["A", "B", "C", "D", null, null],
                            lowercase: ["a", "b", "c", "d", null, null]
                        });
                        await match_delta(perspective, updated.delta, expected);
                        await self.view.delete();
                        await table.delete();
                        done();
                    },
                    {mode: "row"}
                );

                table.update({x: [1, 3]});
            });
        });

        describe("1-sided computed column deltas", function() {
            it("Returns appended rows for normal and computed columns, 1-sided", async function(done) {
                const table = await perspective.table({
                    x: [1, 2, 3, 4],
                    y: ["A", "B", "C", "D"]
                });
                const view = await table.view({
                    row_pivots: ["lowercase"],
                    computed_columns: [
                        {
                            column: "lowercase",
                            computed_function_name: "Lowercase",
                            inputs: ["y"]
                        }
                    ]
                });

                view.on_update(
                    async function(updated) {
                        const expected = [
                            {lowercase: 6, x: 14, y: 6},
                            {x: 1, y: 1, lowercase: 1},
                            {x: 3, y: 1, lowercase: 1}
                        ];
                        await match_delta(perspective, updated.delta, expected);
                        await view.delete();
                        await table.delete();
                        done();
                    },
                    {mode: "row"}
                );

                table.update({x: [1, 3], y: ["HELLO", "WORLD"]});
            });
        });

        describe("2-sided computed column deltas", function() {});

        describe("0-sided computed column deltas with multiple views", function() {
            it("`on_update` on a view with computed column should not contain computed delta when only non-source columns were appended", async function(done) {
                const table = await perspective.table({
                    x: [1, 2, 3, 4],
                    y: ["A", "B", "C", "D"]
                });
                const view = await table.view({
                    computed_columns: [
                        {
                            column: "lowercase",
                            computed_function_name: "Lowercase",
                            inputs: ["y"]
                        }
                    ]
                });

                const pre_update = await view.to_columns();
                expect(pre_update).toEqual({
                    x: [1, 2, 3, 4],
                    y: ["A", "B", "C", "D"],
                    lowercase: ["a", "b", "c", "d"]
                });

                view.on_update(
                    async function(updated) {
                        const expected = [
                            {x: 1, y: null, lowercase: null},
                            {x: 3, y: null, lowercase: null}
                        ];
                        const full = await view.to_columns();
                        expect(full).toEqual({
                            x: [1, 2, 3, 4, 1, 3],
                            y: ["A", "B", "C", "D", null, null],
                            lowercase: ["a", "b", "c", "d", null, null]
                        });
                        await match_delta(perspective, updated.delta, expected);
                        await view.delete();
                        await table.delete();
                        done();
                    },
                    {mode: "row"}
                );

                table.update({x: [1, 3]});
            });

            it("`on_update` on different views with different computed columns should only be notified of their columns", async function(done) {
                const table = await perspective.table(
                    {
                        x: [1, 2, 3, 4],
                        y: ["A", "B", "C", "D"]
                    },
                    {
                        index: "x"
                    }
                );

                const view = await table.view({
                    computed_columns: [
                        {
                            column: "lowercase",
                            computed_function_name: "Lowercase",
                            inputs: ["y"]
                        }
                    ]
                });

                const view2 = await table.view({
                    computed_columns: [
                        {
                            column: "length",
                            computed_function_name: "length",
                            inputs: ["y"]
                        }
                    ]
                });

                view.on_update(
                    async function(updated) {
                        const expected = [
                            {x: 1, y: "HELLO", lowercase: "hello"},
                            {x: 3, y: "WORLD", lowercase: "world"}
                        ];
                        const full = await view.to_columns();
                        expect(full).toEqual({
                            x: [1, 2, 3, 4],
                            y: ["HELLO", "B", "WORLD", "D"],
                            lowercase: ["hello", "b", "world", "d"]
                        });
                        await match_delta(perspective, updated.delta, expected);
                        await view.delete();
                    },
                    {mode: "row"}
                );

                view2.on_update(
                    async function(updated) {
                        const expected = [
                            {x: 1, y: "HELLO", length: 5},
                            {x: 3, y: "WORLD", length: 5}
                        ];
                        const full = await view2.to_columns();
                        expect(full).toEqual({
                            x: [1, 2, 3, 4],
                            y: ["HELLO", "B", "WORLD", "D"],
                            length: [5, 1, 5, 1]
                        });
                        await match_delta(perspective, updated.delta, expected);
                        await view2.delete();
                        await table.delete();
                        done();
                    },
                    {mode: "row"}
                );

                table.update({x: [1, 3], y: ["HELLO", "WORLD"]});
            });

            it("`on_update` on view without computed column should not be notified of computed column", async function(done) {
                const table = await perspective.table({
                    x: [1, 2, 3, 4],
                    y: ["A", "B", "C", "D"]
                });
                const view = await table.view();

                const view2 = await table.view({
                    computed_columns: [
                        {
                            column: "lowercase",
                            computed_function_name: "Lowercase",
                            inputs: ["y"]
                        }
                    ]
                });

                const computed_result = await view2.to_columns();
                expect(computed_result).toEqual({
                    x: [1, 2, 3, 4],
                    y: ["A", "B", "C", "D"],
                    lowercase: ["a", "b", "c", "d"]
                });

                view.on_update(
                    async function(updated) {
                        const expected = [
                            {x: 1, y: "abc"},
                            {x: 3, y: "def"}
                        ];
                        await match_delta(perspective, updated.delta, expected);
                        await view2.delete();
                        await view.delete();
                        await table.delete();
                        done();
                    },
                    {mode: "row"}
                );

                table.update({x: [1, 3], y: ["abc", "def"]});
            });
        });
    });
};
