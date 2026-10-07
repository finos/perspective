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

import { PageView, test, expect } from "../helpers.ts";
import type { Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore-debug.html");

    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

async function sampleTextarea(page: Page, selector: string) {
    await page.evaluate((selector) => {
        const root = document.querySelector("perspective-viewer")!.shadowRoot!;
        const area = root.querySelector(selector) as HTMLTextAreaElement;
        const samples: string[] = [];
        window["__EDITOR_SAMPLES__"] = samples;
        let frames = 0;
        const tick = () => {
            samples.push(area.value);
            if (++frames < 180) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    }, selector);
}

async function readSamples(page: Page): Promise<string[]> {
    return await page.evaluate(() => window["__EDITOR_SAMPLES__"]);
}

test.describe("Editor save does not flash the previous value", () => {
    test("expression editor holds the saved text across the commit", async ({
        page,
    }) => {
        const view = new PageView(page);
        await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            await elem.restore({ settings: true, expressions: { abc: "'a'" } });
        });

        const column =
            await view.settingsPanel.inactiveColumns.getColumnByName("abc");

        await column.editBtn.click();
        const sidebar = view.columnSettingsSidebar;
        await sidebar.container.waitFor({ state: "visible" });
        const textarea = sidebar.attributesTab.expressionEditor.textarea;
        await textarea.fill("'b'");
        await expect(textarea).toHaveValue("'b'");
        await sampleTextarea(page, "#column_settings_sidebar textarea");
        await sidebar.attributesTab.saveBtn.click();
        await page.waitForTimeout(2000);

        const samples = await readSamples(page);
        expect(samples.length).toBeGreaterThan(20);
        expect(samples.at(-1)).toBe("'b'");
        expect([...new Set(samples)]).toEqual(["'b'"]);
    });

    test("debug panel holds the applied text across the commit", async ({
        page,
    }) => {
        const view = new PageView(page);
        await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            await elem.restore({ settings: true, title: "before" });
        });

        await view.settingsPanel.container.locator("#debug_tabbar_tab").click();

        const textarea = view.container.locator("#debug-panel-editor textarea");
        await expect(textarea).not.toHaveValue("");
        const before = await textarea.inputValue();
        const next = before.replace('"before"', '"after"');
        expect(next).not.toBe(before);
        await textarea.fill(next);
        await sampleTextarea(page, "#debug-panel-editor textarea");
        await view.container.locator("#debug-panel-apply").click();
        await page.waitForTimeout(2000);

        const samples = await readSamples(page);
        expect(samples.length).toBeGreaterThan(20);
        expect(samples.at(-1)).toBe(next);
        expect(samples.filter((x) => x === before)).toEqual([]);
    });
});
