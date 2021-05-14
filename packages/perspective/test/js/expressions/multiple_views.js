/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const expressions_common = require("./common.js");

/**
 * Tests the functionality of `View`-based expressions, specifically that
 * existing column/view semantics (pivots, aggregates, columns, sorts, filters)
 * continue to be functional on expressions.
 */
module.exports = perspective => {
    const validate_delta = async (colname, delta, expected) => {
        const t = await perspective.table(delta.slice());
        const v = await t.view();
        const data = await v.to_columns();
        expect(data[colname]).toEqual(expected);
        await v.delete();
        await t.delete();
    };

    describe("Expressions with multiple views", () => {
        it("Multiple views with the same expression alias should not conflict", async () => {
            const now = new Date();
            const bucketed = new Date(now.getUTCFullYear(), 0, 1).getTime();
            const table = await perspective.table({
                x: [1, 2, 3, 4],
                y: ["a", "b", "c", "d"],
                z: [now, now, now, now]
            });

            const v1 = await table.view({
                columns: ["column", "column2"],
                expressions: [`// column \n"x" + 10`, `// column2 \n concat('a', 'b', 'c')`]
            });
            const v2 = await table.view({
                columns: ["column2", "column"],
                expressions: [`// column \n upper("y")`, `// column2 \n bucket("z", 'Y')`]
            });

            expect(await v1.expression_schema()).toEqual({
                column: "float",
                column2: "string"
            });

            expect(await v2.expression_schema()).toEqual({
                column: "string",
                column2: "date"
            });

            const result = await v1.to_columns();
            const result2 = await v2.to_columns();

            expect(result["column"]).toEqual([11, 12, 13, 14]);
            expect(result["column2"]).toEqual(Array(4).fill("abc"));
            expect(result2["column"]).toEqual(["A", "B", "C", "D"]);
            expect(result2["column2"]).toEqual(Array(4).fill(bucketed));

            await v2.delete();
            await v1.delete();
            await table.delete();
        });

        it("Multiple views with the same expression alias should not conflict, to_arrow", async () => {
            const table = await perspective.table(expressions_common.data);

            const v1 = await table.view({
                expressions: [`// column \n"x" + 10`]
            });
            const v2 = await table.view({
                expressions: [`// column \n upper("y")`]
            });

            let result = await v1.to_columns();
            let result2 = await v2.to_columns();

            expect(result["column"]).toEqual([11, 12, 13, 14]);
            expect(result2["column"]).toEqual(["A", "B", "C", "D"]);

            const t1 = await perspective.table(await v1.to_arrow());
            const t2 = await perspective.table(await v2.to_arrow());

            const new_v1 = await t1.view();
            const new_v2 = await t2.view();

            result = await new_v1.to_columns();
            result2 = await new_v2.to_columns();

            expect(result["column"]).toEqual([11, 12, 13, 14]);
            expect(result2["column"]).toEqual(["A", "B", "C", "D"]);

            await new_v2.delete();
            await new_v1.delete();
            await t2.delete();
            await t1.delete();
            await v2.delete();
            await v1.delete();
            await table.delete();
        });

        it("Multiple views with the same expression alias should not conflict, filtered", async () => {
            const table = await perspective.table(expressions_common.data);

            const v1 = await table.view({
                expressions: [`// column \n"x" + 10`],
                filter: [["column", "==", 12]]
            });
            const v2 = await table.view({
                expressions: [`// column \n upper("y")`],
                filter: [["column", "==", "D"]]
            });

            const result = await v1.to_columns();
            const result2 = await v2.to_columns();

            expect(result["column"]).toEqual([12]);
            expect(result2["column"]).toEqual(["D"]);

            await v2.delete();
            await v1.delete();
            await table.delete();
        });

        it("Multiple views with the same expression alias should not conflict, sort", async () => {
            const table = await perspective.table({
                x: [1, 2, 3, 4],
                y: [4, 3, 2, 1]
            });

            const v1 = await table.view({
                expressions: [`// column \n"x" * -10`],
                sort: [["column", "desc"]]
            });
            const v2 = await table.view({
                expressions: [`// column \n "y" * 10`],
                sort: [["column", "asc"]]
            });

            const result = await v1.to_columns();
            const result2 = await v2.to_columns();

            expect(result["column"]).toEqual([-10, -20, -30, -40]);
            expect(result2["column"]).toEqual([10, 20, 30, 40]);

            await v2.delete();
            await v1.delete();
            await table.delete();
        });

        it("Multiple views with the same expression alias should not conflict, hidden sort", async () => {
            const table = await perspective.table({
                x: [1, 2, 3, 4],
                y: [4, 3, 2, 1]
            });

            const v1 = await table.view({
                columns: ["x"],
                expressions: [`// column \n"x" * -10`],
                sort: [["column", "asc"]]
            });
            const v2 = await table.view({
                columns: ["y"],
                expressions: [`// column \n "y" * 10`],
                sort: [["column", "asc"]]
            });

            const result = await v1.to_columns();
            const result2 = await v2.to_columns();

            expect(result["x"]).toEqual([4, 3, 2, 1]);
            expect(result2["y"]).toEqual([1, 2, 3, 4]);

            await v2.delete();
            await v1.delete();
            await table.delete();
        });

        it("Multiple pivoted views with the same expression alias should not conflict", async () => {
            const table = await perspective.table(expressions_common.data);

            const v1 = await table.view({
                row_pivots: ["y"],
                column_pivots: ["x"],
                expressions: [`// column \n"x" + 10`]
            });
            const v2 = await table.view({
                row_pivots: ["x"],
                column_pivots: ["y"],
                expressions: [`// column \n upper("y")`],
                aggregates: {
                    column: "last"
                }
            });

            expect(await v1.column_paths()).toEqual([
                "__ROW_PATH__",
                "1|x",
                "1|y",
                "1|z",
                "1|column",
                "2|x",
                "2|y",
                "2|z",
                "2|column",
                "3|x",
                "3|y",
                "3|z",
                "3|column",
                "4|x",
                "4|y",
                "4|z",
                "4|column"
            ]);
            expect(await v2.column_paths()).toEqual([
                "__ROW_PATH__",
                "a|x",
                "a|y",
                "a|z",
                "a|column",
                "b|x",
                "b|y",
                "b|z",
                "b|column",
                "c|x",
                "c|y",
                "c|z",
                "c|column",
                "d|x",
                "d|y",
                "d|z",
                "d|column"
            ]);

            const result = await v1.to_columns();
            const result2 = await v2.to_columns();

            expect(result["1|column"]).toEqual([11, 11, null, null, null]);
            expect(result["2|column"]).toEqual([12, null, 12, null, null]);
            expect(result["3|column"]).toEqual([13, null, null, 13, null]);
            expect(result["4|column"]).toEqual([14, null, null, null, 14]);

            expect(result2["a|column"]).toEqual(["A", "A", null, null, null]);
            expect(result2["b|column"]).toEqual(["B", null, "B", null, null]);
            expect(result2["c|column"]).toEqual(["C", null, null, "C", null]);
            expect(result2["d|column"]).toEqual(["D", null, null, null, "D"]);

            await v2.delete();
            await v1.delete();
            await table.delete();
        });

        it("Multiple pivoted views with the same expression alias and different aggregates should not conflict", async () => {
            const table = await perspective.table({
                x: [10, 10, 20, 20],
                y: ["A", "B", "C", "D"],
                z: [1.5, 2.5, 3.5, 4.5]
            });

            const v1 = await table.view({
                row_pivots: ["x"],
                expressions: [`// column \n"z" + 10`],
                aggregates: {
                    column: "avg"
                }
            });

            const v2 = await table.view({
                row_pivots: ["x"],
                expressions: [`// column \n upper("y")`],
                aggregates: {
                    column: "last"
                }
            });

            const v3 = await table.view({
                row_pivots: ["x"],
                expressions: [`// column \n 2"z"`],
                aggregates: {
                    column: ["weighted mean", "z"]
                }
            });

            expect(await v1.column_paths()).toEqual(["__ROW_PATH__", "x", "y", "z", "column"]);

            const result = await v1.to_columns();
            const result2 = await v2.to_columns();
            const result3 = await v3.to_columns();

            expect(result["column"]).toEqual([13, 12, 14]);
            expect(result2["column"]).toEqual(["D", "B", "D"]);
            expect(result3["column"]).toEqual([6.833333333333333, 4.25, 8.125]);

            await v3.delete();
            await v2.delete();
            await v1.delete();
            await table.delete();
        });

        describe("Multiple views with updates", () => {
            it("Appends", async () => {
                const table = await perspective.table(expressions_common.data);

                const v1 = await table.view({
                    expressions: [`// column \n"x" + 10`]
                });
                const v2 = await table.view({
                    expressions: [`// column \n upper("y")`]
                });

                let result = await v1.to_columns();
                let result2 = await v2.to_columns();

                expect(result["column"]).toEqual([11, 12, 13, 14]);
                expect(result2["column"]).toEqual(["A", "B", "C", "D"]);

                table.update(expressions_common.data);

                result = await v1.to_columns();
                result2 = await v2.to_columns();

                expect(result["column"]).toEqual([11, 12, 13, 14, 11, 12, 13, 14]);
                expect(result2["column"]).toEqual(["A", "B", "C", "D", "A", "B", "C", "D"]);

                await v2.delete();
                await v1.delete();
                await table.delete();
            });

            it("Partial update", async () => {
                const table = await perspective.table(expressions_common.data, {index: "x"});

                const v1 = await table.view({
                    expressions: [`// column \n"x" * 2`]
                });
                const v2 = await table.view({
                    expressions: [`// column \n upper("y")`]
                });

                let result = await v1.to_columns();
                let result2 = await v2.to_columns();

                expect(result["column"]).toEqual([2, 4, 6, 8]);
                expect(result2["column"]).toEqual(["A", "B", "C", "D"]);

                table.update({
                    x: [2, 4, 3, 10, null],
                    y: ["X", "Y", "Z", "ABC", "DEF"]
                });

                result = await v1.to_columns();
                result2 = await v2.to_columns();

                expect(result["column"]).toEqual([null, 2, 4, 6, 8, 20]);
                expect(result2["column"]).toEqual(["DEF", "A", "X", "Z", "Y", "ABC"]);

                await v2.delete();
                await v1.delete();
                await table.delete();
            });

            it("Partial update, sorted", async () => {
                const table = await perspective.table(expressions_common.data, {index: "x"});

                const v1 = await table.view({
                    expressions: [`// column \n"x" * 2`],
                    sort: [["column", "desc"]]
                });
                const v2 = await table.view({
                    expressions: [`// column \n upper("y")`],
                    sort: [["column", "desc"]]
                });

                let result = await v1.to_columns();
                let result2 = await v2.to_columns();

                expect(result["column"]).toEqual([8, 6, 4, 2]);
                expect(result2["column"]).toEqual(["D", "C", "B", "A"]);

                table.update({
                    x: [2, 4, 3, 10, null],
                    y: ["X", "Y", "Z", "ABC", "DEF"]
                });

                result = await v1.to_columns();
                result2 = await v2.to_columns();

                expect(result["column"]).toEqual([20, 8, 6, 4, 2, null]);
                expect(result2["column"]).toEqual(["Z", "Y", "X", "DEF", "ABC", "A"]);

                await v2.delete();
                await v1.delete();
                await table.delete();
            });

            it("Limit", async () => {
                const table = await perspective.table(expressions_common.data, {limit: 2});

                const v1 = await table.view({
                    expressions: [`// column \n"x" * 2`]
                });
                const v2 = await table.view({
                    expressions: [`// column \n upper("y")`]
                });

                let result = await v1.to_columns();
                let result2 = await v2.to_columns();

                expect(result["column"]).toEqual([6, 8]);
                expect(result2["column"]).toEqual(["C", "D"]);

                table.update({
                    x: [2, 4, 3, 10, null],
                    y: ["X", "Y", "Z", "ABC", "DEF"]
                });

                result = await v1.to_columns();
                result2 = await v2.to_columns();

                expect(result["column"]).toEqual([null, 20]);
                expect(result2["column"]).toEqual(["DEF", "ABC"]);

                await v2.delete();
                await v1.delete();
                await table.delete();
            });

            it("Appends delta", async done => {
                expect.assertions(6);

                const table = await perspective.table(expressions_common.data);

                const v1 = await table.view({
                    expressions: [`// column \n"x" + 10`]
                });

                const v2 = await table.view({
                    expressions: [`// column \n upper("y")`]
                });

                const result = await v1.to_columns();
                const result2 = await v2.to_columns();

                expect(result["column"]).toEqual([11, 12, 13, 14]);
                expect(result2["column"]).toEqual(["A", "B", "C", "D"]);

                v1.on_update(
                    async updated => {
                        await validate_delta("column", updated.delta, [11, 12, 13, 14]);
                        const result = await v1.to_columns();
                        expect(result["column"]).toEqual([11, 12, 13, 14, 11, 12, 13, 14]);
                    },
                    {mode: "row"}
                );

                v2.on_update(
                    async updated => {
                        await validate_delta("column", updated.delta, ["A", "B", "C", "D"]);
                        const result2 = await v2.to_columns();
                        expect(result2["column"]).toEqual(["A", "B", "C", "D", "A", "B", "C", "D"]);
                        await v2.delete();
                        await v1.delete();
                        await table.delete();
                        done();
                    },
                    {mode: "row"}
                );

                table.update(expressions_common.data);
            });

            it("Partial update delta", async done => {
                expect.assertions(6);

                const table = await perspective.table(expressions_common.data, {index: "x"});

                const v1 = await table.view({
                    expressions: [`// column \n"x" * 2`]
                });

                const v2 = await table.view({
                    expressions: [`// column \n upper("y")`]
                });

                const result = await v1.to_columns();
                const result2 = await v2.to_columns();

                expect(result["column"]).toEqual([2, 4, 6, 8]);
                expect(result2["column"]).toEqual(["A", "B", "C", "D"]);

                v1.on_update(
                    async updated => {
                        await validate_delta("column", updated.delta, [null, 4, 6, 8, 20]);
                        const result = await v1.to_columns();
                        expect(result["column"]).toEqual([null, 2, 4, 6, 8, 20]);
                    },
                    {mode: "row"}
                );

                v2.on_update(
                    async updated => {
                        await validate_delta("column", updated.delta, ["DEF", "X", "Z", "Y", "ABC"]);
                        const result = await v2.to_columns();
                        expect(result["column"]).toEqual(["DEF", "A", "X", "Z", "Y", "ABC"]);
                        await v2.delete();
                        await v1.delete();
                        await table.delete();
                        done();
                    },
                    {mode: "row"}
                );

                table.update({
                    x: [2, 4, 3, 10, null],
                    y: ["X", "Y", "Z", "ABC", "DEF"]
                });
            });

            it("Partial update, sorted delta", async done => {
                expect.assertions(6);
                const table = await perspective.table(expressions_common.data, {index: "x"});

                const v1 = await table.view({
                    expressions: [`// column \n"x" * 2`],
                    sort: [["column", "desc"]]
                });
                const v2 = await table.view({
                    expressions: [`// column \n upper("y")`],
                    sort: [["column", "desc"]]
                });

                const result = await v1.to_columns();
                const result2 = await v2.to_columns();

                expect(result["column"]).toEqual([8, 6, 4, 2]);
                expect(result2["column"]).toEqual(["D", "C", "B", "A"]);

                v1.on_update(
                    async updated => {
                        await validate_delta("column", updated.delta, [20, 8, 6, 4, null]);
                        const result = await v1.to_columns();
                        expect(result["column"]).toEqual([20, 8, 6, 4, 2, null]);
                    },
                    {mode: "row"}
                );

                v2.on_update(
                    async updated => {
                        await validate_delta("column", updated.delta, ["Z", "Y", "X", "DEF", "ABC"]);
                        const result2 = await v2.to_columns();
                        expect(result2["column"]).toEqual(["Z", "Y", "X", "DEF", "ABC", "A"]);
                        await v2.delete();
                        await v1.delete();
                        await table.delete();
                        done();
                    },
                    {mode: "row"}
                );

                table.update({
                    x: [2, 4, 3, 10, null],
                    y: ["X", "Y", "Z", "ABC", "DEF"]
                });
            });
        });
    });
};
