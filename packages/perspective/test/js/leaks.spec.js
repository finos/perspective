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

/**
 * Run a function in a loop, comparing before-and-after wasm heap for leaks.
 * Emscripten allocates in pages, and Perspective is hard coded to start at
 * 16777216b, so rather than check `end - start`, we just test that any
 * allocation ever occurs.
 * @param {*} test
 * @param {*} num_iterations
 */
async function leak_test(test, num_iterations = 10000) {
    // warmup
    await test();
    expect((await perspective.memory_usage()).wasmHeap).toEqual(16777216);
    // const start = (await perspective.memory_usage()).wasmHeap;

    for (var i = 0; i < num_iterations; i++) {
        await test();
    }

    // const end = (await perspective.memory_usage()).wasmHeap;
    // expect(end).toEqual(start);
    expect((await perspective.memory_usage()).wasmHeap).toEqual(16777216);
}

describe("leaks", function() {
    describe("view", function() {
        describe("1-sided", function() {
            it("to_json does not leak", async () => {
                const table = await perspective.table(arr.slice());
                const view = await table.view({row_pivots: ["State"]});
                await leak_test(async function() {
                    let json = await view.to_json();
                    expect(json.length).toEqual(50);
                });
                view.delete();
                table.delete();
            });
        });
    });

    describe("table", function() {
        it("update does not leak", async () => {
            const table = await perspective.table({x: "integer", y: "string"}, {index: "x"});
            let count = 0;
            const view = await table.view();
            view.on_update(function() {
                count += 1;
            });

            await leak_test(async function() {
                await table.update([{x: 1, y: "TestTestTest"}]);
                expect(await table.size()).toEqual(1);
            });

            expect(count).toBeGreaterThan(0);
            view.delete();
            table.delete();
        });
    });
});
