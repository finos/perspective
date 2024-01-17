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
    expect,
    compareContentsToSnapshot,
} from "@finos/perspective-test";
import EXAMPLES from "../../src/components/ExampleGallery/features";
const { convert } = require("@finos/perspective-viewer/dist/cjs/migrate.js");

test.describe.configure({ mode: "parallel" });

test.describe("Examples", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("docs/template.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });
    });

    for (const idx in EXAMPLES.default) {
        const example = EXAMPLES.default[idx];
        test(`${idx} - ${example.name}`, async ({ page }) => {
            const { config } = example;
            const new_config = await convert(
                Object.assign(
                    {
                        plugin: "Datagrid",
                        group_by: [],
                        expressions: {},
                        split_by: [],
                        sort: [],
                        aggregates: {},
                    },
                    config
                )
            );
            await page.evaluate(async (config) => {
                const viewer = document.querySelector("perspective-viewer");
                viewer?.addEventListener("perspective-config-update", (e) => {
                    window.__CONFIG_UPDATED__ = true;
                    console.log(e);
                });
                await viewer.reset();
                await viewer.restore(config);
            }, new_config);

            page.evaluate((config) => {
                console.log(config);
            }, config);
            if (Object.keys(config).length !== 0) {
                await page.evaluate(async () => {
                    while (!window["__CONFIG_UPDATED__"]) {
                        await new Promise((x) => setTimeout(x, 10));
                    }
                });
            }

            const [shadowContents, contents] = await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                return [
                    viewer?.firstElementChild?.shadowRoot?.innerHTML ||
                        "MISSING",
                    viewer?.firstElementChild?.innerHTML || "MISSING",
                ];
            });

            expect([shadowContents, contents]).not.toBe(["MISSING", "MISSING"]);
            await compareContentsToSnapshot(shadowContents, [
                `${example.name.replace("/", "-")}_shadow.txt`,
            ]);
            await compareContentsToSnapshot(contents, [
                `${example.name.replace("/", "-")}.txt`,
            ]);
        });
    }
});
