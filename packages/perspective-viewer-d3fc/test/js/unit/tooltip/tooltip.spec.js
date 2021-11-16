/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const {select} = require("d3");
const {tooltip} = require("../../../../src/js/tooltip/tooltip");

describe("tooltip with", () => {
    let container = null;
    let testElement = null;
    let settings = null;
    const data = [{mainValue: 101}];

    const awaitTransition = (selection) => {
        return new Promise((resolve) => {
            const transition = selection.transition();
            let n = transition.size();
            if (n === 0) {
                resolve();
            }
            transition.on("end", () => {
                if (!--n) {
                    resolve();
                }
            });
        });
    };

    beforeEach(() => {
        container = select("body")
            .append("div")
            .attr("id", "container")
            .classed("chart", true);

        testElement = container
            .selectAll("div.element")
            .data(data)
            .enter()
            .append("div")
            .classed("element", true)
            .style("position", "absolute")
            .style("top", "150px")
            .style("left", "300px")
            .style("width", "25px")
            .style("height", "40px");

        settings = {
            crossValues: [],
            splitValues: [],
            mainValues: [{name: "main-1", type: "integer"}],
        };
    });
    afterEach(() => {
        container.remove();
    });

    describe("on-hover should", () => {
        let tooltipDiv;
        beforeEach(async () => {
            tooltip().settings(settings)(testElement);
            tooltipDiv = container.select("div.tooltip");
            await awaitTransition(tooltipDiv);
        });

        test("not show a tooltip initially", () => {
            expect(tooltipDiv.style("opacity")).toEqual("0");
        });

        test("show a tooltip on mouse over", async () => {
            testElement.node().dispatchEvent(new MouseEvent("mouseover"));
            await awaitTransition(tooltipDiv);

            expect(tooltipDiv.style("opacity")).not.toEqual("0");
        });
    });

    describe("always-show should", () => {
        let tooltipDiv;
        let tooltipComponent;
        beforeEach(async () => {
            tooltipComponent = tooltip().settings(settings).alwaysShow(true);

            tooltipComponent(testElement);
            tooltipDiv = container.select("div.tooltip");
            await awaitTransition(tooltipDiv);
        });

        test("show a tooltip initially", () => {
            expect(tooltipDiv.style("opacity")).not.toEqual("0");
        });

        test("hide a tooltip if no element", async () => {
            tooltipComponent(container.select("div.notexists"));
            await awaitTransition(tooltipDiv);
            expect(Math.floor(parseFloat(tooltipDiv.style("opacity")))).toEqual(
                0
            );
        });
    });
});
