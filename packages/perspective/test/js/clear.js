/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

module.exports = perspective => {
    describe("Clear", function() {
        it("removes the rows from the table", async function() {
            const table = perspective.table([{x: 1}]);
            const view = table.view();
            let json = await view.to_json();
            expect(json).toHaveLength(1);
            table.clear();
            json = await view.to_json();
            expect(json).toHaveLength(0);
            view.delete();
            table.delete();
        });
    });

    describe("Replace", function() {
        it("replaces the rows in the table with the input data", async function() {
            const table = perspective.table([{x: 1, y: 2}, {x: 3, y: 4}]);
            const view = table.view();
            let json = await view.to_json();
            expect(json).toHaveLength(2);
            expect(json).toEqual([{x: 1, y: 2}, {x: 3, y: 4}]);
            table.replace([{x: 5, y: 6}]);
            json = await view.to_json();
            expect(json).toHaveLength(1);
            expect(json).toEqual([{x: 5, y: 6}]);
            view.delete();
            table.delete();
        });
    });
};
