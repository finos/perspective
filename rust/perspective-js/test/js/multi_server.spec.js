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
import perspective from "./perspective_client";

((perspective) => {
    test.describe("Multiple Server instances", function () {
        test("Construct Table from remote View", async function ({ page }) {
            await page.goto("/rust/perspective-js/test/html/test.html");
            const [json0, json1] = await page.evaluate(async () => {
                let perspective = await import(
                    "/node_modules/@finos/perspective/dist/esm/perspective.inline.js"
                );

                const worker0 = await perspective.worker();
                const worker1 = await perspective.worker();
                const table0 = await worker0.table("x,y\n1,2\n3,4");
                const view0 = await table0.view();
                const table1 = await worker1.table(view0);
                const view1 = await table1.view();
                const json0 = await view0.to_json();
                const json1 = await view1.to_json();
                return [json0, json1];
            });

            expect(json0).toEqual(json1);
        });

        test("View on_update transfers to new table", async function ({
            page,
        }) {
            await page.goto("/rust/perspective-js/test/html/test.html");
            const [json0, json1] = await page.evaluate(async () => {
                let perspective = await import(
                    "/node_modules/@finos/perspective/dist/esm/perspective.inline.js"
                );

                const worker0 = await perspective.worker();
                const worker1 = await perspective.worker();
                const table0 = await worker0.table("x,y\n1,2\n3,4");
                const view0 = await table0.view();
                const table1 = await worker1.table(view0);
                const view1 = await table1.view();
                await table0.update([{ x: 6 }]);
                const json0 = await view0.to_json();
                const json1 = await view1.to_json();
                return [json0, json1];
            });

            expect(json0).toEqual(json1);
        });
    });
})(perspective);
