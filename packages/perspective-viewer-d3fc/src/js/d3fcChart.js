/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {
    configureLegend,
    configureBarSeries,
    configureGrid,
    configureScale,
    configureMultiSvg,
    configureChart,
    configureMultiColumnBarSeries,
    configureScaleMultiColumn,
    configureMultiSeries
} from "./chartConfig";
import {interpretLabels, interpretGroupBys, interpretDataset, interpretColor, interpretMultiColumnDataset, interpretIsMultiColumn} from "./dataInterpretation";
import {styleChart} from "./styling/chartStyling";

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
        const isMultiColumn = interpretIsMultiColumn(config);

        let series = config.series;
        let groupBys = interpretGroupBys(config.xAxis.categories, series);

        const color = interpretColor(config);
        let dataset = interpretDataset(isSplitBy, series, labels.crossLabel, groupBys, hiddenElements);

        let legend = configureLegend(config.legend.enabled, color, hiddenElements, update);
        let barSeries = configureBarSeries(isSplitBy, orientation, dataset, groupBys);
        let gridlines = configureGrid(horizontal);
        let [xScale, yScale] = configureScale(isSplitBy, horizontal, dataset, groupBys);
        // groups of svgs we need to render
        let multi = configureMultiSvg(isSplitBy, gridlines, barSeries, dataset, color, container, labels.crossLabel, labels.splitLabel, labels.mainLabel[0]);
        let groupedBarData;

        if (isMultiColumn) {
            [dataset, groupedBarData] = interpretMultiColumnDataset(config, hiddenElements);
            barSeries = configureMultiColumnBarSeries(orientation, color, dataset);
            [xScale, yScale] = configureScaleMultiColumn(horizontal, dataset, groupedBarData);
            multi = configureMultiSeries(gridlines, barSeries);
        }

        let chart = configureChart(xScale, yScale, multi);

        styleChart(chart, horizontal, labels, dataset);

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
    // Only remove if not Edge
    if (!window.StyleMedia) {
        d3.select(container)
            .select(".bottom-axis")
            .style("margin-top", "-5px");
    }
}

function correctAxisClip(container, horizontal) {
    const selection = d3.select(container);
    const axis = horizontal ? selection.select(".bottom-axis svg") : selection.select(".left-axis svg");
    axis.style("overflow", "visible");
}
