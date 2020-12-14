/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const perspective = require("../../dist/cjs/perspective.node.js");
const fs = require("fs");
const path = require("path");

const arr = fs.readFileSync(path.join(__dirname, "../../../../node_modules/superstore-arrow/superstore.arrow")).buffer;

describe("await perspective.table", function() {
    it("does not leak memory after delete() is called on a table", async () => {
        for (var i = 0; i < 500; i++) {
            const table = await perspective.table(arr.slice());
            expect(await table.size()).toEqual(9994);
            table.delete();
        }
    });

    it("does not leak memory after delete() is called on a view", async () => {
        const table = await perspective.table(arr.slice());
        for (var i = 0; i < 500; i++) {
            const view = await table.view();
            expect(await view.num_rows()).toEqual(9994);
            view.delete();
        }
        table.delete();
    });
});
