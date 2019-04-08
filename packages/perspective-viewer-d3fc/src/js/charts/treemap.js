/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {treeData} from "../data/treeData";
import {treeColor} from "../series/treemap/treemapColor";
import treemapLayout from "../layout/treemapLayout";
import {colorRangeLegend} from "../legend/colorRangeLegend";
import {treemapSeries} from "../series/treemap/treemapSeries";
import {tooltip} from "../tooltip/tooltip";
import {getOrCreateElement} from "../utils/utils";

function treemap(container, settings) {
    //if (settings.crossValues.length === 0) return;

    const treemapData = treeData(settings);
    const innerContainer = getOrCreateElement(container, "div.inner-container", () => container.append("div").attr("class", "inner-container"));
    const color = treeColor(treemapData.map(d => d.data), settings);

    const innerRect = innerContainer.node().getBoundingClientRect();
    const containerHeight = innerRect.height;
    const containerWidth = innerRect.width - (color ? 70 : 0);
    if (color) {
        const legend = colorRangeLegend().scale(color);
        container.call(legend);
    }

    const minSize = 500;
    const cols = Math.min(treemapData.length, Math.floor(containerWidth / minSize));
    const rows = Math.ceil(treemapData.length / cols);
    const containerSize = {
        width: containerWidth / cols,
        height: Math.min(containerHeight, Math.max(containerHeight / rows, containerWidth / cols))
    };
    if (containerHeight / rows > containerSize.height * 0.75) {
        containerSize.height = containerHeight / rows;
    }

    innerContainer.style("grid-template-columns", `repeat(${cols}, ${containerSize.width}px)`);
    innerContainer.style("grid-template-rows", `repeat(${rows}, ${containerSize.height}px)`);

    const treemapDiv = innerContainer.selectAll("div.treemap-container").data(treeData(settings), d => d.split);
    treemapDiv.exit().remove();

    const treemapEnter = treemapDiv
        .enter()
        .append("div")
        .attr("class", "treemap-container");

    const treemapContainer = treemapEnter
        .append("svg")
        .append("g")
        .attr("class", "treemap");

    treemapContainer.append("text").attr("class", "title");

    treemapContainer.append("text").attr("class", "parent");
    treemapEnter
        .merge(treemapDiv)
        .select("svg")
        .select("g.treemap")
        .each(function({split, data}) {
            const treemapElement = d3.select(this);
            const svgNode = this.parentNode;
            const {width, height} = svgNode.getBoundingClientRect();

            treemapLayout(width, height)(data);

            const title = treemapElement.select("text.title").text(split);
            title.attr("transform", `translate(0, ${-(height / 2 - 5)})`);

            treemapSeries()
                .data(data)
                .container(d3.select(d3.select(this.parentNode).node().parentNode))
                .color(color)(treemapElement);

            tooltip().settings(settings)(treemapElement.selectAll("g"));
        });
}

treemap.plugin = {
    type: "d3_treemap",
    name: "[D3] Treemap",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2
    }
};
export default treemap;
