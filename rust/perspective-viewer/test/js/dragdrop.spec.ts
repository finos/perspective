/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test, expect } from "@playwright/test";
import {
    setupPage,
    loadTableAsset,
    compareSVGContentsToSnapshot,
    runAllStandardTests,
    getSvgContentString,
    SUPERSTORE_CSV_PATH,
} from "@finos/perspective-test";
import path from "path";

async function get_contents(page) {
    return await page.evaluate(async () => {
        // @ts-ignore
        const viewer = document
            .querySelector("perspective-viewer")
            .shadowRoot.querySelector("#app_panel");
        return viewer ? viewer.innerHTML : "MISSING";
    });
}

async function restore_viewer(page, config) {
    await page.evaluate(async (config) => {
        const viewer = document.querySelector("perspective-viewer");
        // @ts-ignore
        await viewer.getTable();
        // @ts-ignore
        await viewer.restore(config);
    }, config);
}

async function shadow_elem(page, selector) {
    return await page.evaluateHandle(async (selector) => {
        const viewer = document.querySelector("perspective-viewer");
        // @ts-ignore
        return viewer.shadowRoot.querySelector(selector);
    }, selector);
}

async function drag_and_drop(page, origin, target, skip = false) {
    page.setDragInterception(true);
    if (!skip) {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            // @ts-ignore
            window._dragdrop_finished = false;
            // @ts-ignore
            viewer.addEventListener("perspective-config-update", () => {
                // @ts-ignore
                window._dragdrop_finished = true;
            });
        });
    }
    await origin.dragAndDrop(target);
    if (!skip) {
        // @ts-ignore
        await page.waitForFunction(() => window._dragdrop_finished);
    } else {
        await page.waitFor(300);
    }

    await page.evaluate(async () => {
        // @ts-ignore
        window._dragdrop_finished = false;
        const viewer = document.querySelector("perspective-viewer");
        // @ts-ignore
        await viewer.flush();
    });
}

async function drag(page, origin, target) {
    page.setDragInterception(true);
    origin.drop();
    await page.waitFor(100);
    origin.dragAndDrop(target, { delay: 100000 });
    await page.waitFor(100);
}

test.describe("Drag and drop", () => {
    test("Drag and Drop tests file is being reach, but all tests are currently skipped", async ({
        page,
    }) => {
        expect(1).toBe(1);
    });
});

// utils.with_server({}, () => {
//     describe("dragdrop", () => {
//         describe.page(
//             "superstore.html",
//             () => {
//                 describe("drop", () => {
//                     test.skip("from inactive to active should add", async (page) => {
//                         await restore_viewer(page, {
//                             settings: true,
//                             group_by: ["State"],
//                             columns: ["Profit", "Sales"],
//                         });

//                         const origin = await shadow_elem(
//                             page,
//                             `#sub-columns [data-index="3"] .column-selector-draggable`
//                         );

//                         const target = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="1"]`
//                         );

//                         await drag_and_drop(page, origin, target);
//                         return await get_contents(page);
//                     });

//                     test.skip("from active to active should swap", async (page) => {
//                         await restore_viewer(page, {
//                             settings: true,
//                             group_by: ["State"],
//                             columns: ["Profit", "Sales"],
//                         });

//                         const origin = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="0"] .column-selector-draggable`
//                         );

//                         const target = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="1"]`
//                         );

//                         await drag_and_drop(page, origin, target);
//                         return await get_contents(page);
//                     });
//                 });
//             },
//             { root: path.join(__dirname, "..", "..") }
//         );

//         describe.page(
//             "column-selector-modes.html",
//             () => {
//                 describe("drop", () => {
//                     test.skip("from inactive to required column should add", async (page) => {
//                         await restore_viewer(page, {
//                             settings: true,
//                             plugin: "test chart",
//                             group_by: ["State"],
//                             columns: ["Profit", "Sales"],
//                         });

//                         const origin = await shadow_elem(
//                             page,
//                             `#sub-columns [data-index="1"] .column-selector-draggable`
//                         );

//                         const target = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="1"]`
//                         );

//                         await drag_and_drop(page, origin, target);
//                         return await get_contents(page);
//                     });

//                     test.skip("from required to required should swap", async (page) => {
//                         await restore_viewer(page, {
//                             settings: true,
//                             group_by: ["State"],
//                             columns: [
//                                 "Profit",
//                                 "Sales",
//                                 null,
//                                 "Quantity",
//                                 "Discount",
//                             ],
//                         });

//                         const origin = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="0"] .column-selector-draggable`
//                         );

//                         const target = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="1"]`
//                         );

//                         await drag_and_drop(page, origin, target);
//                         return await get_contents(page);
//                     });

//                     test.skip("from required to empty column should fail", async (page) => {
//                         await restore_viewer(page, {
//                             settings: true,
//                             group_by: ["State"],
//                             columns: ["Profit", "Sales"],
//                         });

//                         const origin = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="0"] .column-selector-draggable`
//                         );

//                         const target = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="3"]`
//                         );

//                         await drag_and_drop(page, origin, target, true);
//                         return await get_contents(page);
//                     });

//                     test.skip("from inactive to empty should add", async (page) => {
//                         await restore_viewer(page, {
//                             settings: true,
//                             plugin: "test chart",
//                             group_by: ["State"],
//                             columns: ["Profit", "Sales"],
//                         });

//                         const origin = await shadow_elem(
//                             page,
//                             `#sub-columns [data-index="1"] .column-selector-draggable`
//                         );

//                         const target = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="3"]`
//                         );

//                         await drag_and_drop(page, origin, target);
//                         return await get_contents(page);
//                     });

//                     test.skip("from named to required should swap", async (page) => {
//                         await restore_viewer(page, {
//                             settings: true,
//                             group_by: ["State"],
//                             columns: [
//                                 "Profit",
//                                 "Sales",
//                                 null,
//                                 "Quantity",
//                                 "Discount",
//                             ],
//                         });

//                         const origin = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="3"] .column-selector-draggable`
//                         );

//                         const target = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="1"]`
//                         );

//                         await drag_and_drop(page, origin, target);
//                         return await get_contents(page);
//                     });

//                     test.skip("from optional to empty columns should move", async (page) => {
//                         await restore_viewer(page, {
//                             settings: true,
//                             group_by: ["State"],
//                             columns: [
//                                 "Profit",
//                                 "Sales",
//                                 null,
//                                 null,
//                                 "Quantity",
//                                 "Discount",
//                                 "Category",
//                             ],
//                         });

//                         const origin = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="4"] .column-selector-draggable`
//                         );

//                         const target = await shadow_elem(
//                             page,
//                             `#active-columns [data-index="2"]`
//                         );

//                         await drag_and_drop(page, origin, target);
//                         return await get_contents(page);
//                     });
//                 });

//                 describe("dragover", () => {
//                     test.skip(
//                         "from named to required columns should swap",
//                         async (page) => {
//                             await restore_viewer(page, {
//                                 settings: true,
//                                 group_by: ["State"],
//                                 columns: [
//                                     "Profit",
//                                     "Sales",
//                                     null,
//                                     "Quantity",
//                                     "Discount",
//                                 ],
//                             });

//                             const origin = await shadow_elem(
//                                 page,
//                                 `#active-columns [data-index="3"] .column-selector-draggable`
//                             );

//                             const target = await shadow_elem(
//                                 page,
//                                 `#active-columns [data-index="1"]`
//                             );

//                             await drag(page, origin, target);
//                             return await get_contents(page);
//                         },
//                         { reload_page: true }
//                     );

//                     test.skip(
//                         "from optional to empty columns should move",
//                         async (page) => {
//                             await restore_viewer(page, {
//                                 settings: true,
//                                 group_by: ["State"],
//                                 columns: [
//                                     "Profit",
//                                     "Sales",
//                                     null,
//                                     null,
//                                     "Quantity",
//                                     "Discount",
//                                     "Category",
//                                 ],
//                             });

//                             const origin = await shadow_elem(
//                                 page,
//                                 `#active-columns [data-index="5"] .column-selector-draggable`
//                             );

//                             const target = await shadow_elem(
//                                 page,
//                                 `#active-columns [data-index="2"]`
//                             );

//                             await drag(page, origin, target);
//                             return await get_contents(page);
//                         },
//                         { reload_page: true }
//                     );

//                     test.skip(
//                         "from optional to required columns should swap",
//                         async (page) => {
//                             await restore_viewer(page, {
//                                 settings: true,
//                                 group_by: ["State"],
//                                 columns: [
//                                     "Profit",
//                                     "Sales",
//                                     null,
//                                     null,
//                                     "Quantity",
//                                     "Discount",
//                                     "Category",
//                                 ],
//                             });

//                             const origin = await shadow_elem(
//                                 page,
//                                 `#active-columns [data-index="5"] .column-selector-draggable`
//                             );

//                             const target = await shadow_elem(
//                                 page,
//                                 `#active-columns [data-index="1"]`
//                             );

//                             await drag(page, origin, target);
//                             return await get_contents(page);
//                         },
//                         { reload_page: true }
//                     );
//                     test.skip(
//                         "filter in should work",
//                         async (page) => {
//                             await restore_viewer(page, {
//                                 settings: true,
//                                 group_by: [],
//                                 columns: [
//                                     "Order ID",
//                                     "City",
//                                     null,
//                                     null,
//                                     "Category",
//                                 ],
//                             });
//                             const origin = await shadow_elem(
//                                 page,
//                                 `#active-columns [data-index="1"] .column-selector-draggable`
//                             );
//                             const target = await shadow_elem(page, "#filter");
//                             await drag_and_drop(page, origin, target);
//                             await page.evaluateHandle(async () => {
//                                 const mouseEvent =
//                                     document.createEvent("MouseEvents");
//                                 mouseEvent.initEvent("focus", true, true);
//                                 const input = document
//                                     .querySelector("perspective-viewer")
//                                     .shadowRoot.querySelector(
//                                         '[placeholder="Value"]'
//                                     );
//                                 input.dispatchEvent(mouseEvent);
//                             });
//                             await page.evaluateHandle(async () => {
//                                 const op = document
//                                     .querySelector("perspective-viewer")
//                                     .shadowRoot.querySelector(
//                                         ".filterop-selector"
//                                     );
//                                 op.value = "in";
//                                 const input = document
//                                     .querySelector("perspective-viewer")
//                                     .shadowRoot.querySelector(
//                                         '[placeholder="Value"]'
//                                     );
//                                 input.dispatchEvent(
//                                     new Event("change", {
//                                         bubbles: true,
//                                         cancelable: true,
//                                     })
//                                 );
//                             });
//                             await page.evaluateHandle(async () => {
//                                 await sleep(500);
//                                 const input = document
//                                     .querySelector("perspective-viewer")
//                                     .shadowRoot.querySelector(
//                                         '[placeholder="Value"]'
//                                     );
//                                 input.value = "a,Ch";
//                                 input.dispatchEvent(
//                                     new Event("input", {
//                                         bubbles: true,
//                                         cancelable: true,
//                                     })
//                                 );
//                                 function sleep(time) {
//                                     return new Promise((resolve) =>
//                                         setTimeout(resolve, time)
//                                     );
//                                 }
//                                 await sleep(500);
//                             });
//                             return await get_contents(page);
//                         },
//                         { reload_page: true }
//                     );
//                 });
//             },
//             { root: path.join(__dirname, "..", "..") }
//         );
//     });
// });
