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

import { test, expect } from "@finos/perspective-test";
import {
    compareLightDOMContents,
    compareShadowDOMContents,
} from "@finos/perspective-test";

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/src/html/workspace-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

function tests(context, compare) {
    test("restore workspace with detail only", async ({ page }) => {
        const config = {
            viewers: {
                One: { table: "superstore", name: "One" },
            },
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["One"],
                },
            },
        };

        await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.restore(config);
        }, config);

        await page.evaluate(async () => {
            await workspace.flush();
        });

        return compare(
            page,
            `${context}-restore-workspace-with-detail-only.txt`
        );
    });

    test("restore workspace with master and detail", async ({ page }) => {
        const config = {
            viewers: {
                One: {
                    table: "superstore",
                    name: "Test",
                    group_by: ["State"],
                    columns: ["Sales", "Profit"],
                },
                Two: { table: "superstore", name: "One" },
            },
            master: {
                widgets: ["One"],
            },
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["Two"],
                },
            },
        };

        await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.restore(config);
        }, config);

        await page.evaluate(async () => {
            const workspace = document.getElementById("workspace");
            await workspace.flush();
        });

        return compare(
            page,
            `${context}-restore-workspace-with-master-and-detail.txt`
        );
    });

    test("restore workspace is symmetric with addViewer", async ({ page }) => {
        const initial = await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.addViewer({ table: "superstore" });
            await workspace.flush();
            return await workspace.save();
        });

        const second = await page.evaluate(async (initial) => {
            const workspace = document.getElementById("workspace");
            await workspace.restore(initial);
            await workspace.flush();
            return await workspace.save();
        }, initial);

        expect(initial).toEqual(second);

        return compare(
            page,
            `${context}-restore-workspace-is-symmetric-with-addviewer.txt`
        );
    });

    test.describe("Toggle master/detail", () => {
        test("restore a blank view removes master panel", async ({ page }) => {
            const config = {
                detail: {
                    main: {
                        type: "tab-area",
                        widgets: ["PERSPECTIVE_GENERATED_ID_1"],
                        currentIndex: 0,
                    },
                },
                master: { widgets: ["PERSPECTIVE_GENERATED_ID_0"], sizes: [1] },
                viewers: {
                    PERSPECTIVE_GENERATED_ID_0: {
                        table: "superstore",
                    },
                    PERSPECTIVE_GENERATED_ID_1: {
                        table: "superstore",
                    },
                },
            };

            const empty_config = {
                detail: {},
                viewers: {},
            };

            const x = await page.evaluate(async (config) => {
                const workspace = document.getElementById("workspace");
                await workspace.restore(config);
                await workspace.flush();
                return workspace.outerHTML;
            }, config);

            test.expect(x).toEqual(
                '<perspective-workspace id="workspace"><perspective-viewer slot="PERSPECTIVE_GENERATED_ID_1" table="superstore" theme="Pro Light"><perspective-viewer-datagrid style="position: absolute; inset: 0px; opacity: 1;" class="edit-mode-allowed" data-edit-mode="READ_ONLY"></perspective-viewer-datagrid><perspective-viewer-datagrid-toolbar slot="plugin-settings"></perspective-viewer-datagrid-toolbar></perspective-viewer><perspective-viewer slot="PERSPECTIVE_GENERATED_ID_0" table="superstore" class="workspace-master-widget" selectable="" theme="Pro Light"><perspective-viewer-datagrid style="position: absolute; inset: 0px; opacity: 1;" data-edit-mode="READ_ONLY"></perspective-viewer-datagrid><perspective-viewer-datagrid-toolbar slot="plugin-settings"></perspective-viewer-datagrid-toolbar></perspective-viewer></perspective-workspace>'
            );

            await page.evaluate(async (config) => {
                const workspace = document.getElementById("workspace");
                await workspace.restore(config);
                await workspace.flush();
            }, empty_config);

            return compare(
                page,
                `${context}-restore-a-blank-view-removes-master-panel.txt`
            );
        });

        test("restore a view which reuses a master viewer, removes master panel", async ({
            page,
        }) => {
            const config = {
                detail: {
                    main: {
                        type: "tab-area",
                        widgets: ["PERSPECTIVE_GENERATED_ID_1"],
                        currentIndex: 0,
                    },
                },
                master: { widgets: ["PERSPECTIVE_GENERATED_ID_0"], sizes: [1] },
                viewers: {
                    PERSPECTIVE_GENERATED_ID_0: {
                        table: "superstore",
                        title: "One",
                    },
                    PERSPECTIVE_GENERATED_ID_1: {
                        table: "superstore",
                        title: "Two",
                    },
                },
            };

            const config2 = {
                detail: {
                    main: {
                        type: "split-area",
                        orientation: "horizontal",
                        children: [
                            {
                                type: "tab-area",
                                widgets: ["PERSPECTIVE_GENERATED_ID_0"],
                                currentIndex: 0,
                            },
                            {
                                type: "tab-area",
                                widgets: ["PERSPECTIVE_GENERATED_ID_1"],
                                currentIndex: 0,
                            },
                        ],
                        sizes: [0.5, 0.5],
                    },
                },
                master: { widgets: [], sizes: [] },
                viewers: {
                    PERSPECTIVE_GENERATED_ID_0: {
                        table: "superstore",
                        title: "One",
                    },
                    PERSPECTIVE_GENERATED_ID_1: {
                        table: "superstore",
                        title: "Two",
                    },
                },
            };

            const x = await page.evaluate(async (config) => {
                const workspace = document.getElementById("workspace");
                await workspace.restore(config);
                await workspace.flush();
                return workspace.outerHTML;
            }, config);

            test.expect(x).toEqual(
                '<perspective-workspace id="workspace"><perspective-viewer slot="PERSPECTIVE_GENERATED_ID_1" table="superstore" theme="Pro Light"><perspective-viewer-datagrid style="position: absolute; inset: 0px; opacity: 1;" class="edit-mode-allowed" data-edit-mode="READ_ONLY"></perspective-viewer-datagrid><perspective-viewer-datagrid-toolbar slot="plugin-settings"></perspective-viewer-datagrid-toolbar></perspective-viewer><perspective-viewer slot="PERSPECTIVE_GENERATED_ID_0" table="superstore" class="workspace-master-widget" selectable="" theme="Pro Light"><perspective-viewer-datagrid style="position: absolute; inset: 0px; opacity: 1;" data-edit-mode="READ_ONLY"></perspective-viewer-datagrid><perspective-viewer-datagrid-toolbar slot="plugin-settings"></perspective-viewer-datagrid-toolbar></perspective-viewer></perspective-workspace>'
            );

            await page.evaluate(async (config) => {
                const workspace = document.getElementById("workspace");
                await workspace.restore(config);
                await workspace.flush();
            }, config2);

            return compare(
                page,
                `${context}-restore-which-reseats-master-viewer.txt`
            );
        });
    });
}

test.describe("Workspace restore", () => {
    test.describe("Light DOM", () => {
        tests("light-dom", compareLightDOMContents);
    });

    test.describe("Shadow DOM", () => {
        tests("shadow-dom", compareShadowDOMContents);
    });
});
