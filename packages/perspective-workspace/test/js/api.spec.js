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

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/src/html/workspace-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

test("Workspace addTable", async ({ page }) => {
    await page.evaluate(async () => {
        const workspace /*: Workspace*/ = window.workspace;
        const table = window.worker.table("a,b,c\n1,2,3\n4,5,6\n");
        workspace.addTable("test", table);
        await workspace.addViewer({ table: "test", title: "testing" });
    });
    await page.waitForSelector("perspective-viewer-datagrid");
});

test("Workspace addViewer", async ({ page }) => {
    let layout = await page.evaluate(async () => {
        debugger;
        const workspace /*: Workspace*/ = window.workspace;
        const id1 = await workspace.addViewer({
            table: "superstore",
            title: "view1",
        });
        const id2 = await workspace.addViewer(
            { table: "superstore", title: "view2" },
            {
                mode: "split-left",
                ref: id1,
            }
        );
        await workspace.addViewer(
            { table: "superstore", title: "view3" },
            {
                mode: "tab-after",
                ref: id2,
            }
        );
        console.log("LAYOUT: ", await workspace.save());
        return await workspace.save();
    });
    expect(layout.detail.main.children[0].widgets).toStrictEqual([
        "viewer_1",
        "viewer_2",
    ]);
    // note that the first constructed viewer is in slot [1].
    // this is because of the 'split-left' mode.
    expect(layout.detail.main.children[1].widgets).toStrictEqual(["viewer_0"]);
});

test("Workspace duplicateViewer", async ({ page }) => {
    let layout = await page.evaluate(async () => {
        const workspace /*: Workspace*/ = window.workspace;
        const id1 = await workspace.addViewer({
            table: "superstore",
            title: "view1",
        });
        await workspace.duplicateViewer(id1, {
            ref: id1,
            mode: "split-right",
        });
        return await workspace.save();
    });
    expect(layout.detail.main.children[0].widgets).toStrictEqual(["viewer_0"]);
    expect(layout.detail.main.children[1].widgets).toStrictEqual(["viewer_1"]);
    debugger;
});

test("Workspace getViewer", async ({ page }) => {
    let viewer = await page.evaluate(async () => {
        const workspace /*: Workspace*/ = window.workspace;
        const id1 = await workspace.addViewer({
            table: "superstore",
            title: "view1",
        });
        return await workspace.getViewer(id1).save();
    });
    expect(viewer.title).toBe("view1");
});

test("Workspace closeViewer", async ({ page }) => {
    debugger;
    const [id1, id2] = await page.evaluate(async () => {
        const workspace /*: Workspace*/ = window.workspace;
        const id1 = await workspace.addViewer({
            table: "superstore",
            title: "view1",
        });
        const id2 = await workspace.addViewer({
            table: "superstore",
            title: "view2",
        });
        console.log("[id1, id2]", [id1, id2]);
        return [id1, id2];
    });

    const layout1 = await page.evaluate(async () => {
        const workspace /*: Workspace*/ = window.workspace;
        return await workspace.save();
    });

    const layout2 = await page.evaluate(
        async ([id1, id2]) => {
            const workspace /*: Workspace*/ = window.workspace;
            debugger;
            await workspace.closeViewer(id1);
            await workspace.closeViewer(id2);
            return await workspace.save();
        },
        [id1, id2]
    );
    expect(layout1.detail.main.widgets).toStrictEqual(["viewer_0", "viewer_1"]);
    expect(layout2).toStrictEqual({ detail: null, viewers: {} });
});

test("Workspace save", async ({ page }) => {});

test("Workspace restore", async ({ page }) => {});

// TODO:
// test that closing a viewer via the close button in the UI changes the
// `viewers` field in the workspace to have not that viewer!!
