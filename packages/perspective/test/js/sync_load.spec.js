/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test, expect } from "@playwright/test";

test.describe("perspective.js module", function () {
    test("does not access the WASM module until it is ready", async () => {
        const tbl = require("@finos/perspective").table([{ x: 1 }]);
        tbl.then(async (table) => {
            const size = await table.size();
            expect(size).toEqual(1);
        });
    });
});
