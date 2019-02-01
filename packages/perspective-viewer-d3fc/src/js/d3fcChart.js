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

const LABEL_TICK_PADDING = 2;
const STANDARD_TICK_LENGTH = 9; // 9 // TODO: make this 16 - that is right but hard to analyse for now as it exceeds my working area.

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

// STYLE CHART
function styleChart(chart, horizontal, labels, dataset) {
    let [crossDecorate, mainDecorate, crossLabel, mainLabel] = horizontal
        ? [chart.yDecorate, chart.xDecorate, chart.yLabel, chart.xLabel]
        : [chart.xDecorate, chart.yDecorate, chart.xLabel, chart.yLabel];

    function translate(perpendicularToAxis, parallelToAxis) {
        return horizontal ? `translate(${parallelToAxis}, ${perpendicularToAxis})` : `translate(${perpendicularToAxis}, ${parallelToAxis})`;
    }

    mainLabel(labels.mainLabel.join(`,${nbsp}`));
    //crossLabel(labels.crossLabel); // not enabled.

    let textDistanceFromXAxis = STANDARD_TICK_LENGTH + LABEL_TICK_PADDING; // TODO: make this standard vertical tick length, or make it somehow calculated.
    let textDistanceFromYAxis = -18; //TODO: need to make this reactive to text length.
    let distanceFromAxis = horizontal ? textDistanceFromYAxis : textDistanceFromXAxis;

    crossDecorate(selection => {
        console.log("selection: ", selection);
        console.log("labels: ", labels);

        let crossAxisMap = new CrossAxisMap(labels.crossLabel, dataset);

        let groups = selection._groups[0];
        let parent = selection._parents[0];

        let parentViewBoxVals = parent.attributes.viewBox.value.split(" ");
        let viewBoxDimensionMappings = {x: 0, y: 1, width: 2, height: 3};

        let totalSpace = horizontal ? parentViewBoxVals[viewBoxDimensionMappings.height] : parentViewBoxVals[viewBoxDimensionMappings.width];
        let tickSpacing = totalSpace / groups.length;
        let standardTickLength = STANDARD_TICK_LENGTH; // TODO: make this 16 - that is right but hard to analyse for now as it exceeds my working area.

        selection.attr("transform", "translate(0, 0)");
        parent.firstChild.setAttribute("stroke", "rgb(187, 187, 187)"); // turn the axis white // TODO: this is too fragile
        selection
            .select("text")
            .attr("transform", (_, i) => translate(i * tickSpacing + tickSpacing / 2, distanceFromAxis))
            .text(content => returnOnlyMostSubdividedGroup(content));
        selection
            .select("path") // select the tick marks
            .attr("stroke", "rgb(187, 187, 187)")
            .attr("d", (x, i) => `M0,0L0,${tickLength(standardTickLength, i, crossAxisMap)}`)
            .attr("transform", (x, i) => translate(i * tickSpacing, 0));

        if (labels.crossLabel.length === 0) {
            selection.select("text").attr("display", "none");
        }

        crossAxisMap.calculateLabelPositions(groups);
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

function tickLength(oneStandardTickLength, tickIndex, tickLengthMap) {
    const multiplier = oneStandardTickLength;

    // ticks are shorter in the case where we're not dubdividing by groups.
    if (tickLengthMap.length <= 1) {
        return multiplier / 2;
    }

    let depth = 1;
    tickLengthMap.map.forEach(level => {
        if (level.nodeWithTick(tickIndex).ticks[0] === tickIndex) {
            depth++;
        }
    });

    return depth * multiplier;
}

function returnOnlyMostSubdividedGroup(content) {
    if (!Array.isArray(content)) {
        return content;
    }
    let lastElement = content[content.length - 1];
    return lastElement;
}

// TODO: only handles horizontal for now
function drawLabelOnTick(tickIndex, tickList, labelText, labelDepth) {
    let tickElement = tickList[tickIndex];
    let tickStroke = tickElement.firstChild;
    let [horizontalOffset, verticalOffset] = calculateLabelOffsets(tickStroke, labelDepth);
    cloneThenModifyLabel(tickElement, horizontalOffset, verticalOffset, labelText);
}

function drawLabelInSpaceBesideTick(tickIndex, tickList, labelText, labelDepth) {
    let tickElement = tickList[tickIndex];
    let tickBaseText = tickElement.childNodes[1];
    let [horizontalOffset, verticalOffset] = calculateLabelOffsets(tickBaseText, labelDepth);
    cloneThenModifyLabel(tickElement, horizontalOffset, verticalOffset, labelText);
}

function calculateLabelOffsets(baseElement, labelDepth) {
    let baseElementTransform = baseElement.attributes.transform.value;

    let horizontalOffset = baseElementTransform.substring(baseElementTransform.lastIndexOf("(") + 1, baseElementTransform.lastIndexOf(","));
    let verticalDepthMultiplied = STANDARD_TICK_LENGTH * labelDepth; // TODO: this constant is not super cool.
    let verticalOffset = verticalDepthMultiplied + LABEL_TICK_PADDING;

    return [horizontalOffset, verticalOffset];
}

function cloneThenModifyLabel(tickElement, horizontalOffset, verticalOffset, labelText) {
    let clone = tickElement.childNodes[1].cloneNode(true);
    clone.setAttribute("transform", `translate(${horizontalOffset}, ${verticalOffset})`);
    clone.textContent = labelText;
    tickElement.appendChild(clone);
}

class CrossAxisMap {
    constructor(crossLabels, dataset) {
        this._map = this.generateMap(crossLabels, dataset);
    }

    get map() {
        return this._map;
    }

    generateMap(crossLabels, dataset) {
        // If the level beneath has a tick, the level above must necessarily also extend its tick.
        let levelMap = [];

        for (let levelIndex = 0; levelIndex < crossLabels.length; levelIndex++) {
            let parentLevel = levelIndex === 0 ? null : levelMap[levelIndex - 1];
            let level = new Level(crossLabels[levelIndex], parentLevel, levelIndex);

            let workingNode;
            dataset.forEach((dataPoint, dpIndex) => {
                let dpLevelVal = dataPoint.crossValue[levelIndex];
                if (dpIndex === 0) {
                    let parentNode = levelIndex === 0 ? null : parentLevel.nodes[0];
                    workingNode = new LevelNode(dpLevelVal, parentNode, levelIndex);
                    workingNode.addTick(dpIndex);
                    return;
                }

                if (workingNode.name === dpLevelVal) {
                    if (workingNode.canShareParentage(dpIndex)) {
                        workingNode.addTick(dpIndex);
                        return;
                    }
                }

                level.addNode(workingNode);
                let parentNode = levelIndex === 0 ? null : parentLevel.nodeWithTick(dpIndex);
                workingNode = new LevelNode(dpLevelVal, parentNode, levelIndex);
                workingNode.addTick(dpIndex);
                return;
            });

            level.addNode(workingNode);
            levelMap.push(level);
        }

        console.log("levelMap: ", levelMap);
        return levelMap;
    }

    calculateLabelPositions(tickList) {
        this._map.forEach(level => level.nodes.forEach(node => node.calculateLabelPosition(tickList, this._map.length)));
    }
}

class Level {
    constructor(name, parentLevel, levelIndex) {
        this._name = name;
        this._parentLevel = parentLevel;
        this._levelIndex = levelIndex;
        this._levelNodes = [];
    }

    get name() {
        return this._name;
    }

    get nodes() {
        return this._levelNodes;
    }

    get parentLevel() {
        return this._parentLevel;
    }

    get levelIndex() {
        return this._levelIndex;
    }

    isTopLevel() {
        return this._parentLevel === null;
    }

    addNode(node) {
        this._levelNodes.push(node);
    }

    nodeWithTick(tickIndex) {
        return this._levelNodes.filter(node => node.nodeContainsTick(tickIndex))[0];
    }
}

class LevelNode {
    constructor(name, parentNode, levelIndex) {
        this._name = name;
        this._parentNode = parentNode;
        this._levelIndex = levelIndex;
        this._ticks = [];
    }

    get name() {
        return this._name;
    }

    get parentNode() {
        return this._parentNode;
    }

    get ticks() {
        return this._ticks;
    }

    isTopLevel() {
        return this._parentNode === null;
    }

    addTick(tickIndex) {
        this._ticks.push(tickIndex);
    }

    nodeContainsTick(tickIndex) {
        return this._ticks.includes(tickIndex);
    }

    canShareParentage(proposedChildTickIndex) {
        return this.isTopLevel() || this._parentNode.nodeContainsTick(proposedChildTickIndex);
    }

    // TODO: rename this - it doesn't just calc, it also draws. Is the responsibility misplaced?
    calculateLabelPosition(tickList, totalLevels) {
        let middleTickIndex = Math.round((this._ticks.length + 1) / 2) - 1;
        let middleTick = this._ticks[middleTickIndex];

        if (this._levelIndex === totalLevels - 1) {
            return;
        }

        let levelDepth = totalLevels - this._levelIndex;

        // eslint-disable-next-line prettier/prettier
        return this._ticks.length % 2 !== 1
            ? drawLabelOnTick(middleTick, tickList, this._name, levelDepth)
            : drawLabelInSpaceBesideTick(middleTick, tickList, this._name, levelDepth);
    }
}
