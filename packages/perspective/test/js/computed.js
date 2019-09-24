/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

module.exports = perspective => {
    describe("computed columns", function() {
        describe("row pivots", function() {
            it("should update", async function() {
                const table = perspective
                    .table([
                        {int: 1, float: 2.25, string: "a", datetime: new Date()},
                        {int: 2, float: 3.5, string: "b", datetime: new Date()},
                        {int: 3, float: 4.75, string: "c", datetime: new Date()},
                        {int: 4, float: 5.25, string: "d", datetime: new Date()}
                    ])
                    .add_computed([
                        {
                            column: "int+float",
                            type: "float",
                            func: (w, x) => w + x,
                            inputs: ["int", "float"]
                        }
                    ]);

                let view = table.view({
                    row_pivots: ["int+float"]
                });

                table.update([{int: 4, __INDEX__: 0}]);

                let json = await view.to_json({
                    index: true
                });

                expect(json).toEqual([
                    {__ROW_PATH__: [], int: 13, "int+float": 28.75, float: 15.75, string: 4, datetime: 4, __INDEX__: [0, 3, 2, 1]},
                    {__ROW_PATH__: [5.5], int: 2, "int+float": 5.5, float: 3.5, string: 1, datetime: 1, __INDEX__: [1]},
                    {__ROW_PATH__: [6.25], int: 4, "int+float": 6.25, float: 2.25, string: 1, datetime: 1, __INDEX__: [0]},
                    {__ROW_PATH__: [7.75], int: 3, "int+float": 7.75, float: 4.75, string: 1, datetime: 1, __INDEX__: [2]},
                    {__ROW_PATH__: [9.25], int: 4, "int+float": 9.25, float: 5.25, string: 1, datetime: 1, __INDEX__: [3]}
                ]);
            });
        });
    });
};
