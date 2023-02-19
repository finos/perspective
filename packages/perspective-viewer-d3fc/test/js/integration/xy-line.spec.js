/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");

const utils = require("@finos/perspective-test");
const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");

const { withTemplate } = require("./simple-template");
withTemplate("xyline", "X/Y Line", { columns: ["Sales", "Quantity"] });

utils.with_server({}, () => {
    describe.page(
        "xyline.html",
        () => {
            simple_tests.default(
                utils.get_contents.bind(
                    null,
                    "perspective-viewer perspective-viewer-d3fc-xyline"
                )
            );

            test.capture(
                "correctly render when a bar chart has non equidistant times on a datetime axis",
                async (page) => {
                    const config = await page.evaluate(async () => {
                        const viewer =
                            document.querySelector("perspective-viewer");
                        await viewer.getTable();
                        await viewer.restore({
                            plugin: "X/Y Line",
                            columns: ["Profit"],
                            group_by: ["Order Date"],
                            split_by: ["State"],
                            filter: [["State", "in", ["NY", "CA"]]],
                        });

                        return await viewer.save();
                    });

                    expect(config).toEqual({
                        plugin: "X/Y Line",
                        columns: ["Profit"],
                        group_by: ["Order Date"],
                        split_by: ["State"],
                        filter: [["State", "in", ["NY", "CA"]]],
                        aggregates: {},
                        sort: [],
                        plugin_config: {},
                        settings: false,
                        expressions: [],
                        theme: "Material Light",
                    });

                    return await utils.get_contents.bind(
                        null,
                        "perspective-viewer perspective-viewer-d3fc-xyline"
                    )(page);
                }
            );
        },
        { reload_page: false, root: path.join(__dirname, "..", "..", "..") }
    );
});
