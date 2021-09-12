/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const convert = (x) =>
    ({
        "X/Y Scatter": "perspective-viewer-d3fc-xyscatter",
        "Y Scatter": "Perspective-viewer-d3fc-yscatter",
        "Y Line": "perspective-viewer-d3fc-yline",
        Heatmap: "perspective-viewer-d3fc-heatmap",
        Treemap: "perspective-viewer-d3fc-treemap",
        "X Bar": "perspective-viewer-d3fc-xbar",
        "Y Bar": "perspective-viewer-d3fc-ybar",
    }[x] || x);

exports.default = function (plugin_name, columns) {
    let view_columns = ["Sales"];

    if (columns) {
        // Handle cases where multiple columns are required for a proper
        // chart render, i.e. in scatter charts where there is an X and Y axis.
        view_columns = columns;
    }

    view_columns = JSON.stringify(view_columns);

    test.capture(
        "warning should be shown when points exceed max_cells and max_columns",
        async (page) => {
            const viewer = await page.$("perspective-viewer");
            await page.evaluate((plugin_name) => {
                const plugin = document.querySelector(plugin_name);
                plugin.max_columns = 1;
                plugin.max_cells = 1;
            }, convert(plugin_name));

            await page.evaluate(
                async () =>
                    await document
                        .querySelector("perspective-viewer")
                        .toggleConfig()
            );
            await page.evaluate(
                (element, view_columns) =>
                    element.setAttribute("columns", view_columns),
                viewer,
                view_columns
            );
            await page.evaluate(
                (element) =>
                    element.setAttribute("column-pivots", '["Profit"]'),
                viewer
            );
            await page.waitForSelector("perspective-viewer:not([updating])");
        }
    );

    test.capture(
        "warning should be shown when points exceed max_cells but not max_columns",
        async (page) => {
            const viewer = await page.$("perspective-viewer");
            await page.evaluate((plugin_name) => {
                const plugin = document.querySelector(plugin_name);
                plugin.max_cells = 1;
            }, convert(plugin_name));

            await page.evaluate(
                async () =>
                    await document
                        .querySelector("perspective-viewer")
                        .toggleConfig()
            );
            await page.evaluate(
                (element, view_columns) =>
                    element.setAttribute("columns", view_columns),
                viewer,
                view_columns
            );
            await page.evaluate(
                (element) =>
                    element.setAttribute("column-pivots", '["Profit"]'),
                viewer
            );
            await page.waitForSelector("perspective-viewer:not([updating])");
        }
    );

    test.capture(
        "warning should be shown when points exceed max_columns but not max_cells",
        async (page) => {
            const viewer = await page.$("perspective-viewer");
            await page.evaluate((plugin_name) => {
                const plugin = document.querySelector(plugin_name);
                plugin.max_columns = 1;
            }, convert(plugin_name));

            await page.evaluate(
                async () =>
                    await document
                        .querySelector("perspective-viewer")
                        .toggleConfig()
            );
            await page.evaluate(
                (element, view_columns) =>
                    element.setAttribute("columns", view_columns),
                viewer,
                view_columns
            );
            await page.evaluate(
                (element) =>
                    element.setAttribute("column-pivots", '["Profit"]'),
                viewer
            );
            await page.waitForSelector("perspective-viewer:not([updating])");
        }
    );

    test.capture(
        "warning should be re-rendered if the config is changed and points exceed max",
        async (page) => {
            const viewer = await page.$("perspective-viewer");
            await page.evaluate((plugin_name) => {
                const plugin = document.querySelector(plugin_name);
                plugin.max_columns = 1;
            }, convert(plugin_name));

            await page.evaluate(
                async () =>
                    await document
                        .querySelector("perspective-viewer")
                        .toggleConfig()
            );
            await page.evaluate(
                (element, view_columns) =>
                    element.setAttribute("columns", view_columns),
                viewer,
                view_columns
            );
            await page.evaluate(
                (element) =>
                    element.setAttribute("column-pivots", '["Row ID"]'),
                viewer
            );
            await page.waitForSelector("perspective-viewer:not([updating])");
            await page.evaluate(
                (element) =>
                    element.setAttribute("column-pivots", '["Profit"]'),
                viewer
            );
            await page.waitForSelector("perspective-viewer:not([updating])");
        }
    );

    test.capture(
        "warning should not be re-rendered if the config is changed and points do not exceed max",
        async (page) => {
            const viewer = await page.$("perspective-viewer");
            await page.evaluate((plugin_name) => {
                const plugin = document.querySelector(plugin_name);
                plugin.max_columns = 5;
            }, convert(plugin_name));

            await page.evaluate(
                async () =>
                    await document
                        .querySelector("perspective-viewer")
                        .toggleConfig()
            );
            await page.evaluate(
                (element, view_columns) =>
                    element.setAttribute("columns", view_columns),
                viewer,
                view_columns
            );
            await page.evaluate(
                (element) =>
                    element.setAttribute("column-pivots", '["Profit"]'),
                viewer
            );
            await page.waitForSelector("perspective-viewer:not([updating])");
            await page.evaluate(
                (element) => element.removeAttribute("column-pivots"),
                viewer
            );
            await page.waitForSelector("perspective-viewer:not([updating])");
        }
    );

    test.capture(
        "warning should not be rendered again after the user clicks render all points",
        async (page) => {
            const viewer = await page.$("perspective-viewer");
            await page.evaluate((plugin_name) => {
                const plugin = document.querySelector(plugin_name);
                plugin.max_columns = 1;
            }, convert(plugin_name));

            await page.evaluate(
                async () =>
                    await document
                        .querySelector("perspective-viewer")
                        .toggleConfig()
            );
            await page.evaluate(
                (element, view_columns) =>
                    element.setAttribute("columns", view_columns),
                viewer,
                view_columns
            );
            await page.evaluate(
                (element) =>
                    element.setAttribute("column-pivots", '["Row ID"]'),
                viewer
            );
            await page.waitForSelector("perspective-viewer:not([updating])");
            await page.waitFor(
                () =>
                    !!document
                        .querySelector("perspective-viewer")
                        .shadowRoot.querySelector("perspective-vieux")
                        .shadowRoot.querySelector(
                            ".plugin_information--warning:not(.hidden)"
                        )
            );
            await page.shadow_click(
                "perspective-viewer",
                "perspective-vieux",
                ".plugin_information__action"
            );
            await page.evaluate(
                (element) =>
                    element.setAttribute("column-pivots", '["Profit"]'),
                viewer
            );
            await page.waitForSelector("perspective-viewer:not([updating])");
        }
    );
};
