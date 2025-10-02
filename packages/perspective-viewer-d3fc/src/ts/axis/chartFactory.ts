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

import * as d3 from "d3";
import * as fc from "d3fc/index.js";

export const chartSvgFactory = (xAxis, yAxis) =>
    chartFactory(xAxis, yAxis, (x, y) => x.svgPlotArea(y), false);
export const chartCanvasFactory = (xAxis, yAxis) =>
    chartFactory(
        xAxis,
        yAxis,
        (x, y) => {
            return x.canvasPlotArea(y).svgPlotArea(fc.seriesSvgPoint());
        },
        true,
    );

const chartFactory = (xAxis, yAxis, cartesian, canvas) => {
    let axisSplitter = null;
    let altAxis = null;

    const chart = fc
        .chartCartesian({
            xScale: xAxis.scale,
            yScale: yAxis.scale,
            xAxis: xAxis.component,
            yAxis: yAxis.component,
        })
        .xDomain(xAxis.domain)
        .xLabel(xAxis.label)
        .xAxisHeight(xAxis.size)
        .xDecorate(xAxis.decorate)
        .xTickFormat(xAxis.tickFormatFunction)
        .yDomain(yAxis.domain)
        .yLabel(yAxis.label)
        .yAxisWidth(yAxis.size)
        .yDecorate(yAxis.decorate)
        .yOrient("left")
        .yTickFormat(yAxis.tickFormatFunction);

    if (xAxis.decorate) chart.xDecorate(xAxis.decorate);
    if (yAxis.decorate) chart.yDecorate(yAxis.decorate);

    // Padding defaults can be overridden
    chart.xPaddingInner && chart.xPaddingInner(1);
    chart.xPaddingOuter && chart.xPaddingOuter(0.5);
    chart.yPaddingInner && chart.yPaddingInner(1);
    chart.yPaddingOuter && chart.yPaddingOuter(0.5);

    chart.axisSplitter = (...args) => {
        if (!args.length) {
            return axisSplitter;
        }
        axisSplitter = args[0];
        return chart;
    };

    chart.altAxis = (...args) => {
        if (!args.length) {
            return altAxis;
        }
        altAxis = args[0];
        return chart;
    };

    /**
     * Mimics the previous D3FC API and returns the main plot area selection.
     * Both chart types will have both layers, so this should be determined
     * by the constructor's `canvas` property.
     *
     * @param  {...any} args If provided, this function will act as a setter.
     * @returns
     */
    chart.plotArea = function (...args) {
        if (args.length == 0) {
            if (canvas) {
                return this.canvasPlotArea();
            } else {
                return this.svgPlotArea();
            }
        } else {
            return cartesian(this, ...args);
        }
    };

    const oldDecorate = chart.decorate();
    chart.decorate((container, data) => {
        const plotArea = container.select("d3fc-svg.plot-area");
        const node = plotArea.select("svg").node();
        node.setAttribute(
            "viewBox",
            `0 0 ${plotArea.node().clientWidth} ${plotArea.node().clientHeight}`,
        );
        node.setAttribute("preserveAspectRatio", "none");

        for (const axis of ["x-axis", "y-axis"]) {
            container
                .select(`d3fc-svg.${axis} svg`)
                .node()
                .setAttribute("preserveAspectRatio", "none");
        }

        oldDecorate(container, data);

        // Not sure why these are out of order ...
        // https://github.com/d3fc/d3fc/blob/master/packages/d3fc-chart/README.md#changing-the-z-order-of-plot-areas
        if (canvas) {
            const svgPlotArea = container.select(".svg-plot-area").node();
            const canvasPlotArea = container.select(".canvas-plot-area").node();
            d3.selectAll([svgPlotArea, canvasPlotArea]).order();
        }

        if (!axisSplitter) return;

        if (axisSplitter.haveSplit()) {
            // Render a second axis on the right of the chart
            const altData = axisSplitter.altData();

            const y2AxisDataJoin = fc
                .dataJoin("d3fc-svg", "y2-axis")
                .key((d) => d);
            const ySeriesDataJoin = fc.dataJoin("g", "y-series").key((d) => d);

            // Column 5 of the grid
            container
                // .enter()
                .append("div")
                .attr("class", "y-label right-label")
                .style("grid-column", 5)
                .style("-ms-grid-column", 5)
                .style("grid-row", 3)
                .style("-ms-grid-row", 3)
                .style("width", altAxis.size || "1em")
                .style("display", "flex")
                .style("align-items", "center")
                .style("justify-content", "center")
                .append("span")
                .attr("class", "y-label splitter-label")
                .style("transform", "rotate(-90deg)");

            const y2Scale = altAxis.scale.domain(altAxis.domain);
            const yAxisComponent = altAxis.component.right(y2Scale);
            yAxisComponent.tickFormat(altAxis.tickFormatFunction);
            if (altAxis.decorate) yAxisComponent.decorate(altAxis.decorate);

            // Render the axis
            y2AxisDataJoin(container, ["right"])
                .attr("class", (d) => `y2-axis ${d}-axis`)
                .on("measure", function (event, d) {
                    const { width, height } = event.detail;
                    if (d === "left") {
                        d3.select(event.currentTarget)
                            .select("svg")
                            .attr("viewBox", `${-width} 0 ${width} ${height}`)
                            .attr("preserveAspectRatio", "none");
                    }
                    y2Scale.range([height, 0]);
                })
                .on("draw", function (event, d) {
                    d3.select(event.currentTarget)
                        .select("svg")
                        .call(yAxisComponent);
                });

            // Render all the series using either the primary or alternate
            // y-scales
            if (canvas) {
                const drawMultiCanvasSeries = (selection) => {
                    const canvasPlotArea = chart.plotArea();
                    canvasPlotArea
                        .context(selection.node().getContext("2d"))
                        .xScale(xAxis.scale);

                    const yScales = [yAxis.scale, y2Scale];
                    [data, altData].forEach((d, i) => {
                        canvasPlotArea.yScale(yScales[i]);
                        canvasPlotArea(d);
                    });
                };

                container
                    .select("d3fc-canvas.plot-area")
                    .on("draw", function (event, d) {
                        drawMultiCanvasSeries(
                            d3.select(event.currentTarget).select("canvas"),
                        );
                    });
            } else {
                const drawMultiSvgSeries = function (selection) {
                    const svgPlotArea = chart.plotArea();
                    svgPlotArea.xScale(xAxis.scale);

                    const yScales = [yAxis.scale, y2Scale];
                    ySeriesDataJoin(selection, [data, altData]).each(
                        (d, i, nodes) => {
                            svgPlotArea.yScale(yScales[i]);
                            d3.select(nodes[i]).datum(d).call(svgPlotArea);
                        },
                    );
                };

                container
                    .select("d3fc-svg.plot-area")
                    .on("draw", function (event, d) {
                        drawMultiSvgSeries(
                            d3.select(event.currentTarget).select("svg"),
                        );
                    });
            }
        }

        // Render any UI elements the splitter component requires
        axisSplitter(container);
    });

    return chart;
};
