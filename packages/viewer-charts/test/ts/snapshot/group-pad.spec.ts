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

import { test } from "@perspective-dev/test";
import { gotoBasic, renderAndCapture } from "../helpers";

test.describe("group_pad", () => {
    test.beforeEach(async ({ page }) => {
        await gotoBasic(page);
    });

    test("X Bar two-level group_by", async ({ page }) => {
        await renderAndCapture(page, {
            plugin: "X Bar",
            columns: ["Sales"],
            group_by: ["Region", "Category"],
            plugin_config: { band_inner_frac: 0.9, group_pad: 0.5 },
        });
    });

    test("Y Bar two-level group_by", async ({ page }) => {
        await renderAndCapture(page, {
            plugin: "Y Bar",
            columns: ["Sales"],
            group_by: ["Region", "Category"],
            plugin_config: { band_inner_frac: 0.9, group_pad: 0.5 },
        });
    });

    test("Y Bar three-level group_by", async ({ page }) => {
        await renderAndCapture(page, {
            plugin: "Y Bar",
            columns: ["Sales"],
            group_by: ["Region", "Segment", "Category"],
            plugin_config: { band_inner_frac: 0.9, group_pad: 0.5 },
        });
    });

    test("Y Bar multiple columns", async ({ page }) => {
        await renderAndCapture(page, {
            plugin: "Y Bar",
            columns: ["Sales", "Profit"],
            group_by: ["Region", "Category"],
            plugin_config: { group_pad: 1 },
        });
    });

    test("Y Line two-level group_by", async ({ page }) => {
        await renderAndCapture(page, {
            plugin: "Y Line",
            columns: ["Sales"],
            group_by: ["Region", "Category"],
            plugin_config: { group_pad: 1 },
        });
    });

    test("Y Area two-level group_by", async ({ page }) => {
        await renderAndCapture(page, {
            plugin: "Y Area",
            columns: ["Sales"],
            group_by: ["Region", "Category"],
            plugin_config: { group_pad: 1 },
        });
    });

    test("Y Scatter two-level group_by", async ({ page }) => {
        await renderAndCapture(page, {
            plugin: "Y Scatter",
            columns: ["Sales"],
            group_by: ["Region", "Category"],
            plugin_config: { group_pad: 1 },
        });
    });

    test("Y Bar single-level group_by is unaffected", async ({ page }) => {
        await renderAndCapture(page, {
            plugin: "Y Bar",
            columns: ["Sales"],
            group_by: ["Category"],
            plugin_config: { group_pad: 1 },
        });
    });
});
