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

const default_body = async page => {
    await execute_all_cells(page);
    await page.waitForTimeout(5000);
    const viewer = await page.waitForSelector(".jp-OutputArea-output perspective-viewer:not([updating])", {visible: true});
    await page.waitForTimeout(2500);
    return viewer;
};

utils.with_jupyterlab(process.env.__JUPYTERLAB_PORT__, () => {
    describe.jupyter(
        () => {
            test.jupyterlab("Loads a table", [["table = perspective.Table(arrow_data)\nw =perspective.PerspectiveWidget(table, columns=['f64', 'str', 'datetime'])"], ["w"]], async page => {
                const viewer = await default_body(page);

                const num_columns = await viewer.evaluate(async viewer => {
                    const tbl = viewer.querySelector("regular-table");
                    return tbl.querySelector("thead tr").childElementCount;
                });

                expect(num_columns).toEqual(3);

                const num_rows = await viewer.evaluate(async viewer => {
                    const tbl = viewer.querySelector("regular-table");
                    return tbl.querySelectorAll("tbody tr").length;
                });

                expect(num_rows).toEqual(5);
            });

            test.jupyterlab("Sets columns", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.columns = ['i8', 'f64']"]], async page => {
                const viewer = await default_body(page);

                const num_columns = await viewer.evaluate(async viewer => {
                    const tbl = viewer.querySelector("regular-table");
                    return tbl.querySelector("thead tr").childElementCount;
                });

                expect(num_columns).toEqual(2);
            });

            test.jupyterlab("Sets row pivots", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.row_pivots = ['datetime', 'str']"]], async page => {
                const viewer = await default_body(page);

                const num_columns = await viewer.evaluate(async viewer => {
                    const tbl = viewer.querySelector("regular-table");
                    return tbl.querySelector("thead tr").childElementCount;
                });

                expect(num_columns).toEqual(14);

                const num_rows = await viewer.evaluate(async viewer => {
                    const tbl = viewer.querySelector("regular-table");
                    return tbl.querySelectorAll("tbody tr").length;
                });

                // 2 levels of pivots, 5 rows each, plus total row
                expect(num_rows).toEqual(11);
            });

            test.jupyterlab("Sets column pivots", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.column_pivots = ['str']"]], async page => {
                const viewer = await default_body(page);
                const num_headers = await viewer.evaluate(async viewer => {
                    const tbl = viewer.querySelector("regular-table");
                    return tbl.querySelector("thead").childElementCount;
                });
                expect(num_headers).toEqual(2);
            });

            test.jupyterlab(
                "Sets row and column pivots",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.row_pivots = ['datetime']"], ["w.column_pivots = ['str']"]],
                async page => {
                    const viewer = await default_body(page);
                    const num_headers = await viewer.evaluate(async viewer => {
                        const tbl = viewer.querySelector("regular-table");
                        return tbl.querySelector("thead").childElementCount;
                    });
                    expect(num_headers).toEqual(2);

                    const num_rows = await viewer.evaluate(async viewer => {
                        const tbl = viewer.querySelector("regular-table");
                        return tbl.querySelectorAll("tbody tr").length;
                    });

                    expect(num_rows).toEqual(6);
                }
            );

            test.jupyterlab("Sets filters", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.filters = [['bool', '==', True]]"]], async page => {
                const viewer = await default_body(page);

                const num_rows = await viewer.evaluate(async viewer => {
                    const tbl = viewer.querySelector("regular-table");
                    return tbl.querySelectorAll("tbody tr").length;
                });

                expect(num_rows).toEqual(3);
            });

            test.jupyterlab("Sets sort", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.sort = [['datetime', 'desc']]"]], async page => {
                const viewer = await default_body(page);
                const config = await viewer.evaluate(viewer => viewer.save());
                expect(config["sort"]).toEqual([["datetime", "desc"]]);
            });

            test.jupyterlab("Resets", [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table, row_pivots=['str'])"], ["w"], ["w.reset()"]], async page => {
                const viewer = await default_body(page);

                const num_columns = await viewer.evaluate(async viewer => {
                    const tbl = viewer.querySelector("regular-table");
                    return tbl.querySelector("thead tr").childElementCount;
                });

                const num_rows = await viewer.evaluate(async viewer => {
                    const tbl = viewer.querySelector("regular-table");
                    return tbl.querySelectorAll("tbody tr").length;
                });

                expect(num_columns).toEqual(13);
                expect(num_rows).toEqual(5);
            });

            test.jupyterlab(
                "Restores",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.restore(columns=['date'], sort=[['i64', 'desc']], row_pivots=['str'])"]],
                async page => {
                    const viewer = await default_body(page);

                    const num_columns = await viewer.evaluate(async viewer => {
                        const tbl = viewer.querySelector("regular-table");
                        return tbl.querySelector("thead").childElementCount;
                    });

                    const num_rows = await viewer.evaluate(async viewer => {
                        const tbl = viewer.querySelector("regular-table");
                        return tbl.querySelectorAll("tbody tr").length;
                    });

                    expect(num_columns).toEqual(1);
                    expect(num_rows).toEqual(6);
                }
            );

            test.jupyterlab(
                "Reads updates",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.row_pivots = ['datetime', 'str']\n", "table.update(arrow_data)"]],
                async page => {
                    const viewer = await default_body(page);
                    const num_rows = await viewer.evaluate(async viewer => {
                        const tbl = viewer.querySelector("regular-table");
                        return tbl.querySelectorAll("tbody tr").length;
                    });
                    expect(num_rows).toEqual(11);
                }
            );

            test.jupyterlab(
                "Sets plugins",
                [["table = perspective.Table(arrow_data)\n", "w = perspective.PerspectiveWidget(table)"], ["w"], ["w.columns = ['f64']\n", "w.plugin = 'Y Line'"]],
                async page => {
                    const viewer = await default_body(page);
                    const plugin = await viewer.evaluate(async viewer => {
                        return viewer.getAttribute("plugin");
                    });
                    expect(plugin).toEqual("Y Line");
                }
            );
        },
        {name: "Simple", root: path.join(__dirname, "..", "..")}
    );
});
