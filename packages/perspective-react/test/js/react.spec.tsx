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
import { EmptyWorkspace, SingleView, SwapTables } from "./workspace.story";

async function retryUntilSuccess(
    fn: () => Promise<boolean>,
    { maxAttempts = 5, delay = 1000 } = {}
): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const r = await fn();
            if (r) {
                return true;
            }
        } catch {}
        await new Promise((r) => setTimeout(r, delay));
    }
    return false;
}

test.describe("Perspective React", () => {
    test("The viewer loads with data in it", async ({ page, mount }) => {
        const comp = await mount(<App></App>);
        const count = await page.evaluate(async () => {
            await new Promise((x) => setTimeout(x, 1000));
            return document.querySelectorAll("perspective-viewer").length;
        });

        expect(count).toBe(2);
    });

    test("React workspace functionality", async ({ page, mount }) => {
        const comp = await mount(<EmptyWorkspace />);
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
        const name = "abcdef";
        const comp = await mount(<SingleView name={name} />);
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

    test("Swapping tables properly loads the new tables and ejects the viewers of removed tables", async ({
        mount,
        page,
    }) => {
        const comp = await mount(<SwapTables />);
        const swapBtn = comp.locator("button.special");
        await swapBtn.waitFor();

        await retryUntilSuccess(async () => {
            const b = await page.waitForFunction(async () => {
                return (
                    (await (
                        await document
                            .querySelector("perspective-viewer")!
                            .getView()
                    ).num_rows()) === 1
                );
            });
            return await b.jsonValue();
        });

        await swapBtn.click();
        await retryUntilSuccess(async () => {
            const b = await page.waitForFunction(async () => {
                return (
                    (await (
                        await document
                            .querySelector("perspective-viewer")!
                            .getView()
                    ).num_rows()) === 2
                );
            });
            return await b.jsonValue();
        });

        await swapBtn.click();
        await retryUntilSuccess(async () => {
            const b = await page.waitForFunction(async () => {
                return (
                    (await (
                        await document
                            .querySelector("perspective-viewer")!
                            .getView()
                    ).num_rows()) === 1
                );
            });
            return await b.jsonValue();
        });
    });
});
