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

import { test, expect } from "@perspective-dev/test";
import type { Page } from "@playwright/test";

async function load_tree(
    page: Page,
    name: string,
    data: Record<string, unknown[]>,
): Promise<void> {
    await page.goto("/tools/test/src/html/basic-test.html");
    await page.evaluate(async () => {
        while (!(window as any)["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });

    await page.evaluate(
        async ({ name, data }) => {
            const worker = (window as any).__TEST_WORKER__;
            await worker.table(data, { name });
            const viewer = document.querySelector("perspective-viewer")! as any;
            await viewer.restore({
                table: name,
                plugin: "Datagrid",
                columns: ["v"],
                group_by: ["g", "h"],
            });

            await viewer.flush();
        },
        { name, data },
    );
}

async function read_tree_labels(page: Page) {
    return await page.evaluate(async () => {
        const viewer = document.querySelector("perspective-viewer")! as any;
        const datagrid = document.querySelector(
            "perspective-viewer-datagrid",
        )! as any;

        const table = datagrid.shadowRoot.querySelector("regular-table");
        const view = await viewer.getView();
        const num_rows = await view.num_rows();
        const rows = Array.from(
            table.querySelectorAll("tbody tr"),
        ) as HTMLElement[];

        const labels = [];
        for (const [i, tr] of rows.entries()) {
            const th = tr.querySelector("th.psp-tree-label") as HTMLElement;
            if (!th) {
                continue;
            }

            const y = table.getMeta(th).y as number;
            const paths = (
                await view.to_columns({ start_row: y, end_row: y + 2 })
            ).__ROW_PATH__ as unknown[][];

            labels.push({
                y,
                text: th.textContent!.trim(),
                is_last_rendered: i === rows.length - 1,
                has_next_row: y + 1 < num_rows,
                expanded: paths.length > 1 && paths[1].length > paths[0].length,
                expand: th.classList.contains("psp-tree-label-expand"),
                collapse: th.classList.contains("psp-tree-label-collapse"),
            });
        }

        return labels;
    });
}

async function redraw(page: Page): Promise<void> {
    await page.evaluate(async () => {
        const datagrid = document.querySelector(
            "perspective-viewer-datagrid",
        )! as any;

        await datagrid.shadowRoot.querySelector("regular-table").draw();
    });
}

function expect_labels_match_view(
    labels: Awaited<ReturnType<typeof read_tree_labels>>,
): void {
    for (const label of labels) {
        expect(label.collapse).toBe(label.expanded);
        expect(label.expand).toBe(!label.expanded);
    }
}

test.describe("Tree expand/collapse state", () => {
    test("last group after re-expanding the total is collapsed and stable across redraws", async ({
        page,
    }) => {
        await load_tree(page, "tree-expand-last", {
            g: ["a", "a", "b", "b"],
            h: ["x", "y", "x", "y"],
            v: [1, 2, 3, 4],
        });

        const total = page.locator(
            "perspective-viewer-datagrid regular-table tbody tr:first-child th.psp-tree-label",
        );

        await total.click({ position: { x: 8, y: 8 } });
        await expect(total).toHaveClass(/psp-tree-label-expand/);
        await total.click({ position: { x: 8, y: 8 } });
        await expect(total).toHaveClass(/psp-tree-label-collapse/);

        const labels = await read_tree_labels(page);
        expect(labels.length).toBe(3);
        expect(labels.slice(1).map((x) => x.text)).toEqual(["a", "b"]);
        const last = labels[2];
        expect(last.is_last_rendered).toBe(true);
        expect(last.has_next_row).toBe(false);
        expect(last.expand).toBe(true);
        expect(last.collapse).toBe(false);

        for (let i = 0; i < 3; i++) {
            await redraw(page);
            expect(await read_tree_labels(page)).toEqual(labels);
        }

        const b = page.locator(
            "perspective-viewer-datagrid regular-table tbody tr:last-child th.psp-tree-label",
        );

        await b.click({ position: { x: 8, y: 8 } });
        await expect(
            page.locator("perspective-viewer-datagrid regular-table tbody tr"),
        ).toHaveCount(5);

        expect_labels_match_view(await read_tree_labels(page));
    });

    test("labels match the view at the bottom edge of a scrolled viewport", async ({
        page,
    }) => {
        const n = 500;
        await load_tree(page, "tree-expand-edge", {
            g: Array.from({ length: n }, (_, i) => `g${i}`),
            h: Array.from({ length: n }, () => "x"),
            v: Array.from({ length: n }, (_, i) => i),
        });

        const before = await read_tree_labels(page);
        expect_labels_match_view(before);

        await page.evaluate(async () => {
            const datagrid = document.querySelector(
                "perspective-viewer-datagrid",
            )! as any;

            const table = datagrid.shadowRoot.querySelector("regular-table");
            const row = table.querySelector("tbody tr") as HTMLElement;
            table.scrollTop += row.offsetHeight;
            await table.draw();
        });

        const after = await read_tree_labels(page);
        expect_labels_match_view(after);
        expect(after[0].y).not.toBe(before[0].y);

        const edge = [...before, ...after].filter(
            (x) => x.is_last_rendered && x.has_next_row,
        );

        expect(edge.length).toBeGreaterThan(0);
        for (const label of edge) {
            expect(label.expanded).toBe(true);
            expect(label.collapse).toBe(true);
        }

        await redraw(page);
        expect(await read_tree_labels(page)).toEqual(after);
    });
});
