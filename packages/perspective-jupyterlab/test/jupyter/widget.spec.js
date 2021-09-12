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
const {execute_all_cells} = require("./utils");

const default_body = async (page) => {
    await execute_all_cells(page);
    const viewer = await page.waitForSelector(
        ".jp-OutputArea-output perspective-viewer",
        {visible: true}
    );
    await viewer.evaluate(async (viewer) => await viewer.flush());
    return viewer;
};

utils.with_jupyterlab(process.env.__JUPYTERLAB_PORT__, () => {
    describe.jupyter(
        () => {
            test.jupyterlab(
                "Loads a table",
                [
                    [
                        "table = perspective.Table(arrow_data)",
                        "w = perspective.PerspectiveWidget(table, columns=['f64', 'str', 'datetime'])",
                    ].join("\n"),
                    "w",
                ],
                async (page) => {
                    const viewer = await default_body(page);
                    const num_columns = await viewer.evaluate(
                        async (viewer) => {
                            const tbl = viewer.querySelector("regular-table");
                            return tbl.querySelector("thead tr")
                                .childElementCount;
                        }
                    );

                    expect(num_columns).toEqual(3);

                    const num_rows = await viewer.evaluate(async (viewer) => {
                        const tbl = viewer.querySelector("regular-table");
                        return tbl.querySelectorAll("tbody tr").length;
                    });

                    expect(num_rows).toEqual(5);
                }
            );
        },
        {name: "Simple", root: path.join(__dirname, "..", "..")}
    );
});
