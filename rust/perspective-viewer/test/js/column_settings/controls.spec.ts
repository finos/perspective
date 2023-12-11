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

import { test, expect, PageView } from "@finos/perspective-test";
import { PrecisionControl } from "@finos/perspective-test/src/js/models/style_controls";

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });

    await page.evaluate(async () => {
        await document.querySelector("perspective-viewer")!.restore({
            plugin: "Debug",
        });
    });
});

test.describe("Style Controls", () => {
    test.describe("Precision", () => {
        test("Manual edit", async ({ page }) => {
            let view = new PageView(page);
            await view.restore({ columns: ["Row ID"] });
            let settingsPanel = await view.openSettingsPanel();
            let col = settingsPanel.activeColumns.getColumnByName("Row ID");
            await col.editBtn.click();

            let control = new PrecisionControl(page);

            await control.input.fill("3");
            expect(await control.label.innerText()).toBe("Precision: 0.001");

            let config = await view.save();
            expect(config.column_config).toStrictEqual({
                "Row ID": {
                    precision: 3,
                },
            });
        });
        test("Restore", async ({ page }) => {
            let view = new PageView(page);
            await view.restore({
                columns: ["Row ID"],
                column_config: { "Row ID": { precision: 3 } },
            });

            let settingsPanel = await view.openSettingsPanel();
            let col = settingsPanel.activeColumns.getColumnByName("Row ID");
            await col.editBtn.click();

            let control = new PrecisionControl(page);
            expect(await control.label.innerText()).toBe("Precision: 0.001");
            expect(await control.input.inputValue()).toBe("3");
        });
    });
});
