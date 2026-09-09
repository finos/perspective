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
import { armInvariants, assertCoherent } from "./harness.ts";

const TABLE = "load-viewer-csv";

function splitConfig(plugin: string) {
    return {
        layout: {
            type: "split-layout",
            orientation: "horizontal",
            sizes: [0.5, 0.5],
            children: [
                { type: "tab-layout", tabs: ["one"], selected: 0 },
                { type: "tab-layout", tabs: ["two"], selected: 0 },
            ],
        },
        panels: {
            one: {
                table: TABLE,
                title: "One",
                plugin,
                group_by: ["State"],
                columns: ["Sales"],
            },
            two: {
                table: TABLE,
                title: "Two",
                plugin,
                group_by: ["State"],
                columns: ["Profit"],
            },
        },
    };
}

type Frame = {
    closed_frame: boolean;
    closed_tab: boolean;
    tracks: number;
    survivor_w: number;
};

type Trace = { frames: Frame[]; survivor_resizes: number };

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore-all.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

armInvariants(test);

async function setup(page, plugin: string): Promise<void> {
    await page.evaluate(async (config) => {
        const viewer = document.querySelector("perspective-viewer")! as any;
        await viewer.restoreWorkspace(config);
    }, splitConfig(plugin));
    await page.waitForTimeout(1500);
}

async function armTrace(page): Promise<void> {
    await page.evaluate(() => {
        const viewer = document.querySelector("perspective-viewer")! as any;
        const layout = viewer.shadowRoot.querySelector("regular-layout");
        const [closed, survivor] = viewer.getPanelNames();
        const plugin = viewer.querySelector(`[slot="${survivor}"]`);
        const state = { frames: [] as any[], survivor_resizes: 0, closed };
        const resize = plugin.resize.bind(plugin);
        plugin.resize = async (...args: any[]) => {
            state.survivor_resizes += 1;
            return await resize(...args);
        };

        const sample = () =>
            state.frames.push({
                closed_frame: !!layout.querySelector(
                    `regular-layout-frame[name="${closed}"]`,
                ),
                closed_tab: !!viewer.querySelector(
                    `perspective-viewer-tab[slot="tab-${closed}"]`,
                ),
                tracks: getComputedStyle(layout).gridTemplateColumns.split(" ")
                    .length,
                survivor_w: Math.round(plugin.getBoundingClientRect().width),
            });

        (window as any).__close_trace = state;
        (window as any).__close_sampling = new Promise<void>((resolve) => {
            let n = 0;
            const tick = () => {
                sample();
                n += 1;
                if (n < 90) {
                    requestAnimationFrame(tick);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(tick);
        });
    });
}

async function collectTrace(page): Promise<Trace> {
    return await page.evaluate(async () => {
        await (window as any).__close_sampling;
        const state = (window as any).__close_trace;
        return {
            frames: state.frames,
            survivor_resizes: state.survivor_resizes,
        };
    });
}

async function traceClose(page, close: "api" | "tab"): Promise<Trace> {
    await armTrace(page);
    if (close === "api") {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")! as any;
            await viewer.removePanel((window as any).__close_trace.closed);
        });
    } else {
        const closed = await page.evaluate(
            () => (window as any).__close_trace.closed,
        );
        await page
            .locator(
                `perspective-viewer-tab[slot="tab-${closed}"] .psp-tab-close`,
            )
            .click();
        await page.waitForFunction(
            () =>
                // @ts-ignore
                document.querySelector("perspective-viewer")!.getPanelNames()
                    .length === 1,
        );
    }

    return await collectTrace(page);
}

function assertNoHole(trace: Trace) {
    const hole = trace.frames.find((f) => !f.closed_frame && f.tracks > 1);
    expect(hole).toBeUndefined();
    const vanished = trace.frames.findIndex((f) => !f.closed_frame);
    const grown = trace.frames.findIndex((f) => f.tracks === 1);
    expect(vanished).toBeGreaterThan(-1);
    expect(vanished).toEqual(grown);
    const tab_vanished = trace.frames.findIndex((f) => !f.closed_tab);
    expect(tab_vanished).toEqual(grown);
}

test.describe("Close presize", () => {
    test("a chart close removes the panel in the commit's paint, never before", async ({
        page,
    }) => {
        await setup(page, "Y Line");
        const trace = await traceClose(page, "api");
        assertNoHole(trace);
        await assertCoherent(page);
    });

    test("a chart survivor is not re-rendered after an exact presize", async ({
        page,
    }) => {
        await setup(page, "Y Line");
        const trace = await traceClose(page, "api");
        expect(trace.survivor_resizes).toEqual(0);
        await assertCoherent(page);
    });

    test("the tab × path matches the API path", async ({ page }) => {
        await setup(page, "Y Line");
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")! as any;
            await viewer.restore({ settings: true });
        });
        await page.waitForTimeout(1000);
        const trace = await traceClose(page, "tab");
        assertNoHole(trace);
        await assertCoherent(page);
    });

    test("a datagrid close stays hole-free", async ({ page }) => {
        await setup(page, "Datagrid");
        const trace = await traceClose(page, "api");
        assertNoHole(trace);
        await assertCoherent(page);
    });

    test("removePanel resolves only after the panel is gone", async ({
        page,
    }) => {
        await setup(page, "Y Line");
        const names = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")! as any;
            const [closed] = viewer.getPanelNames();
            await viewer.removePanel(closed);
            return {
                after: viewer.getPanelNames(),
                closed,
                plugin_gone: !viewer.querySelector(`[slot="${closed}"]`),
            };
        });

        expect(names.after).not.toContain(names.closed);
        expect(names.after.length).toEqual(1);
        expect(names.plugin_gone).toBe(true);
        await assertCoherent(page);
    });
});
