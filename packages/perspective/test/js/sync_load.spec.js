/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

describe("perspective.js module", function() {
    it("does not access the WASM module until it is ready", async () => {
        const tbl = require("../../dist/cjs/perspective.node.js").table([{x: 1}]);
        tbl.then(async table => {
            const size = await table.size();
            expect(size).toEqual(1);
        });
    });
});
