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

async function get_contents(page) {
    return await page.evaluate(async () => {
        const viewer = document
            .querySelector("perspective-viewer")
            .shadowRoot.querySelector("#app_panel");
        return viewer ? viewer.innerHTML : "MISSING";
    });
}

async function restore_viewer(page, config) {
    await page.evaluate(async (config) => {
        const viewer = document.querySelector("perspective-viewer");
        await viewer.getTable();
        await viewer.restore(config);
    }, config);
}

async function shadow_elem(page, selector) {
    return await page.evaluateHandle(async (selector) => {
        const viewer = document.querySelector("perspective-viewer");
        return viewer.shadowRoot.querySelector(selector);
    }, selector);
}

async function drag_and_drop(page, origin, target, skip = false) {
    page.setDragInterception(true);
    if (!skip) {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            window._dragdrop_finished = false;
            viewer.addEventListener("perspective-config-update", () => {
                window._dragdrop_finished = true;
            });
        });
    }
    await origin.dragAndDrop(target);
    if (!skip) {
        await page.waitForFunction(() => window._dragdrop_finished);
    } else {
        await page.waitFor(300);
    }

    await page.evaluate(async () => {
        window._dragdrop_finished = false;
        const viewer = document.querySelector("perspective-viewer");
        await viewer.flush();
    });
}

async function drag(page, origin, target) {
    page.setDragInterception(true);
    origin.drop();
    await page.waitFor(100);
    origin.dragAndDrop(target, {delay: 100000});
    await page.waitFor(100);
}

utils.with_server({}, () => {
    describe("dragdrop", () => {
        describe.page(
            "superstore.html",
            () => {
                describe("drop", () => {
                    test.capture(
                        "from inactive to active should add",
                        async (page) => {
                            await restore_viewer(page, {
                                settings: true,
                                group_by: ["State"],
                                columns: ["Profit", "Sales"],
                            });

                            const origin = await shadow_elem(
                                page,
                                `#inactive-columns [data-index="3"] .column_selector_draggable`
                            );

                            const target = await shadow_elem(
                                page,
                                `#active-columns [data-index="1"]`
                            );

                            await drag_and_drop(page, origin, target);
                            return await get_contents(page);
                        }
                    );

                    test.capture(
                        "from active to active should swap",
                        async (page) => {
                            await restore_viewer(page, {
                                settings: true,
                                group_by: ["State"],
                                columns: ["Profit", "Sales"],
                            });

                            const origin = await shadow_elem(
                                page,
                                `#active-columns [data-index="0"] .column_selector_draggable .column-selector-column-title`
                            );

                            const target = await shadow_elem(
                                page,
                                `#active-columns [data-index="1"]`
                            );

                            await drag_and_drop(page, origin, target);
                            return await get_contents(page);
                        }
                    );
                });
            },
            {root: path.join(__dirname, "..", "..")}
        );

        describe.page(
            "column-selector-modes.html",
            () => {
                describe("drop", () => {
                    test.capture(
                        "from inactive to required column should add",
                        async (page) => {
                            await restore_viewer(page, {
                                settings: true,
                                plugin: "test chart",
                                group_by: ["State"],
                                columns: ["Profit", "Sales"],
                            });

                            const origin = await shadow_elem(
                                page,
                                `#inactive-columns [data-index="3"] .column_selector_draggable`
                            );

                            const target = await shadow_elem(
                                page,
                                `#active-columns [data-index="1"]`
                            );

                            await drag_and_drop(page, origin, target);
                            return await get_contents(page);
                        }
                    );

                    test.capture(
                        "from required to required should swap",
                        async (page) => {
                            await restore_viewer(page, {
                                settings: true,
                                group_by: ["State"],
                                columns: [
                                    "Profit",
                                    "Sales",
                                    null,
                                    "Quantity",
                                    "Discount",
                                ],
                            });

                            const origin = await shadow_elem(
                                page,
                                `#active-columns [data-index="0"] .column_selector_draggable .column-selector-column-title`
                            );

                            const target = await shadow_elem(
                                page,
                                `#active-columns [data-index="1"]`
                            );

                            await drag_and_drop(page, origin, target);
                            return await get_contents(page);
                        }
                    );

                    test.capture(
                        "from required to empty column should fail",
                        async (page) => {
                            await restore_viewer(page, {
                                settings: true,
                                group_by: ["State"],
                                columns: ["Profit", "Sales"],
                            });

                            const origin = await shadow_elem(
                                page,
                                `#active-columns [data-index="0"] .column_selector_draggable .column-selector-column-title`
                            );

                            const target = await shadow_elem(
                                page,
                                `#active-columns [data-index="3"]`
                            );

                            await drag_and_drop(page, origin, target, true);
                            return await get_contents(page);
                        }
                    );

                    test.capture(
                        "from inactive to empty should add",
                        async (page) => {
                            await restore_viewer(page, {
                                settings: true,
                                plugin: "test chart",
                                group_by: ["State"],
                                columns: ["Profit", "Sales"],
                            });

                            const origin = await shadow_elem(
                                page,
                                `#inactive-columns [data-index="3"] .column_selector_draggable`
                            );

                            const target = await shadow_elem(
                                page,
                                `#active-columns [data-index="3"]`
                            );

                            await drag_and_drop(page, origin, target);
                            return await get_contents(page);
                        }
                    );

                    test.capture(
                        "from named to required should swap",
                        async (page) => {
                            await restore_viewer(page, {
                                settings: true,
                                group_by: ["State"],
                                columns: [
                                    "Profit",
                                    "Sales",
                                    null,
                                    "Quantity",
                                    "Discount",
                                ],
                            });

                            const origin = await shadow_elem(
                                page,
                                `#active-columns [data-index="3"] .column_selector_draggable .column-selector-column-title`
                            );

                            const target = await shadow_elem(
                                page,
                                `#active-columns [data-index="1"]`
                            );

                            await drag_and_drop(page, origin, target);
                            return await get_contents(page);
                        }
                    );

                    test.capture(
                        "from optional to empty columns should move",
                        async (page) => {
                            await restore_viewer(page, {
                                settings: true,
                                group_by: ["State"],
                                columns: [
                                    "Profit",
                                    "Sales",
                                    null,
                                    null,
                                    "Quantity",
                                    "Discount",
                                    "Category",
                                ],
                            });

                            const origin = await shadow_elem(
                                page,
                                `#active-columns [data-index="5"] .column_selector_draggable .column-selector-column-title`
                            );

                            const target = await shadow_elem(
                                page,
                                `#active-columns [data-index="2"]`
                            );

                            await drag_and_drop(page, origin, target);
                            return await get_contents(page);
                        }
                    );
                });

                describe("dragover", () => {
                    test.capture(
                        "from named to required columns should swap",
                        async (page) => {
                            await restore_viewer(page, {
                                settings: true,
                                group_by: ["State"],
                                columns: [
                                    "Profit",
                                    "Sales",
                                    null,
                                    "Quantity",
                                    "Discount",
                                ],
                            });

                            const origin = await shadow_elem(
                                page,
                                `#active-columns [data-index="3"] .column_selector_draggable .column-selector-column-title`
                            );

                            const target = await shadow_elem(
                                page,
                                `#active-columns [data-index="1"]`
                            );

                            await drag(page, origin, target);
                            return await get_contents(page);
                        },
                        {reload_page: true}
                    );

                    test.capture(
                        "from optional to empty columns should move",
                        async (page) => {
                            await restore_viewer(page, {
                                settings: true,
                                group_by: ["State"],
                                columns: [
                                    "Profit",
                                    "Sales",
                                    null,
                                    null,
                                    "Quantity",
                                    "Discount",
                                    "Category",
                                ],
                            });

                            const origin = await shadow_elem(
                                page,
                                `#active-columns [data-index="5"] .column_selector_draggable .column-selector-column-title`
                            );

                            const target = await shadow_elem(
                                page,
                                `#active-columns [data-index="2"]`
                            );

                            await drag(page, origin, target);
                            return await get_contents(page);
                        },
                        {reload_page: true}
                    );

                    test.capture(
                        "from optional to required columns should swap",
                        async (page) => {
                            await restore_viewer(page, {
                                settings: true,
                                group_by: ["State"],
                                columns: [
                                    "Profit",
                                    "Sales",
                                    null,
                                    null,
                                    "Quantity",
                                    "Discount",
                                    "Category",
                                ],
                            });

                            const origin = await shadow_elem(
                                page,
                                `#active-columns [data-index="5"] .column_selector_draggable .column-selector-column-title`
                            );

                            const target = await shadow_elem(
                                page,
                                `#active-columns [data-index="1"]`
                            );

                            await drag(page, origin, target);
                            return await get_contents(page);
                        },
                        {reload_page: true}
                    );
                    test.capture(
                        "filter in should work",
                        async (page) => {
                            await restore_viewer(page, {
                                settings: true,
                                group_by: [],
                                columns: [
                                    "Order ID",
                                    "City",
                                    null,
                                    null,
                                    "Category",
                                ],
                            });
                            const origin = await shadow_elem(
                                page,
                                `#active-columns [data-index="1"] .column_selector_draggable`
                            );
                            const target = await shadow_elem(page, "#filter");
                            await drag_and_drop(page, origin, target);
                            await page.evaluateHandle(async () => {
                                const mouseEvent =
                                    document.createEvent("MouseEvents");
                                mouseEvent.initEvent("focus", true, true);
                                const input = document
                                    .querySelector("perspective-viewer")
                                    .shadowRoot.querySelector(
                                        '[placeholder="Value"]'
                                    );
                                input.dispatchEvent(mouseEvent);
                            });
                            await page.evaluateHandle(async () => {
                                const op = document
                                    .querySelector("perspective-viewer")
                                    .shadowRoot.querySelector(
                                        ".filterop-selector"
                                    );
                                op.value = "in";
                                const input = document
                                    .querySelector("perspective-viewer")
                                    .shadowRoot.querySelector(
                                        '[placeholder="Value"]'
                                    );
                                input.dispatchEvent(
                                    new Event("change", {
                                        bubbles: true,
                                        cancelable: true,
                                    })
                                );
                            });
                            await page.evaluateHandle(async () => {
                                await sleep(500);
                                const input = document
                                    .querySelector("perspective-viewer")
                                    .shadowRoot.querySelector(
                                        '[placeholder="Value"]'
                                    );
                                input.value = "a,Ch";
                                input.dispatchEvent(
                                    new Event("input", {
                                        bubbles: true,
                                        cancelable: true,
                                    })
                                );
                                function sleep(time) {
                                    return new Promise((resolve) =>
                                        setTimeout(resolve, time)
                                    );
                                }
                                await sleep(500);
                            });
                            return await get_contents(page);
                        },
                        {reload_page: true}
                    );
                });
            },
            {root: path.join(__dirname, "..", "..")}
        );
    });
});
