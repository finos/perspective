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

import { test, expect } from "@playwright/experimental-ct-react";

import { App } from "./basic.story";
import { WorkspaceApp } from "./workspace.story";
import { HTMLPerspectiveWorkspaceElement } from "@finos/perspective-workspace";
import { HTMLPerspectiveViewerElement } from "@finos/perspective-viewer";

test.describe("Perspective React", () => {
    test("The viewer loads with data in it", async ({ page, mount }) => {
        const comp = await mount(<App></App>);
        const viewers = comp.locator("perspective-viewer");
        await viewers.waitFor();
        expect(await viewers.all()).toHaveLength(2);
    });

    test("React workspace functionality", async ({ page, mount }) => {
        const comp = await mount(<WorkspaceApp />);
        const toggleMount = comp.locator("button.toggle-mount");
        const addViewer = comp.locator("button.add-viewer");
        const workspace = comp.locator("perspective-workspace");
        const viewer = comp.locator("perspective-viewer");

        await toggleMount.waitFor();
        await addViewer.click();
        await addViewer.click();
        await addViewer.click();
        await expect(viewer).toHaveCount(3);
        await toggleMount.click();
        await workspace.waitFor({ state: "detached" });
        await toggleMount.click();
        await workspace.waitFor();
        await expect(viewer).toHaveCount(3);
    });

    test("Adding a viewer in single-document mode leaves SDM", async ({
        mount,
    }) => {
        const comp = await mount(<WorkspaceApp />);
        const addViewer = comp.locator("button.add-viewer");
        const viewer = comp.locator("perspective-viewer");
        const settingsBtn = comp.locator(`perspective-workspace span#label`);
        const settingsPanel = viewer.locator("#settings_panel");
        await settingsBtn.waitFor();
        await addViewer.waitFor();
        await addViewer.click();
        expect(await viewer.count()).toBe(2);
        await settingsBtn.first().click();
        await settingsPanel.waitFor();
        await addViewer.click();
        expect(await viewer.count()).toBe(3);
        await settingsPanel.waitFor({ state: "detached" });
    });

    test.only("Swapping tables properly loads the new tables and ejects the viewers of removed tables", async ({
        mount,
        page,
    }) => {
        const comp = await mount(<WorkspaceApp />);
        const addViewer = comp.locator("button.add-viewer");
        const viewer = comp.locator("perspective-viewer");
        await page.pause();
        const swapBtn = comp.locator("button.swap");
        await swapBtn.waitFor();
        await addViewer.click();
        await viewer.waitFor();

        let rows = await page.evaluate(async () => {
            const workspace = document.querySelector(
                "perspective-workspace"
            ) as HTMLPerspectiveWorkspaceElement;
            const viewer = document.querySelector(
                "perspective-viewer"
            ) as HTMLPerspectiveViewerElement;
            await workspace.flush();
            return await (await viewer.getView()).num_rows();
        });
        expect(rows).toBe(1);

        await swapBtn.click();
        rows = await page.evaluate(async () => {
            const workspace = document.querySelector(
                "perspective-workspace"
            ) as HTMLPerspectiveWorkspaceElement;
            const viewer = document.querySelector(
                "perspective-viewer"
            ) as HTMLPerspectiveViewerElement;
            await workspace.flush();
            return await (await viewer.getView()).num_rows();
        });
        expect(rows).toBe(2);

        await swapBtn.click();
        rows = await page.evaluate(async () => {
            const workspace = document.querySelector(
                "perspective-workspace"
            ) as HTMLPerspectiveWorkspaceElement;
            const viewer = document.querySelector(
                "perspective-viewer"
            ) as HTMLPerspectiveViewerElement;
            await workspace.flush();
            return await (await viewer.getView()).num_rows();
        });
        expect(rows).toBe(1);
    });
});
