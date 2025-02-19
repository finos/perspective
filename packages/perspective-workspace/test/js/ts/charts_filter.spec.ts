// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import {
    test,
    getSvgContentString,
    compareContentsToSnapshot,
} from "@finos/perspective-test";
import * as psp from "@finos/perspective-workspace";

const allSelectors = {
    treemap: "perspective-viewer perspective-viewer-d3fc-treemap",
    ybar: "perspective-viewer perspective-viewer-d3fc-ybar",
    xbar: "perspective-viewer perspective-viewer-d3fc-xbar",
    datagrid:
        "perspective-viewer perspective-viewer-datagrid.edit-mode-allowed",
};

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/src/html/workspace-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

test.describe("Applying Global Filter on a Series of Layered Charts", () => {
    test("2 Layered Charts (Datagrid & D3FC). Datagrid Is Active View", async ({
        page,
    }) => {
        const config = buildConfig(["Treemap"], true, true);

        await page.evaluate(async (config) => {
            const workspace = document.getElementById(
                "workspace"
            ) as psp.HTMLPerspectiveWorkspaceElement;
            await workspace.restore(config);
            await workspace.flush();

            await workspace.save();
        }, config);

        await clickFilter(page);
        await page.waitForSelector("regular-table");

        const selectors = ["datagrid", "treemap"];

        await compareToSnapshots(page, selectors);
    });

    test("2 Layered Charts (Both D3FC)", async ({ page }) => {
        const config = buildConfig(["Treemap", "X Bar"]);

        await page.evaluate(async (config) => {
            const workspace = document.getElementById(
                "workspace"
            ) as psp.HTMLPerspectiveWorkspaceElement;
            await workspace.restore(config);
            await workspace.flush();

            await workspace.save();
        }, config);

        await clickFilter(page);
        await page.waitForSelector("perspective-viewer-d3fc-treemap div");

        const selectors = ["treemap", "xbar"];

        await compareToSnapshots(page, selectors);
    });

    test("3 Layered Charts (2 D3FC Charts and a Datagrid). D3FC is Active View", async ({
        page,
    }) => {
        const config = buildConfig(["Treemap", "Y Bar"], true);

        await page.evaluate(async (config) => {
            const workspace = document.getElementById(
                "workspace"
            ) as psp.HTMLPerspectiveWorkspaceElement;
            await workspace.restore(config);
            await workspace.flush();

            await workspace.save();
        }, config);

        await clickFilter(page);
        sleep(100);
        await page.waitForSelector("perspective-viewer-d3fc-treemap div");

        const selectors = ["treemap", "ybar", "datagrid"];

        await compareToSnapshots(page, selectors);
    });

    test("3 Layered Charts (All D3FC) with X-Bar Active View", async ({
        page,
    }) => {
        const config = buildConfig(["X Bar", "Y Bar", "Treemap"]);

        await page.evaluate(async (config) => {
            const workspace = document.getElementById(
                "workspace"
            ) as psp.HTMLPerspectiveWorkspaceElement;
            await workspace.restore(config);
            await workspace.flush();

            await workspace.save();
        }, config);

        await clickFilter(page);
        sleep(100);
        await page.waitForSelector("perspective-viewer-d3fc-xbar div");

        const selectors = ["xbar", "ybar", "treemap"];

        await compareToSnapshots(page, selectors);
    });

    test("4 Layered Charts with Datagrid Active View", async ({ page }) => {
        const config = buildConfig(["Treemap", "X Bar", "Y Bar"], true, true);

        await page.evaluate(async (config) => {
            const workspace = document.getElementById(
                "workspace"
            ) as psp.HTMLPerspectiveWorkspaceElement;
            await workspace.restore(config);
            await workspace.flush();

            await workspace.save();
        }, config);

        await clickFilter(page);
        sleep(200);
        await page.waitForSelector("regular-table");

        const selectors = ["datagrid", "treemap", "xbar", "ybar"];

        await compareToSnapshots(page, selectors);
    });
});

async function clickFilter(page) {
    await page.click(
        "perspective-viewer.workspace-master-widget perspective-viewer-datagrid tr:nth-child(2) td"
    );
}

function buildConfig(
    plugins: string[],
    hasDatagrid: boolean = false,
    datagridIsMain: boolean = false
) {
    const widgets: string[] = [];

    const plugin_names = {
        Treemap: "treemap",
        "X Bar": "xbar",
        "Y Bar": "ybar",
    };

    let viewers = {
        master: {
            table: "superstore",
            name: "Master",
            group_by: ["Region", "State"],
            split_by: ["Category", "Sub-Category"],
        },
    };

    if (hasDatagrid) {
        const grid = {
            datagrid: {
                table: "superstore",
                name: "datagrid",
                title: "datagrid",
                columns: [
                    "State",
                    "Region",
                    "City",
                    "Country",
                    "Customer Name",
                    "Category",
                ],
            },
        };

        viewers = { ...viewers, ...grid };

        if (datagridIsMain) widgets.push("datagrid");
    }

    plugins.forEach((plugin) => {
        const name = plugin_names[plugin];

        const d3fc = {
            [name]: {
                table: "superstore",
                name: `${name}`,
                group_by: ["State"],
                columns: ["Sales"],
                plugin,
                title: `${name}`,
                sort: [["Profit", "asc"]],
            },
        };

        viewers = { ...viewers, ...d3fc };

        widgets.push(name);
    });

    if (!datagridIsMain && hasDatagrid) widgets.push("datagrid");

    return {
        viewers,
        master: {
            widgets: ["master"],
        },
        detail: {
            main: {
                currentIndex: 0,
                type: "tab-area",
                widgets,
            },
        },
    };
}

async function compareToSnapshots(page, selectors: string[]) {
    for (let i = 0; i < selectors.length; i++) {
        const name = selectors[i];
        const selector = allSelectors[name];

        if (i > 0) {
            await page.click("div.bookmarks");
            await page.click(
                `perspective-workspace-menu div ul li:nth-child(${i})`
            );
        }

        const svg = await getSvgContentString(selector)(page);

        // sometimes, a part of the chart is selected causing tooltip values to show
        // this makes sure that we ignore the tooltip value that is added to the html
        const content =
            name === "datagrid"
                ? svg
                : svg.replace(
                      /<ul id="tooltip-values">.*?<\/ul>/s,
                      '<ul id="tooltip-values"></ul>'
                  );

        await compareContentsToSnapshot(content, [`${name}.txt`]);
    }
}

// given the functionality that runs when the filter is clicked,
// I have added a delay for when there are 3 or more charts to make sure
// that all charts will be rendered before the comparisons are made.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
