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
import {
    PageView,
    compareContentsToSnapshot,
    shadow_click,
    shadow_type,
} from "@finos/perspective-test";

// NOTE: Change this file to be a .ts file.

async function openSidebarAndScrollToBottom() {
    const elem = document.querySelector("perspective-viewer");
    await elem.getTable();
    await elem.toggleConfig(true);
    elem.shadowRoot.querySelector("#active-columns").scrollTop = 500;
}

async function checkSaveDisabled(page, expr) {
    let view = new PageView(page);
    let settingsPanel = await view.openSettingsPanel();
    await settingsPanel.createNewExpression("", expr, false);
}

test.beforeEach(async ({ page }) => {
    await page.goto("/@finos/perspective-viewer/test/html/superstore.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });

    await page.evaluate(async () => {
        await document.querySelector("perspective-viewer").restore({
            plugin: "Debug",
        });
    });
});

test.describe("Expressions", () => {
    test("Click on add column button opens the expression UI.", async ({
        page,
    }) => {
        await page.evaluate(openSidebarAndScrollToBottom);

        await page.waitForFunction(
            () =>
                !!document
                    .querySelector("perspective-viewer")
                    .shadowRoot.querySelector("#add-expression")
        );

        await shadow_click(page, "perspective-viewer", "#add-expression");

        await page.waitForFunction(() => {
            const root = document
                .querySelector("perspective-viewer")
                .shadowRoot.querySelector("#editor-container");

            return !!root;
        });

        const editor = await page.waitForFunction(async () => {
            const root = document
                .querySelector("perspective-viewer")
                .shadowRoot.querySelector("#editor-container");
            return root.querySelector("#content");
        });

        const contents = await editor.evaluate((x) => x.outerHTML);

        await page.evaluate(() => document.activeElement.blur());

        await compareContentsToSnapshot(contents, [
            "click-on-add-column-button-opens-the-expression-ui.txt",
        ]);
    });

    test("Close expression editor with button", async ({ page }) => {
        await page.evaluate(openSidebarAndScrollToBottom);

        await page.waitForFunction(
            () =>
                !!document
                    .querySelector("perspective-viewer")
                    .shadowRoot.querySelector("#add-expression")
        );

        await shadow_click(page, "perspective-viewer", "#add-expression");

        await page.waitForSelector("#editor-container");
        await page.evaluate(async () => {
            let root = document.querySelector("perspective-viewer").shadowRoot;
            await root.querySelector("#column_settings_close_button").click();
        });

        await page.waitForSelector("#editor-container", {
            state: "hidden",
        });

        const contents = await page.evaluate(async () => {
            let root = document.querySelector("perspective-viewer").shadowRoot;
            return (
                root.querySelector("#editor-container")?.innerHTML || "MISSING"
            );
        });

        await compareContentsToSnapshot(contents, [
            "close-expression-editor-with-button.txt",
        ]);
    });

    test("An expression with unknown symbols should disable the save button", async ({
        page,
    }) => {
        await checkSaveDisabled(page, "abc");
    });

    test("A type-invalid expression should disable the save button", async ({
        page,
    }) => {
        await checkSaveDisabled(page, '"Sales" + "Category";');
    });

    test("An expression with invalid input columns should disable the save button", async ({
        page,
    }) => {
        await checkSaveDisabled(page, '"aaaa" + "Sales";');
    });

    test("Should show both aliased and non-aliased expressions in columns", async ({
        page,
    }) => {
        const contents = await page.evaluate(async () => {
            document.activeElement.blur();
            const elem = document.querySelector("perspective-viewer");
            await elem.toggleConfig(true);
            await elem.restore({
                expressions: { "1 + 2": "1 + 2", abc: "3 + 4" },
            });
            return elem.shadowRoot.querySelector("#sub-columns").innerHTML;
        });

        await compareContentsToSnapshot(contents, [
            "should-show-both-aliased-and-non-aliased-expressions-in-columns.txt",
        ]);
    });

    // No longer relevant as we cannot save a duplicate identifier
    test.skip("Should overwrite a duplicate expression alias", async ({
        page,
    }) => {
        let view = new PageView(page);
        view.restore({ expressions: { "4 + 5": "3 + 4" } });

        await view.settingsPanel.createNewExpression("", "4 + 5", true);

        const contents = await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            return elem.shadowRoot.querySelector("#sub-columns").innerHTML;
        });

        await compareContentsToSnapshot(contents, [
            "should-overwrite-a-duplicate-expression-alias.txt",
        ]);
    });

    // No longer relevant as we cannot save a duplicate identifier
    test.skip("Should overwrite a duplicate expression", async ({ page }) => {
        let view = new PageView(page);
        view.restore({ expressions: { "3 + 4": "3 + 4" } });
        await view.settingsPanel.createNewExpression("", "3 + 4", true);

        const contents = await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            return elem.shadowRoot.querySelector("#sub-columns").innerHTML;
        });

        await compareContentsToSnapshot(contents, [
            "should-overwrite-a-duplicate-expression.txt",
        ]);
    });

    test("Resetting the viewer should delete all expressions", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            await elem.toggleConfig(true);
            await elem.restore({
                expressions: { "3 + 4": "3 + 4", "1 + 2": "1 + 2" },
            });
            await elem.reset(true);
        });

        const contents = await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            return (
                elem.shadowRoot.querySelector("#sub-columns")?.innerHTML ||
                "MISSING"
            );
        });

        await compareContentsToSnapshot(contents, [
            "resetting-the-viewer-should-delete-all-expressions.txt",
        ]);
    });

    test("Resetting the viewer partially should not delete all expressions", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            await elem.toggleConfig(true);
            await elem.restore({
                expressions: { "3 + 4": "3 + 4", "1 + 2": "1 + 2" },
            });
            await elem.reset(false);
        });

        const content = await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            return elem.shadowRoot.querySelector("#sub-columns").innerHTML;
        });

        await compareContentsToSnapshot(content, [
            "resetting-the-viewer-partially-should-not-delete-all-expressions.txt",
        ]);
    });

    test("Resetting the viewer when expression as in columns field, should delete all expressions", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            await elem.toggleConfig(true);
            await elem.restore({
                columns: ["1 + 2"],
                expressions: { "3 + 4": "3 + 4", "1 + 2": "1 + 2" },
            });
            await elem.reset(true);
        });

        const contents = await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            return (
                elem.shadowRoot.querySelector("#sub-columns")?.innerHTML ||
                "MISSING"
            );
        });

        await compareContentsToSnapshot(contents, [
            "resetting-the-viewer-when-expression-as-in-columns-field-should-delete-all-expressions.txt",
        ]);
    });

    test("Resetting the viewer partially when expression as in columns field, should not delete all expressions", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            await elem.toggleConfig(true);
            await elem.restore({
                columns: ["1 + 2"],
                expressions: { "3 + 4": "3 + 4", "1 + 2": "1 + 2" },
            });
            await elem.reset(false);
        });

        const contents = await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            return elem.shadowRoot.querySelector("#sub-columns").innerHTML;
        });

        await compareContentsToSnapshot(contents, [
            "resetting-the-viewer-partially-when-expression-as-in-columns-field-should-not-delete-all-expressions.txt",
        ]);
    });

    test("Resetting the viewer when expression as in group_by or other field, should delete all expressions", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            await elem.toggleConfig(true);
            await elem.restore({
                columns: ["1 + 2"],
                group_by: ["3 + 4"],
                sort: [["1 + 2", "asc"]],
                filter: [["1 + 2", "==", 3]],
                expressions: { "3 + 4": "3 + 4", "1 + 2": "1 + 2" },
            });
            await elem.reset(true);
        });

        const contents = await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            return (
                elem.shadowRoot.querySelector("#sub-columns")?.innerHTML ||
                "MISSING"
            );
        });

        await compareContentsToSnapshot(contents, [
            "resetting-the-viewer-when-expression-as-in-group_by-or-other-field-should-delete-all-expressions.txt",
        ]);
    });

    test("Expressions should persist when new views are created which don't use them", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            await elem.toggleConfig(true);
            await elem.restore({
                expressions: { "3 + 4": "3 + 4", "1 + 2": "1 + 2" },
            });
            await elem.restore({
                columns: ["State"],
            });
        });

        const contents = await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            return elem.shadowRoot.querySelector("#sub-columns").innerHTML;
        });

        await compareContentsToSnapshot(contents, [
            "expressions-should-persist-when-new-views-are-created-which-dont-use-them.txt",
        ]);
    });

    test("Hovering over New Expression Button marks it.", async ({ page }) => {
        await page.evaluate(openSidebarAndScrollToBottom);
        let addExprButton = await page.waitForSelector("#add-expression");
        let notHovered = await addExprButton.getAttribute("class");
        expect(notHovered).toBeNull();

        await addExprButton.hover();
        let hovered = await addExprButton.getAttribute("class");
        expect(hovered).toBe("dragdrop-hover");
    });

    // Currently does not work in Firefox!
    test("Clicking on New Expression Button marks it.", async ({ page }) => {
        await page.pause();
        await page.evaluate(openSidebarAndScrollToBottom);
        let addExprButton = await page.waitForSelector("#add-expression");
        let unclicked = await addExprButton.getAttribute("class");
        expect(unclicked).toBeNull();
        await addExprButton.click();
        await page.evaluate(openSidebarAndScrollToBottom);
        let clicked = await addExprButton.getAttribute("class");
        expect(clicked).toBe("dragdrop-hover");
    });

    test("Expressions should persist when new views are created using them", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            await elem.toggleConfig(true);
            await elem.restore({
                expressions: { "3 + 4": "3 + 4", "1 + 2": "1 + 2" },
            });
            await elem.restore({
                columns: ["3 + 4"],
            });
        });

        const contents = await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            return elem.shadowRoot.querySelector("#sub-columns").innerHTML;
        });

        await compareContentsToSnapshot(contents, [
            "expressions-should-persist-when-new-views-are-created-using-them.txt",
        ]);
    });

    test("Aggregates for expressions should apply", async ({ page }) => {
        await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            await elem.toggleConfig(true);
            await elem.restore({
                expressions: { '"Sales" + 100': '"Sales" + 100' },
                aggregates: { '"Sales" + 100': "avg" },
                group_by: ["State"],
                columns: ['"Sales" + 100'],
            });
        });

        const contents = await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            return elem.shadowRoot.querySelector("#sub-columns").innerHTML;
        });

        await compareContentsToSnapshot(contents, [
            "aggregates-for-expressions-should-apply.txt",
        ]);
    });

    test("Should sort by hidden expressions", async ({ page }) => {
        await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            await elem.toggleConfig(true);
            await elem.restore({
                expressions: { '"Sales" + 100': '"Sales" + 100' },
                sort: [['"Sales" + 100', "asc"]],
                columns: ["Row ID"],
            });
        });

        const contents = await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            return elem.shadowRoot.querySelector("#sub-columns").innerHTML;
        });

        await compareContentsToSnapshot(contents, [
            "should-sort-by-hidden-expressions.txt",
        ]);
    });

    test("Should filter by an expression", async ({ page }) => {
        await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            await elem.toggleConfig(true);
            await elem.restore({
                expressions: { '"Sales" + 100': '"Sales" + 100' },
                filter: [['"Sales" + 100', ">", 150]],
                columns: ["Row ID", '"Sales" + 100'],
            });
        });

        const contents = await page.evaluate(async () => {
            const elem = document.querySelector("perspective-viewer");
            return elem.shadowRoot.querySelector("#sub-columns").innerHTML;
        });

        await compareContentsToSnapshot(contents, [
            "should-filter-by-an-expression.txt",
        ]);
    });
});
