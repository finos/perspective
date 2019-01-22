/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as fc from "d3fc";
import * as d3 from "d3";
import * as d3Legend from "d3-svg-legend";

export function configureBarSeries(isSplitBy, orientation, dataset, groupBys) {
    let barSeries;
    if (isSplitBy) {
        let stackedBarSeries = fc
            .autoBandwidth(fc.seriesSvgBar())
            .align("left")
            .orient(orientation)
            .crossValue((_, i) => groupBys[i])
            .mainValue(d => d[1])
            .baseValue(d => d[0]);

        barSeries = [...dataset.map(() => stackedBarSeries)];
    } else {
        barSeries = fc
            .autoBandwidth(fc.seriesSvgBar())
            .align("left")
            .orient(orientation)
            .crossValue(d => d.crossValue)
            .mainValue(d => d.mainValue);
    }

    return barSeries;
}

export function configureGrid(horizontal) {
    let mainGrid = x => x.style("opacity", "0.3").style("stroke-width", "1.0");

    let crossGrid = x => x.style("display", "none");

    let [xGrid, yGrid] = horizontal ? [mainGrid, crossGrid] : [crossGrid, mainGrid];

    let gridlines = fc
        .annotationSvgGridline()
        .xDecorate(xGrid)
        .yDecorate(yGrid);

    return gridlines;
}

export function configureScale(isSplitBy, horizontal, dataset, groupBys) {
    let mainScale;
    let crossScale;
    if (isSplitBy) {
        let mainExtent = fc
            .extentLinear()
            .accessors([a => a.map(d => d[1])])
            .pad([0, 1])
            .padUnit("domain");

        mainScale = d3.scaleLinear().domain(mainExtent(dataset));

        crossScale = d3
            .scaleBand()
            .domain(groupBys)
            .paddingInner(0.4)
            .paddingOuter(0.2);
    } else {
        mainScale = d3.scaleLinear().domain([0, d3.max(dataset, x => x.mainValue)]);

        crossScale = d3
            .scaleBand()
            .domain(dataset.map(x => x.crossValue))
            .paddingInner(0.4)
            .paddingOuter(0.2);
    }

    let [xScale, yScale] = horizontal ? [mainScale, crossScale] : [crossScale, mainScale];
    return [xScale, yScale];
}

export function configureMultiSvg(isSplitBy, gridlines, barSeries, dataset, color, container) {
    let multi;
    if (isSplitBy) {
        let multiWithOutGrid = fc
            .seriesSvgMulti()
            .mapping((data, index) => data[index])
            .series(barSeries)
            .decorate(selection => {
                selection.each(function(data, index) {
                    d3.select(this)
                        .selectAll("g.bar")
                        .filter(d => d[0] !== d[1])
                        .attr("fill", color(dataset[index].key))
                        .attr("opacity", 0.9)
                        .each(configureTooltip);
                });
            });

        multi = fc.seriesSvgMulti().series([gridlines, multiWithOutGrid]);
    } else {
        multi = fc
            .seriesSvgMulti()
            .series([gridlines, barSeries])
            .decorate(selection =>
                selection
                    .filter((_, index) => index !== 0)
                    .each(function() {
                        d3.select(this)
                            .selectAll("g.bar")
                            .filter(d => d[0] !== d[1])
                            .attr("fill", "#1f78b4")
                            .attr("opacity", 0.9)
                            .each(configureTooltip);
                    })
            );
    }

    const containerRect = container.getBoundingClientRect();
    const tooltipDiv = d3
        .select(container)
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    function configureTooltip() {
        d3.select(this)
            .on("mouseover", () => {
                const barRect = this.getBoundingClientRect();
                const left = barRect.x + barRect.width / 2 - containerRect.x;
                const top = barRect.y - containerRect.y;
                tooltipDiv
                    .style("left", `${left}px`)
                    .style("top", `${top}px`)
                    .html("Tooltip text")
                    .transition()
                    .duration(200)
                    .style("opacity", 0.9);
            })
            .on("mouseout", () => {
                tooltipDiv
                    .transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }

    return multi;
}

export function configureLegend(hasLegend, color, hiddenElements, update) {
    if (!hasLegend) {
        return;
    }

    let legend = d3Legend
        .legendColor()
        .shape("circle")
        .shapeRadius(6)
        .orient("vertical")
        .scale(color)
        .on("cellclick", function(d) {
            toggleElements(d);
            update();
        });

    function toggleElements(elementKey) {
        const index = hiddenElements.findIndex(e => e === elementKey);
        index >= 0 ? hiddenElements.splice(index, 1) : hiddenElements.push(elementKey);
    }

    return legend;
}

export function configureChart(xScale, yScale, multi) {
    let chart = fc
        .chartSvgCartesian(xScale, yScale)
        .yOrient("left")
        .plotArea(multi);

    return chart;
}

export function configureMultiColumnBarSeries(orientation, color, dataset) {
    return fc
        .autoBandwidth(fc.seriesSvgGrouped(fc.seriesSvgBar()))
        .align("left")
        .orient(orientation)
        .crossValue(d => d[0])
        .mainValue(d => d[1])
        .decorate((sel, data, index) => {
            sel.enter()
                .select("path")
                .attr("fill", color(dataset[index].key));
        });
}

export function configureScaleMultiColumn(horizontal, dataset, groupedBarData) {
    const mainExtent = fc
        .extentLinear()
        .accessors([a => a.map(d => d[1])])
        .include([0])
        .pad([0, 1])
        .padUnit("domain");

    const mainScale = d3.scaleLinear().domain(mainExtent(dataset));

    const crossScale = d3
        .scaleBand()
        .domain(groupedBarData.map(entry => entry.crossValue))
        .paddingInner(0.4)
        .paddingOuter(0.2);
    let [xScale, yScale] = horizontal ? [mainScale, crossScale] : [crossScale, mainScale];
    return [xScale, yScale];
}

export function configureMultiSeries(series1, series2) {
    return fc.seriesSvgMulti().series([series1, series2]);
}
