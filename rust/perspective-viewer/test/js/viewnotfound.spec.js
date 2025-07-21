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

test("View conflation is silenced", async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });

    let vnf = false;
    page.on("console", (msg) => {
        if (msg.type() === "error") {
            if (msg.text().includes("View not found")) {
                vnf = true;
            }
        }
    });

    await page.evaluate(async () => {
        const worker = window.__TEST_WORKER__;
        let resolve;
        let is_paused = false;
        const BasePlugin = customElements.get("perspective-viewer-plugin");
        class PausePlugin extends BasePlugin {
            get name() {
                return "pause-plugin";
            }

            async draw(view) {
                if (is_paused) {
                    await new Promise((x) => {
                        resolve = x;
                    });
                }

                const size = await view.num_rows();
                this.textContent = `Rows: ${size}`;
            }
        }

        customElements.define("pause-plugin", PausePlugin);
        const Viewer = customElements.get("perspective-viewer");
        await Viewer.registerPlugin("pause-plugin");

        // use a new viewer because only new viewers get loaded with the registered plugin
        const viewer = document.createElement("perspective-viewer");
        document.body.append(viewer);
        const table = worker.table("a,b,c\n1,2,3", { name: "A" });

        await viewer.load(table);
        await viewer.restore({ plugin: "pause-plugin" });
        is_paused = true;
        viewer.restore({});
        while (!resolve) {
            await new Promise((x) => setTimeout(x, 0));
        }
        viewer.load(table);
        // this time must be at least as long as it takes for the load to finish
        await new Promise((x) => setTimeout(x, 500));
        resolve();
    });
    // give the console time to receive the error
    await new Promise((x) => setTimeout(x, 10000));
    expect(vnf).toBeFalsy();
});
