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
            expect(json.length).toEqual(1);
            table.clear();
            json = await view.to_json();
            expect(json.length).toEqual(0);
            view.delete();
            table.delete();
        });
    });
};
