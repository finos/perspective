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

import { test, expect } from "../helpers.ts";

test.describe("Effective aggregates", () => {
    test.beforeEach(async function init({ page }) {
        await page.goto("/rust/perspective-viewer/test/html/superstore.html");

        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });
    });

    test("restoring expression pivots emits no aggregate warning", async ({
        page,
    }) => {
        const warnings: string[] = [];
        page.on("console", (msg) => {
            if (
                msg.type() === "warning" &&
                /No (default )?aggregate/.test(msg.text())
            ) {
                warnings.push(msg.text());
            }
        });

        const saved = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.restore({
                plugin: "Debug",
                settings: true,
                group_by: [`bucket("Order Date", 'M')`],
                split_by: [`bucket("Sales", 100)`],
                columns: ["v"],
                expressions: {
                    [`bucket("Order Date", 'M')`]: `bucket("Order Date", 'M')`,
                    [`bucket("Sales", 100)`]: `bucket("Sales", 100)`,
                    v: `if("Region"=='West'){-1}else{1}`,
                },
            });

            return await viewer.save();
        });

        expect(warnings).toEqual([]);
        expect(saved.aggregates).toEqual({});
        await expect(
            page
                .locator(
                    ".column-selector-column .aggregate-selector-wrapper select",
                )
                .first(),
        ).toHaveValue("sum");
    });
});
