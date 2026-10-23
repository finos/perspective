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

import { expect, test } from "@perspective-dev/test";
import { gotoBasic } from "./helpers";

const TABLE = "load-viewer-csv";

const VERTICAL_ROOT = {
    layout: {
        type: "split-layout",
        orientation: "vertical",
        sizes: [0.55, 0.45],
        children: [
            {
                type: "split-layout",
                orientation: "horizontal",
                sizes: [0.6, 0.4],
                children: [
                    { type: "tab-layout", tabs: ["one"], selected: 0 },
                    { type: "tab-layout", tabs: ["two"], selected: 0 },
                ],
            },
            { type: "tab-layout", tabs: ["three"], selected: 0 },
        ],
    },
    panels: {
        one: {
            table: TABLE,
            title: "One",
            plugin: "Y Line",
            group_by: ["State"],
            columns: ["Sales"],
        },
        two: {
            table: TABLE,
            title: "Two",
            plugin: "X Bar",
            group_by: ["State"],
            columns: ["Profit"],
        },
        three: {
            table: TABLE,
            title: "Three",
            plugin: "Datagrid",
            columns: ["Sales", "Profit"],
        },
    },
};

type Frame = {
    buffer_w: number;
    buffer_h: number;
    css_w: number;
    css_h: number;
};

test.beforeEach(async ({ page }) => {
    await gotoBasic(page);
});

async function setup(page, config): Promise<void> {
    await page.evaluate(async (config) => {
        const viewer = document.querySelector("perspective-viewer")! as any;
        await viewer.restoreWorkspace(config);
    }, config);
    await page.waitForTimeout(1500);
}

async function armTrace(page): Promise<void> {
    await page.evaluate(() => {
        const viewer = document.querySelector("perspective-viewer")! as any;
        const original = new Set<string>(viewer.getPanelNames());
        const frames: Frame[] = [];
        const sample = () => {
            for (const plugin of Array.from(
                viewer.querySelectorAll("[slot]"),
            ) as HTMLElement[]) {
                const slot = plugin.getAttribute("slot")!;
                const canvas = plugin.shadowRoot?.querySelector(
                    ".webgl-canvas",
                ) as HTMLCanvasElement | null;
                if (original.has(slot) || !canvas) {
                    continue;
                }

                const rect = canvas.getBoundingClientRect();
                if (
                    canvas.getClientRects().length === 0 ||
                    getComputedStyle(plugin).visibility !== "visible" ||
                    rect.width === 0
                ) {
                    continue;
                }

                frames.push({
                    buffer_w: canvas.width,
                    buffer_h: canvas.height,
                    css_w: rect.width * window.devicePixelRatio,
                    css_h: rect.height * window.devicePixelRatio,
                });
            }
        };

        (window as any).__dup_frames = frames;
        (window as any).__dup_sampling = new Promise<void>((resolve) => {
            let n = 0;
            const tick = () => {
                sample();
                n += 1;
                if (n < 120) {
                    requestAnimationFrame(tick);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(tick);
        });
    });
}

async function collectTrace(page): Promise<Frame[]> {
    return await page.evaluate(async () => {
        await (window as any).__dup_sampling;
        return (window as any).__dup_frames;
    });
}

async function duplicate(page, source: string, expected: number) {
    await armTrace(page);
    await page
        .locator("perspective-viewer")
        .locator(`[slot="${source}"]`)
        .click({ button: "right" });

    const menu = page.locator("perspective-context-menu");
    await menu.waitFor();
    await menu.locator(".context-menu-item", { hasText: "Duplicate" }).click();
    await page.waitForFunction(
        (expected) =>
            // @ts-ignore
            document.querySelector("perspective-viewer")!.getPanelNames()
                .length === expected,
        expected,
    );

    return await collectTrace(page);
}

function drawn(frames: Frame[]): Frame[] {
    return frames.filter((f) => f.buffer_w !== 300 || f.buffer_h !== 150);
}

function stretched(frames: Frame[]): Frame[] {
    return drawn(frames).filter(
        (f) =>
            Math.abs(f.buffer_w - f.css_w) > 2 ||
            Math.abs(f.buffer_h - f.css_h) > 2,
    );
}

test.describe("Duplicate staged presize", () => {
    test("a chart duplicate under a vertical root never paints a stretched frame", async ({
        page,
    }) => {
        await setup(page, VERTICAL_ROOT);
        const frames = await duplicate(page, "two", 4);
        expect(drawn(frames).length).toBeGreaterThan(0);
        expect(stretched(frames)).toEqual([]);
    });
});
