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

/**
 * Regression: single-sign numeric color domains rendered with the FULL
 * diverging gradient in the GL glyph shaders (plain linear
 * normalization) while the gradient legend — and every other CPU
 * consumer of `colorValueToT` — halved the gradient at the sign pivot,
 * so an all-positive color column plotted brown/orange "negative"
 * colors its legend never showed. Fixed by shipping the sign-pivot
 * `u_color_range` (`colorRangePivot`) for numeric columns, making the
 * shaders' linear branch reproduce `colorValueToT` exactly.
 */

import { test } from "@perspective-dev/test";
import {
    expectViewerScreenshot,
    gotoBasic,
    restoreChart,
    waitOneFrame,
} from "./helpers";

/** Columns are `[X Axis, Y Axis, Color]` for the X/Y families. */
const ALL_POSITIVE_COLOR = ["Sales", "Profit", "Quantity"];
const CROSSING_COLOR = ["Sales", "Quantity", "Profit"];

test.describe("gradient color mapping (regression)", () => {
    test.beforeEach(async ({ page }) => {
        await gotoBasic(page);
    });

    for (const plugin of ["X/Y Scatter", "X/Y Line"] as const) {
        test(`${plugin} keeps an all-positive color column on the positive gradient half`, async ({
            page,
        }) => {
            await restoreChart(page, {
                plugin,
                columns: ALL_POSITIVE_COLOR,
            });
            await waitOneFrame(page);
            await waitOneFrame(page);
            await expectViewerScreenshot(page);
        });

        test(`${plugin} zero-crossing color column spans both halves (probe control)`, async ({
            page,
        }) => {
            await restoreChart(page, {
                plugin,
                columns: CROSSING_COLOR,
            });
            await waitOneFrame(page);
            await waitOneFrame(page);
            await expectViewerScreenshot(page);
        });
    }
});
