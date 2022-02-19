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

utils.with_server({}, () => {
    describe.page(
        "resize.html",
        () => {
            test.capture("Config should show by default", async (page) => {
                await page.waitForFunction(() => !!window.__WIDGET__);
                return await page.evaluate(async () => {
                    await window.__WIDGET__.viewer.getTable();
                    await window.__WIDGET__.viewer.flush();

                    // Linux returns ever-so-slightly different auto width
                    // column values so we need to strip these.
                    for (const elem of document.querySelectorAll(
                        "perspective-viewer *"
                    )) {
                        elem.removeAttribute("style");
                    }

                    return window.__WIDGET__.viewer.innerHTML;
                });
            });

            test.capture(
                "Resize the container causes the widget to resize",
                async (page) => {
                    await page.evaluate(async () => {
                        await document
                            .querySelector("perspective-viewer")
                            .toggleConfig();
                        await document
                            .querySelector("perspective-viewer")
                            .getTable();
                        await document
                            .querySelector("perspective-viewer")
                            .flush();
                    });

                    await page.evaluate(async () => {
                        document
                            .querySelector(".PSPContainer")
                            .setAttribute(
                                "style",
                                "position:absolute;top:0;left:0;width:300px;height:300px"
                            );

                        await document
                            .querySelector("perspective-viewer")
                            .notifyResize(true);
                    });

                    return await page.evaluate(async () => {
                        document.querySelector(".PSPContainer").style =
                            "position:absolute;top:0;left:0;width:800px;height:600px";
                        await document
                            .querySelector("perspective-viewer")
                            .notifyResize(true);

                        for (const elem of document.querySelectorAll(
                            "perspective-viewer *"
                        )) {
                            elem.removeAttribute("style");
                        }

                        return window.__WIDGET__.viewer.innerHTML;
                    });
                }
            );

            test.capture("group_by traitlet works", async (page) => {
                await page.evaluate(async () => {
                    await document
                        .querySelector("perspective-viewer")
                        .toggleConfig();
                    await document
                        .querySelector("perspective-viewer")
                        .getTable();
                    await document.querySelector("perspective-viewer").flush();
                });
                return await page.evaluate(async () => {
                    await window.__WIDGET__.restore({group_by: ["State"]});
                    for (const elem of document.querySelectorAll(
                        "perspective-viewer *"
                    )) {
                        elem.removeAttribute("style");
                    }

                    return window.__WIDGET__.viewer.innerHTML;
                });
            });
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
