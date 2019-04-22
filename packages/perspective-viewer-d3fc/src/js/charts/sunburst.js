/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {select} from "d3";
import {treeData} from "../data/treeData";
import {sunburstSeries, treeColor} from "../series/sunburst/sunburstSeries";
import {colorRangeLegend} from "../legend/colorRangeLegend";
import {tooltip} from "../tooltip/tooltip";
import {getOrCreateElement} from "../utils/utils";

function sunburst(container, settings) {
    if (settings.crossValues.length === 0) return;

    const sunburstData = treeData(settings);
    const innerContainer = getOrCreateElement(container, "div.inner-container", () => container.append("div").attr("class", "inner-container"));
    const color = treeColor(settings, sunburstData.map(d => d.extents));

    const innerRect = innerContainer.node().getBoundingClientRect();
    const containerHeight = innerRect.height;
    const containerWidth = innerRect.width - (color ? 70 : 0);
    if (color) {
        const legend = colorRangeLegend().scale(color);
        container.call(legend);
    }

    const minSize = 500;
    const cols = Math.min(sunburstData.length, Math.floor(containerWidth / minSize));
    const rows = Math.ceil(sunburstData.length / cols);
    const containerSize = {
        width: containerWidth / cols,
        height: Math.min(containerHeight, Math.max(containerHeight / rows, containerWidth / cols))
    };
    if (containerHeight / rows > containerSize.height * 0.75) {
        containerSize.height = containerHeight / rows;
    }

    innerContainer.style("grid-template-columns", `repeat(${cols}, ${containerSize.width}px)`);
    innerContainer.style("grid-template-rows", `repeat(${rows}, ${containerSize.height}px)`);

    const sunburstDiv = innerContainer.selectAll("div.sunburst-container").data(treeData(settings), d => d.split);
    sunburstDiv.exit().remove();

    const sunburstEnter = sunburstDiv
        .enter()
        .append("div")
        .attr("class", "sunburst-container");

    const sunburstContainer = sunburstEnter
        .append("svg")
        .append("g")
        .attr("class", "sunburst");

    sunburstContainer.append("text").attr("class", "title");

    sunburstContainer
        .append("circle")
        .attr("fill", "none")
        .attr("pointer-events", "all");

    sunburstContainer.append("text").attr("class", "parent");
    sunburstEnter
        .merge(sunburstDiv)
        .select("svg")
        .select("g.sunburst")
        .attr("transform", `translate(${containerSize.width / 2}, ${containerSize.height / 2})`)
        .each(function({split, data}) {
            const sunburstElement = select(this);
            const svgNode = this.parentNode;
            const {width, height} = svgNode.getBoundingClientRect();

            const title = sunburstElement.select("text.title").text(split);
            title.attr("transform", `translate(0, ${-(height / 2 - 5)})`);

            const radius = (Math.min(width, height) - 120) / 6;
            sunburstSeries()
                .settings(settings)
                .split(split)
                .data(data)
                .color(color)
                .radius(radius)(sunburstElement);

            tooltip().settings(settings)(sunburstElement.selectAll("g.segment"));
        });
}
sunburst.plugin = {
    type: "d3_sunburst",
    name: "Sunburst",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2,
        names: ["Size", "Color"]
    }
};

export default sunburst;
