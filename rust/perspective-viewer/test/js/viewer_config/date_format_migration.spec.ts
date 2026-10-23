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

import { test, expect, PageView, API_VERSION } from "../helpers.ts";

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore-debug.html");
    await page.evaluate(async () => {
        while (!(window as any)["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

async function restoredDateFormat(
    view: PageView,
    plugin: string,
    date_format: Record<string, unknown>,
    version?: string,
) {
    await view.restore({
        plugin,
        columns: ["Order Date"],
        columns_config: { "Order Date": { date_format } },
        ...(version ? { version } : {}),
    } as any);

    const config = (await view.save()) as any;
    return config.columns_config["Order Date"]?.date_format;
}

test.describe("date_format migration", () => {
    test("a per-part value gains its old fallbacks", async ({ page }) => {
        const view = new PageView(page);
        expect(
            await restoredDateFormat(view, "Debug Styled", {
                format: "custom",
                timeZone: "UTC",
                second: "disabled",
                minute: "disabled",
                hour: "disabled",
            }),
        ).toEqual({
            timeZone: "UTC",
            year: "2-digit",
            month: "numeric",
            day: "numeric",
            hour12: true,
        });
    });

    test("a preset with a disabled field keeps its rendering", async ({
        page,
    }) => {
        const view = new PageView(page);
        expect(
            await restoredDateFormat(view, "Debug Format", {
                timeStyle: "disabled",
            }),
        ).toEqual({ dateStyle: "short" });
    });

    test("a preset with both fields disabled renders a numeric date", async ({
        page,
    }) => {
        const view = new PageView(page);
        expect(
            await restoredDateFormat(view, "Debug Styled", {
                dateStyle: "disabled",
                timeStyle: "disabled",
            }),
        ).toEqual({ year: "numeric", month: "numeric", day: "numeric" });
    });

    test("an older versioned preset gains its missing style", async ({
        page,
    }) => {
        const view = new PageView(page);
        expect(
            await restoredDateFormat(
                view,
                "Debug Format",
                { dateStyle: "long" },
                "5.5.0",
            ),
        ).toEqual({ dateStyle: "long", timeStyle: "medium" });
    });

    test("an unversioned preset takes the inheriting meaning", async ({
        page,
    }) => {
        const view = new PageView(page);
        expect(
            await restoredDateFormat(view, "Debug Format", {
                dateStyle: "long",
            }),
        ).toEqual({ dateStyle: "long" });
    });

    test("a preset saved by this build is not migrated", async ({ page }) => {
        const view = new PageView(page);
        expect(
            await restoredDateFormat(
                view,
                "Debug Format",
                { dateStyle: "long" },
                API_VERSION,
            ),
        ).toEqual({ dateStyle: "long" });
    });
});
