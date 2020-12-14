/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

module.exports = perspective => {
    describe("Pivotting with nulls", function() {
        it("shows one pivot for the nulls on initial load", async function() {
            const dataWithNulls = [
                {name: "Homer", value: 1},
                {name: null, value: 1},
                {name: null, value: 1},
                {name: "Krusty", value: 1}
            ];

            var table = await perspective.table(dataWithNulls);

            var view = await table.view({
                row_pivots: ["name"],
                aggregates: {name: "distinct count"}
            });

            const answer = [
                {__ROW_PATH__: [], name: 3, value: 4},
                {__ROW_PATH__: [null], name: 1, value: 2},
                {__ROW_PATH__: ["Homer"], name: 1, value: 1},
                {__ROW_PATH__: ["Krusty"], name: 1, value: 1}
            ];

            let results = await view.to_json();
            expect(results).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("shows one pivot for the nulls after updating with a null", async function() {
            const dataWithNull1 = [
                {name: "Homer", value: 1},
                {name: null, value: 1}
            ];
            const dataWithNull2 = [
                {name: null, value: 1},
                {name: "Krusty", value: 1}
            ];

            var table = await perspective.table(dataWithNull1);
            table.update(dataWithNull2);

            var view = await table.view({
                row_pivots: ["name"],
                aggregates: {name: "distinct count"}
            });

            const answer = [
                {__ROW_PATH__: [], name: 3, value: 4},
                {__ROW_PATH__: [null], name: 1, value: 2},
                {__ROW_PATH__: ["Homer"], name: 1, value: 1},
                {__ROW_PATH__: ["Krusty"], name: 1, value: 1}
            ];

            let results = await view.to_json();
            expect(results).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("aggregates that return NaN render correctly", async function() {
            const dataWithNull1 = [
                {name: "Homer", value: 3},
                {name: "Homer", value: 1},
                {name: "Marge", value: null},
                {name: "Marge", value: null}
            ];

            var table = await perspective.table(dataWithNull1);

            var view = await table.view({
                row_pivots: ["name"],
                aggregates: {value: "avg"}
            });

            const answer = [
                {__ROW_PATH__: [], name: 4, value: 2},
                {__ROW_PATH__: ["Homer"], name: 2, value: 2},
                {__ROW_PATH__: ["Marge"], name: 2, value: null}
            ];

            let results = await view.to_json();
            expect(results).toEqual(answer);
            view.delete();
            table.delete();
        });

        it("aggregates nulls correctly", async function() {
            const data = [{x: "AAAAAAAAAAAAAA"}, {x: "AAAAAAAAAAAAAA"}, {x: "AAAAAAAAAAAAAA"}, {x: null}, {x: null}, {x: "BBBBBBBBBBBBBB"}, {x: "BBBBBBBBBBBBBB"}, {x: "BBBBBBBBBBBBBB"}];
            const tbl = await perspective.table(data);
            const view = await tbl.view({row_pivots: ["x"]});

            const result = await view.to_json();
            expect(result).toEqual([
                {
                    __ROW_PATH__: [],
                    x: 8
                },
                {
                    __ROW_PATH__: [null],
                    x: 2
                },
                {
                    __ROW_PATH__: ["AAAAAAAAAAAAAA"],
                    x: 3
                },
                {
                    __ROW_PATH__: ["BBBBBBBBBBBBBB"],
                    x: 3
                }
            ]);
        });
    });
};
