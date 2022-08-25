/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@finos/perspective-test");
const path = require("path");

const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");

async function get_contents(
    page,
    selector = "perspective-viewer perspective-viewer-datagrid regular-table",
    shadow = false
) {
    return await page.evaluate(
        async (selector, shadow) => {
            const viewer = document.querySelector(selector);
            return (shadow ? viewer.shadowRoot : viewer).innerHTML || "MISSING";
        },
        selector,
        shadow
    );
}

utils.with_server({}, () => {
    describe.page(
        "superstore.html",
        () => {
            test.capture(
                "perspective-config-update event is fired when column style is changed",
                async (page) => {
                    // Await the viewer element to exist on the page
                    const viewer = await page.waitForSelector(
                        "perspective-viewer"
                    );
                    const {x, y} = await page.evaluate(async (viewer) => {
                        // Await the table load
                        await viewer.getTable();

                        // Open the config panel
                        await viewer.toggleConfig();

                        // Register a listener for `perspective-config-update` event
                        window.__events__ = [];
                        viewer.addEventListener(
                            "perspective-config-update",
                            (evt) => {
                                window.__events__.push(evt);
                            }
                        );

                        // Find the column config menu button
                        const header_button = viewer.querySelector(
                            "regular-table thead tr:last-child th"
                        );

                        // Get the button coords (slightly lower than center
                        // because of the location of the menu button within
                        // this element)
                        const rect = header_button.getBoundingClientRect();
                        return {
                            x: Math.floor(rect.left + rect.width / 2),
                            y: Math.floor(rect.top + (3 * rect.height) / 4),
                        };
                    }, viewer);

                    // Click the menu button
                    await page.mouse.click(x, y);

                    // Await the style menu existing on the page
                    const style_menu = await page.waitForSelector(
                        "perspective-number-column-style"
                    );

                    const {x: xx, y: yy} = await page.evaluate(
                        async (style_menu) => {
                            // Find the 'bar' button
                            const bar_button =
                                style_menu.shadowRoot.querySelector(
                                    '#radio-list-1[name="foreground-list"]'
                                );

                            // Get its coords
                            const rect = bar_button.getBoundingClientRect();
                            return {
                                x: Math.floor(rect.left + rect.width / 2),
                                y: Math.floor(rect.top + rect.height / 2),
                            };
                        },
                        style_menu
                    );

                    // Click the button
                    await page.mouse.click(xx, yy);

                    const count = await page.evaluate(async (viewer) => {
                        // Await the plugin rendering
                        await viewer.flush();

                        // Count the events;
                        return window.__events__.length;
                    }, viewer);

                    // Expect 1 event
                    expect(count).toEqual(1);

                    // Return the `<table>` contents
                    return get_contents(page);
                }
            );

            describe("Column style menu opens for", () => {
                async function test_column(page, selector, selector2) {
                    const viewer = await page.waitForSelector(
                        "perspective-viewer"
                    );
                    const {x, y} = await page.evaluate(
                        async (viewer, selector) => {
                            await viewer.getTable();
                            await viewer.toggleConfig();
                            window.__events__ = [];
                            viewer.addEventListener(
                                "perspective-config-update",
                                (evt) => {
                                    window.__events__.push(evt);
                                }
                            );

                            const header_button = viewer.querySelector(
                                "regular-table thead tr:last-child th" +
                                    selector
                            );

                            const rect = header_button.getBoundingClientRect();
                            return {
                                x: Math.floor(rect.left + rect.width / 2),
                                y: Math.floor(rect.top + (3 * rect.height) / 4),
                            };
                        },
                        viewer,
                        selector
                    );

                    await page.mouse.click(x, y);
                    const style_menu = await page.waitForSelector(
                        `perspective-${selector2}-column-style`
                    );

                    await new Promise((x) => setTimeout(x, 3000));

                    return get_contents(
                        page,
                        ` perspective-${selector2}-column-style`,
                        true
                    );
                }

                test.capture("numeric columns", async (page) => {
                    return await test_column(page, "", "number");
                });

                test.capture("string columns", async (page) => {
                    return await test_column(page, ":nth-child(2)", "string");
                });

                // TODO Intl.supportedValuesOf doesn't exist in Chromium
                test.skip("date columns", async (page) => {
                    await test_column(page, ":nth-child(3)", "datetime");
                });
            });
        },
        {root: path.join(__dirname, "..", "..")}
    );
});

// const click_details = async (page, x = 310, y = 300) => {
//     const viewer = await page.$("perspective-viewer");

//     const click_event = page.evaluate(
//         element =>
//             new Promise(resolve => {
//                 element.addEventListener("perspective-click", e => {
//                     resolve(e.detail);
//                 });
//             }),
//         viewer
//     );
//     await page.mouse.click(x, y);
//     return await click_event;
// };
