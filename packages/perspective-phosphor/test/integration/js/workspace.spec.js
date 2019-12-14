/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@finos/perspective-test");
const path = require("path");

const TEST_ROOT = path.join(__dirname, "..", "..", "..");
const PATHS = [
    path.join(TEST_ROOT, "dist", "umd"),
    path.join(TEST_ROOT, "dist", "themes"),
    path.join(TEST_ROOT, "test", "integration", "html"),
    path.join(TEST_ROOT, "test", "integration", "css"),
    path.join(TEST_ROOT, "test", "integration", "csv")
];

utils.with_server({paths: PATHS}, () => {
    describe.page(
        "index.html",
        () => {
            test.capture(
                "simple perspective workspace",
                async page => {
                    const container = await page.$("#container");
                    await page.evaluate(async node => {
                        const workspace = new window.PerspectivePhosphor.PerspectiveWorkspace({node});
                        const widget = new window.PerspectivePhosphor.PerspectiveWidget();
                        widget.viewer.setAttribute("id", "viewer");
                        workspace.addViewer(widget);

                        const response = await fetch("superstore.csv");
                        widget.load(await response.text());
                    }, container);

                    await page.waitFor(() => {
                        const elem = document.getElementById("viewer");
                        return elem.view !== undefined;
                    });
                    await page.waitForSelector("#viewer:not([updating])");
                },
                {wait_for_update: false, timeout: 30000}
            );

            test.capture(
                "perspective workspace and duplicate view",
                async page => {
                    const container = await page.$("#container");
                    await page.evaluate(async node => {
                        const workspace = new window.PerspectivePhosphor.PerspectiveWorkspace({node});
                        const widget = new window.PerspectivePhosphor.PerspectiveWidget();

                        widget.viewer.setAttribute("id", "viewer");

                        workspace.addViewer(widget);
                        const response = await fetch("superstore.csv");
                        const data = await response.text();
                        widget.load(data);

                        workspace.duplicate(widget);
                    }, container);

                    await page.waitFor(() => {
                        const elem = document.getElementById("viewer");
                        return elem.view !== undefined;
                    });

                    await page.waitForSelector("#viewer:not([updating])");
                },
                // fail_on_errors = false because of hypergrid bug that causes errors when multiple grids are rendered
                {wait_for_update: false, timeout: 60000, fail_on_errors: false}
            );

            test.skip(
                "perspective workspace and master view",
                async page => {
                    const container = await page.$("#container");
                    await page.evaluate(async node => {
                        const workspace = new window.PerspectivePhosphor.PerspectiveWorkspace({node});
                        window.workspace = workspace;
                        const widget = new window.PerspectivePhosphor.PerspectiveWidget();

                        widget.viewer.setAttribute("id", "viewer");

                        workspace.addViewer(widget);
                        const response = await fetch("superstore.csv");
                        const data = await response.text();
                        widget.load(data);

                        workspace.duplicate(widget);
                    }, container);

                    await page.waitFor(() => {
                        const elem = document.getElementById("viewer");
                        return elem.view !== undefined;
                    });

                    await page.evaluate(() => {
                        const widget = window.workspace.dockpanel.widgets().next();
                        widget.restore({
                            "row-pivots": ["Segment"],
                            columns: ["Profit"]
                        });
                        window.workspace.makeMaster(widget);
                        window.workspace.setRelativeSizes([1, 2]);
                    });
                    await page.waitForSelector("perspective-viewer:not([updating])");
                },
                {wait_for_update: false, timeout: 60000, fail_on_errors: false}
            );
        },
        {root: TEST_ROOT}
    );
});
