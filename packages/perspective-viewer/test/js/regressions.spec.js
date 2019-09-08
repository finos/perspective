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
                        (viewer, data, schema) => {
                            viewer.load(schema);
                            viewer.update(data);
                        },
                        viewer,
                        getData(2, 1),
                        schema
                    );
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.shadow_click("perspective-viewer", "#config_button");

                    await page.evaluate(
                        (viewer, data, schema) => {
                            viewer.load(schema);
                            viewer.update(data);
                        },
                        viewer,
                        getData(3, 2),
                        schema
                    );
                    await page.waitForSelector("perspective-viewer:not([updating])");
                },
                {wait_for_update: false}
            );
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
