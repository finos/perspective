/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@finos/perspective-test");
const path = require("path");
const arrows = require("./test_arrows.js");

const arraybuffer_to_string = function(buf) {
    return String.fromCharCode(...new Uint8Array(buf));
};

utils.with_server({}, () => {
    describe.page(
        "blank.html",
        () => {
            test.capture(
                "Handles reloading with a schema.",
                async page => {
                    var schema = {_pkey: "string", a: "string"};
                    var data = {a: "a"};

                    function getData(ver, count) {
                        var rows = [];
                        for (var index = 0; index < count; index++) {
                            var row = Object.assign({}, data);
                            row._pkey = String(ver) + "_" + index;
                            rows.push(row);
                        }
                        return rows;
                    }

                    const viewer = await page.$("perspective-viewer");
                    await page.evaluate(
                        async (viewer, data, schema) => {
                            const table = await window.WORKER.table(schema);
                            viewer.load(table);
                            table.update(data);
                        },
                        viewer,
                        getData(2, 1),
                        schema
                    );
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());

                    await page.evaluate(
                        async (viewer, data, schema) => {
                            const table = await window.WORKER.table(schema);
                            viewer.load(table);
                            table.update(data);
                        },
                        viewer,
                        getData(3, 2),
                        schema
                    );
                    await page.waitForSelector("perspective-viewer:not([updating])");
                },
                {wait_for_update: false}
            );

            test.capture(
                "When transferables are enabled, transfers an arrow in load.",
                async page => {
                    const viewer = await page.$("perspective-viewer");
                    const arrow = arrows.int_float_str_arrow.slice();
                    const byte_length = await page.evaluate(
                        async (viewer, data) => {
                            const arrow = Uint8Array.from([...data].map(ch => ch.charCodeAt())).buffer;
                            const table = await window.WORKER.table(arrow);
                            viewer.load(table);
                            // force _process to run - otherwise reading
                            // bytelength will return the un-transfered arrow.
                            await viewer.table.size();
                            return arrow.byteLength;
                        },
                        viewer,
                        arraybuffer_to_string(arrow)
                    );
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    expect(byte_length).toBe(0);
                },
                {wait_for_update: false}
            );

            test.capture(
                "When transferables are enabled, transfers an arrow in update.",
                async page => {
                    const viewer = await page.$("perspective-viewer");
                    const schema = {
                        a: "integer",
                        b: "float",
                        c: "string"
                    };
                    const arrow = arrows.int_float_str_arrow.slice();
                    const byte_length = await page.evaluate(
                        async (viewer, data, schema) => {
                            const table = await window.WORKER.table(schema);
                            viewer.load(table);
                            const arrow = Uint8Array.from([...data].map(ch => ch.charCodeAt())).buffer;
                            table.update(arrow);
                            // force _process to run - otherwise reading
                            // bytelength will return the un-transfered arrow.
                            await viewer.table.size();
                            return arrow.byteLength;
                        },
                        viewer,
                        arraybuffer_to_string(arrow),
                        schema
                    );
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    expect(byte_length).toBe(0);
                },
                {wait_for_update: false}
            );

            test.capture(
                "Should load a promise to a table.",
                async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.evaluate(async viewer => {
                        await viewer.load(
                            window.WORKER.table({
                                a: [1, 2, 3, 4]
                            })
                        );
                    }, viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                },
                {wait_for_update: false}
            );
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
