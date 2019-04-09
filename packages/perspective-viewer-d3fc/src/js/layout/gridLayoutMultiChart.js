/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {treeData} from "../data/treeData";
import {colorRangeLegend} from "../legend/colorRangeLegend";
import {getOrCreateElement} from "../utils/utils";

export function gridLayoutMultiChart() {
    let treeColor = null;
    let treeColorDataMap = null;
    let elementsPrefix = "element-prefix-unset";

    let contentToRender = true;
    let chartContainer = null;
    let chartEnter = null;
    let chartDiv = null;
    let color = null;
    let containerSize = null;

    const _gridLayoutMultiChart = (settings, container) => {
        if (settings.crossValues.length === 0) {
            contentToRender = false;
            console.warn("Unable to render a chart in the absence of any groups.");
            return;
        }

        const data = treeData(settings);
        const innerContainer = getOrCreateElement(container, "div.inner-container", () => container.append("div").attr("class", "inner-container"));
        color = treeColor(settings, data.map(treeColorDataMap));

        const innerRect = innerContainer.node().getBoundingClientRect();
        const containerHeight = innerRect.height;
        const containerWidth = innerRect.width - (color ? 70 : 0);
        if (color) {
            const legend = colorRangeLegend().scale(color);
            container.call(legend);
        }

        const minSize = 500;
        const cols = Math.min(data.length, Math.floor(containerWidth / minSize));
        const rows = Math.ceil(data.length / cols);
        containerSize = {
            width: containerWidth / cols,
            height: Math.min(containerHeight, Math.max(containerHeight / rows, containerWidth / cols))
        };
        if (containerHeight / rows > containerSize.height * 0.75) {
            containerSize.height = containerHeight / rows;
        }

        innerContainer.style("grid-template-columns", `repeat(${cols}, ${containerSize.width}px)`);
        innerContainer.style("grid-template-rows", `repeat(${rows}, ${containerSize.height}px)`);

        chartDiv = innerContainer.selectAll(`div.${elementsPrefix}-container`).data(treeData(settings), d => d.split);
        chartDiv.exit().remove();

        chartEnter = chartDiv
            .enter()
            .append("div")
            .attr("class", `${elementsPrefix}-container`);

        chartContainer = chartEnter
            .append("svg")
            .append("g")
            .attr("class", elementsPrefix);

        chartContainer.append("text").attr("class", "title");
    };

    _gridLayoutMultiChart.elementsPrefix = (...args) => {
        if (!args.length) {
            return elementsPrefix;
        }
        elementsPrefix = args[0];
        return _gridLayoutMultiChart;
    };

    _gridLayoutMultiChart.treeColor = (...args) => {
        if (!args.length) {
            return treeColor;
        }
        treeColor = args[0];
        return _gridLayoutMultiChart;
    };

    _gridLayoutMultiChart.treeColorDataMap = (...args) => {
        if (!args.length) {
            return treeColorDataMap;
        }
        treeColorDataMap = args[0];
        return _gridLayoutMultiChart;
    };

    _gridLayoutMultiChart.chartContainer = () => chartContainer;

    _gridLayoutMultiChart.chartEnter = () => chartEnter;

    _gridLayoutMultiChart.chartDiv = () => chartDiv;

    _gridLayoutMultiChart.containerSize = () => containerSize;

    _gridLayoutMultiChart.color = () => color;

    _gridLayoutMultiChart.contentToRender = () => contentToRender;

    return _gridLayoutMultiChart;
}
