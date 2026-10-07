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

import type { Page } from "@playwright/test";

export const TABLE = "load-viewer-csv";

export async function ready({ page }: { page: Page }) {
    await page.goto("/rust/perspective-viewer/test/html/superstore.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
}

export async function restoreWorkspace(
    page: Page,
    config: Record<string, unknown>,
) {
    await page.evaluate(async (config) => {
        const viewer = document.querySelector("perspective-viewer")!;
        // @ts-ignore
        await viewer.restoreWorkspace(config);
        // @ts-ignore
        await viewer.flush();
    }, config);
}

export async function restoreWorkspaceError(
    page: Page,
    config: Record<string, unknown>,
): Promise<string> {
    return await page.evaluate(async (config) => {
        const viewer = document.querySelector("perspective-viewer")!;
        try {
            // @ts-ignore
            await viewer.restoreWorkspace(config);
            return "";
        } catch (err) {
            return `${(err as Error).message ?? err}`;
        }
    }, config);
}

export async function saveWorkspace(page: Page): Promise<any> {
    return await page.evaluate(async () => {
        const viewer = document.querySelector("perspective-viewer")!;
        // @ts-ignore
        return await viewer.saveWorkspace();
    });
}

export async function hostedTables(page: Page): Promise<string[]> {
    return await page.evaluate(async () => {
        return await window["__TEST_WORKER__"].get_hosted_table_names();
    });
}

export async function addTable(page: Page, name: string) {
    await page.evaluate(async (name) => {
        const worker = window["__TEST_WORKER__"];
        await worker.table(
            [
                { Region: "East", Sales: 100 },
                { Region: "West", Sales: 200 },
            ],
            { name },
        );
    }, name);
}
