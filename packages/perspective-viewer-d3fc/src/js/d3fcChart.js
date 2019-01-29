/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {configureLegend, configureBarSeries, configureGrid, configureScale, configureMultiSvg, configureChart} from "./chartConfig";
import {interpretLabels, interpretGroupBys, interpretDataset} from "./dataInterpretation";

const nbsp = "\xa0";

export default class D3FCChart {
    constructor(mode, config, container) {
        this._mode = mode;
        this._config = config;
        this._container = container;
        this._hiddenElements = [];
        this.update = this.update.bind(this);
    }

    render(config) {
        console.log("config:", this._config);
        if (config) {
            this._config = config;
        }

        if (this._mode === "x_bar") {
            this.renderBar(this._config, this._container, true, this._hiddenElements, this.update);
        } else if (this._mode === "y_bar") {
            this.renderBar(this._config, this._container, false, this._hiddenElements, this.update);
        } else {
            throw "EXCEPTION: chart type not recognised.";
        }
    }

    update(config) {
        if (this._hiddenElements.length < 1 && config && !areArraysEqual(this._config.col_pivots, config.col_pivots)) {
            this._hiddenElements = [];
        }
        d3.select(this._container)
            .selectAll("*")
            .remove();
        this.render(config);
    }

    renderBar(config, container, horizontal, hiddenElements, update) {
        let orientation = horizontal ? "horizontal" : "vertical";

        let labels = interpretLabels(config);
        let isSplitBy = labels.splitLabel.length !== 0;

        let groupBys = interpretGroupBys(config.xAxis.categories);
        let series = config.series;

        let [dataset, stackedBarData, color] = interpretDataset(isSplitBy, series, groupBys, hiddenElements);

        let legend = configureLegend(isSplitBy, color, hiddenElements, update);
        let barSeries = configureBarSeries(isSplitBy, orientation, dataset);
        let gridlines = configureGrid(horizontal);
        let [xScale, yScale] = configureScale(isSplitBy, horizontal, dataset, stackedBarData);

        // groups of svgs we need to render
        let multi = configureMultiSvg(isSplitBy, gridlines, barSeries, dataset, color);
        let chart = configureChart(xScale, yScale, multi);

        styleChart(chart, horizontal, labels);

        d3.select(container)
            .datum(dataset)
            .call(chart);

        drawLegend(legend, container, hiddenElements);

        removeCanvasElement(container);
        removeAxisGap(container);
        correctAxisClip(container, horizontal);
    }
}

function areArraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}

// DRAW CHART ELEMENTS
function drawLegend(legend, container, hiddenElements) {
    if (legend) {
        d3.select(container)
            .append("svg")
            .attr("class", "legend")
            .style("z-index", "2")
            .call(legend)
            .select("g.legendCells")
            .attr("transform", "translate(20,20)")
            .selectAll("g.cell")
            .classed("hidden", data => hiddenElements.includes(data));
    }
}

function removeCanvasElement(container) {
    // Remove the canvas element; it's empty but blocks direct element selection on the svg viewbox.
    let canvas = container.getElementsByTagName("d3fc-canvas")[0];
    canvas.remove();
}

function removeAxisGap(container) {
    d3.select(container)
        .select(".bottom-axis")
        .style("margin-top", "-5px");
}

function correctAxisClip(container, horizontal) {
    const selection = d3.select(container);
    const axis = horizontal ? selection.select(".bottom-axis svg") : selection.select(".left-axis svg");
    axis.style("overflow", "visible");
}

// STYLE CHART
function styleChart(chart, horizontal, labels) {
    let [crossDecorate, mainDecorate, crossLabel, mainLabel] = horizontal
        ? [chart.yDecorate, chart.xDecorate, chart.yLabel, chart.xLabel]
        : [chart.xDecorate, chart.yDecorate, chart.xLabel, chart.yLabel];

    function translate(perpendicularToAxis, parallelToAxis) {
        return horizontal ? `translate(${parallelToAxis}, ${perpendicularToAxis})` : `translate(${perpendicularToAxis}, ${parallelToAxis})`;
    }

    mainLabel(labels.mainLabel.join(`,${nbsp}`));
    //crossLabel(labels.crossLabel); // not enabled.

    let textDistanceFromXAxis = 9;
    let textDistanceFromYAxis = -18; //TODO: need to make this reactive to text length.
    let distanceFromAxis = horizontal ? textDistanceFromYAxis : textDistanceFromXAxis;

    crossDecorate(selection => {
        let groups = selection._groups[0];
        let parent = selection._parents[0];

        let parentViewBoxVals = parent.attributes.viewBox.value.split(" ");
        let viewBoxDimensions = {
            x: 0,
            y: 1,
            width: 2,
            height: 3
        };

        let totalSpace = horizontal ? parentViewBoxVals[viewBoxDimensions.height] : parentViewBoxVals[viewBoxDimensions.width];
        let tickSpacing = totalSpace / groups.length;

        selection.attr("transform", "translate(0, 0)");
        parent.firstChild.setAttribute("stroke", "rgb(187, 187, 187)"); // turn the axis white // TODO: this is too fragile
        selection.select("text").attr("transform", (x, i) => translate(i * tickSpacing + tickSpacing / 2, distanceFromAxis));
        selection
            .select("path") // select the tick marks
            .attr("stroke", "rgb(187, 187, 187)")
            .attr("transform", (x, i) => translate(i * tickSpacing, 0));

        if (labels.crossLabel.length === 0) {
            selection.select("text").attr("display", "none");
        }
    });

    mainDecorate(selection => {
        let parent = selection._parents[0];

        parent.firstChild.setAttribute("display", "none"); // hide the axis // TODO: this is too fragile.
        selection
            .select("path") // select the tick marks
            .attr("display", "none");
        selection.select("text").attr("fill", "white");
    });

    return;
}
