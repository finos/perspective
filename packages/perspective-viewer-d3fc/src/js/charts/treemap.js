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
import {getOrCreateElement, isElementOverlapping} from "../utils/utils";
import treemapLayout from "../layout/treemapLayout";
import template from "../../html/parent-controls.html";
import {colorRangeLegend} from "../legend/colorRangeLegend";
import {seriesColorRange} from "../series/seriesRange";

function treemap(container, settings) {
    const {data} = treeData(settings)[0];
    const {width: containerWidth, height: containerHeight} = container.node().getBoundingClientRect();

    treemapLayout(containerWidth, containerHeight)(data);

    container
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .append("g");

    const color = treeColor(data, settings);

    addTreemap(container, data, settings, color);

    const legend = colorRangeLegend().scale(color);
    container.call(legend);
}

const addTreemap = (selection, data, settings, color) => {
    const maxDepth = data.height;
    let parent = null;

    const isDeepest = d => d.depth === maxDepth;
    const isTop = d => d.depth === 1;
    const showName = d => maxDepth === 0 || (0 < d.depth && d.depth <= 2);
    const centreText = node => d3.select(node).attr("dx", d3.select(node).attr("dx") - node.getBoundingClientRect().width / 2);

    const nodes = selection
        .select("svg g")
        .selectAll("g")
        .data(data.descendants())
        .enter()
        .append("g")
        .attr("transform", d => `translate(${[d.x0, d.y0]})`);

    // draw child nodes first
    nodes.sort((a, b) => (b.depth === 0 ? 0 : b.depth - a.depth));

    nodes
        .append("rect")
        .attr("class", "treerect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => color(d.data.color))
        .attr("fill-opacity", d => (isDeepest(d) ? 0.8 : 0))
        .on("click", d => transition(d));

    nodes
        .append("text")
        .attr("class", d => (isTop(d) ? "top" : "lower"))
        .attr("dx", d => (d.x1 - d.x0) / 2)
        .attr("dy", d => (d.y1 - d.y0) / 2)
        .text(d => (showName(d) ? d.data.name : ""));

    nodes.selectAll("text").each((_, i, nodes) => centreText(nodes[i]));

    preventTextCollisions(nodes);

    const transition = d => {
        if (!d || d.height === 0) return;

        selection
            .select("svg g")
            .selectAll("g")
            .remove();

        let newData = d3.hierarchy(d.data).sum(d => d.size);

        parent = d.parent;

        const {width: containerWidth, height: containerHeight} = selection.node().getBoundingClientRect();

        treemapLayout(containerWidth, containerHeight)(newData);
        newData.parent = d.parent;

        addTreemap(selection, newData, settings, color);

        getGoToParentControls(selection)
            .style("display", parent ? "" : "none")
            .select("#goto-parent")
            .html(newData ? newData.data.name : "")
            .on("click", () => {
                transition(parent);
            });
    };
};

const preventTextCollisions = nodes => {
    const textCollisionFuzzFactor = 16;
    const rect = element => element.getBoundingClientRect();

    const topNodes = [];
    nodes
        .selectAll("text")
        .filter((_, i, nodes) => d3.select(nodes[i]).attr("class") === "top")
        .each((_, i, nodes) => topNodes.push(nodes[i]));

    nodes
        .selectAll("text")
        .filter((_, i, nodes) => d3.select(nodes[i]).attr("class") === "lower" && d3.select(nodes[i]).text() !== "")
        .each((_, i, nodes) => {
            const lowerNode = nodes[i];
            topNodes
                .filter(topNode => isElementOverlapping("x", rect(topNode), rect(lowerNode)) && isElementOverlapping("y", rect(topNode), rect(lowerNode), textCollisionFuzzFactor))
                .forEach(() => d3.select(lowerNode).attr("dy", Number(d3.select(lowerNode).attr("dy")) + textCollisionFuzzFactor));
        });
};

function treeColor(data, settings) {
    if (data.height > 0) {
        const colors = getColors(data);
        let min = Math.min(...colors);
        let max = Math.max(...colors);
        return seriesColorRange(settings, null, null, [min, max]);
    }
}

// only get the colors from the bottom level (e.g. nodes with no children)
function getColors(nodes, colors = []) {
    nodes.children && nodes.children.length > 0 ? nodes.children.forEach(child => colors.concat(getColors(child, colors))) : colors.push(nodes.data.color);
    return colors;
}

const getGoToParentControls = container =>
    getOrCreateElement(container, ".parent-controls", () =>
        container
            .append("div")
            .attr("class", "parent-controls")
            .style("display", "none")
            .html(template)
    );

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
