/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const {select} = require("d3");
const {initialiseStyles} = require("../../../../src/js/series/colorStyles");
const sinon = require("sinon");

const styleVariables = {
    "--d3fc-local-series": "rgba(31, 119, 180, 0.5)",
    "--d3fc-local-series-1": "#0366d6",
    "--d3fc-local-series-2": "#ff7f0e",
    "--d3fc-local-series-3": "#2ca02c",
    "--d3fc-local-series-4": "#d62728",
    "--d3fc-local-series-5": "#9467bd",
    "--d3fc-local-series-6": "#8c564b",
    "--d3fc-local-series-7": "#e377c2",
    "--d3fc-local-series-8": "#7f7f7f",
    "--d3fc-local-series-9": "#bcbd22",
    "--d3fc-local-series-10": "#17becf",
    "--d3fc-local-full--gradient": `linear-gradient(
        #4d342f 0%,
        #f0f0f0 50%,
        #1a237e 100%
    )`,
    "--d3fc-local-positive--gradient": `linear-gradient(
        #dcedc8 0%,
        #1a237e 100%
    )`,
    "--d3fc-local-negative--gradient": `linear-gradient(
        #feeb65 100%,
        #4d342f 0%
    )`,
};

describe("colorStyles should", () => {
    let container = null;
    let settings = null;

    beforeEach(() => {
        container = select("body").append("div");

        settings = {};

        window.getComputedStyle = () => ({
            getPropertyValue(x) {
                return styleVariables[x];
            },
        });
    });

    afterEach(() => {
        container.remove();
    });

    test("initialise colors from CSS variables", () => {
        initialiseStyles(container.node(), settings);
        const result = settings.colorStyles;

        expect(result.opacity).toEqual(0.5);
        expect(result.series).toEqual(styleVariables["--d3fc-local-series"]);
        for (let n = 1; n <= 10; n++) {
            expect(result[`series-${n}`]).toEqual(
                styleVariables[`--d3fc-local-series-${n}`]
            );
        }
    });

    test("initialise gradients with opacity", () => {
        initialiseStyles(container.node(), settings);
        const result = settings.colorStyles;

        expect(result.gradient.full).toEqual([
            [0, "rgba(77, 52, 47, 0.5)"],
            [0.5, "rgba(240, 240, 240, 0.5)"],
            [1, "rgba(26, 35, 126, 0.5)"],
        ]);
        expect(result.gradient.positive).toEqual([
            [0, "rgba(220, 237, 200, 0.5)"],
            [1, "rgba(26, 35, 126, 0.5)"],
        ]);
        expect(result.gradient.negative).toEqual([
            [0, "rgba(77, 52, 47, 0.5)"],
            [1, "rgba(254, 235, 101, 0.5)"],
        ]);
    });
});
