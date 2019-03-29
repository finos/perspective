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
import {getOrCreateElement} from "../utils/utils";
import treemapLayout from "../layout/treemapLayout";
import template from "../../html/parent-controls.html";

function getColors(nodes, colors = []) {
    if (nodes.children && nodes.children.length > 0) {
        nodes.children.forEach(child => {
            colors.concat(getColors(child, colors));
        });
    } else {
        colors.push(nodes.data.color);
    }
    return colors;
}

function treeColor(data, maxDepth) {
    if (maxDepth > 0) {
        const colors = getColors(data);
        const min = Math.min(...colors);
        const max = Math.max(...colors);
        return d3.scaleSequential(d3.interpolateViridis).domain([min, max]);
    }

    return () => "rgb(31, 119, 180)";
}

const addTreemap = (selection, data, settings) => {
    const maxDepth = data.height;
    const color = treeColor(data, maxDepth);
    let parent = null;

    const isDeepest = d => d.depth === maxDepth;
    const isTop = d => d.depth === 1;
    const showName = d => maxDepth === 0 || (0 < d.depth && d.depth <= 2);

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
        .on("click", d => {
            transition(d);
        });

    nodes
        .append("text")
        .attr("class", d => (isTop(d) ? "top" : "lower"))
        .attr("dx", d => (d.x1 - d.x0) / 2)
        .attr("dy", d => (d.y1 - d.y0) / 2)
        .text(d => (showName(d) ? d.data.name : ""));

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

        addTreemap(selection, newData, settings);

        getGoToParentControls(selection)
            .style("display", parent ? "" : "none")
            .select("#goto-parent")
            .html(newData ? newData.data.name : "")
            .on("click", () => {
                transition(parent);
            });
    };
};

function treemap(container, settings) {
    const {width: containerWidth, height: containerHeight} = container.node().getBoundingClientRect();

    const {data} = treeData(settings)[0];

    treemapLayout(containerWidth, containerHeight)(data);

    container
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .append("g");

    addTreemap(container, data, settings);
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
