/******************************************************************************
 *
 * Copyright (c) 2022, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");

const utils = require("@finos/perspective-test");
const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");

const {withTemplate} = require("./simple-template");
withTemplate("events", "Y Line");

async function get_contents(page) {
    return await page.evaluate(async () => {
        const viewer = document
            .querySelector(`perspective-viewer perspective-viewer-d3fc-yline`)
            .shadowRoot.querySelector("svg");
        return viewer.outerHTML || "MISSING";
    });
}

utils.with_server({}, () => {
    describe.page(
        "events.html",
        () => {
            test.capture(
                "perspective-config-update event is fired when series axis is changed",
                async (page) => {
                    // Await the viewer element to exist on the page
                    const viewer = await page.$("perspective-viewer");
                    await page.evaluate(async (viewer) => {
                        // Await the table load
                        await viewer.getTable();

                        await viewer.restore({
                            plugin: "Y Line",
                            columns: ["Sales", "Profit"],
                        });

                        // Register a listener for `perspective-config-update` event
                        window.__series_events__ = [];
                        viewer.addEventListener(
                            "perspective-config-update",
                            (evt) => {
                                window.__series_events__.push(evt);
                            }
                        );
                    }, viewer);
                    const axisLabel = (
                        await page.waitForFunction(() =>
                            document
                                .querySelector("perspective-viewer-d3fc-yline")
                                .shadowRoot.querySelector(
                                    ".y-label .splitter-label"
                                )
                        )
                    ).asElement();
                    await axisLabel.click(axisLabel);

                    const count = await page.evaluate(async (viewer) => {
                        // Await the plugin rendering
                        await viewer.flush();

                        // Count the events;
                        return window.__series_events__.length;
                    }, viewer);

                    // Expect 1 event
                    expect(count).toEqual(1);

                    // Return the chart contents
                    return get_contents(page);
                }
            );

            test.capture(
                "perspective-config-update event is fired when legend position is changed",
                async (page) => {
                    // Await the viewer element to exist on the page
                    const viewer = await page.$("perspective-viewer");
                    await page.evaluate(async (viewer) => {
                        // Await the table load
                        await viewer.getTable();

                        await viewer.restore({
                            plugin: "Y Line",
                            columns: ["Sales", "Profit"],
                        });

                        // Register a listener for `perspective-config-update` event
                        window.__legend_events__ = [];
                        viewer.addEventListener(
                            "perspective-config-update",
                            (evt) => {
                                window.__legend_events__.push(evt);
                            }
                        );
                    }, viewer);

                    const legend = (
                        await page.waitForFunction(() =>
                            document
                                .querySelector("perspective-viewer-d3fc-yline")
                                .shadowRoot.querySelector(".legend-container")
                        )
                    ).asElement();

                    const boundingBox = await legend.boundingBox();

                    const start = {
                        x: boundingBox.x + boundingBox.width / 2,
                        y: boundingBox.y + boundingBox.height / 2,
                    };

                    const target = {
                        x: start.x - 300,
                        y: start.y,
                    };

                    await page.mouse.move(start.x, start.y);
                    await page.mouse.down();
                    await page.mouse.move(target.x, target.y);

                    const count = await page.evaluate(async (viewer) => {
                        // Await the plugin rendering
                        await viewer.flush();

                        // Count the events;
                        return window.__legend_events__.length;
                    }, viewer);

                    expect(count).toBeGreaterThan(0);

                    // Return the chart contents
                    return get_contents(page);
                }
            );
        },
        {reload_page: false, root: path.join(__dirname, "..", "..", "..")}
    );
});
