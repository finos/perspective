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

function treeColor(settings, data) {
    if (settings.mainValues.length > 1) {
        const colors = getColors(data);
        const min = Math.min(...colors);
        const max = Math.max(...colors);
        return d3.scaleSequential(d3.interpolateViridis).domain([min, max]);
    }

    return () => "rgb(31, 119, 180)";
}

const addTreemap = (selection, data, settings) => {
    console.log("data", data);
    const color = treeColor(settings, data);

    const isDeepest = d => d.depth === settings.crossValues.length;

    const nodes = selection
        .select("svg g")
        .selectAll("g")
        .data(data.descendants())
        .enter()
        .append("g")
        .attr("transform", d => `translate(${[d.x0, d.y0]})`);

    nodes
        .append("rect")
        .attr("class", "treerect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => color(d.data.color))
        .attr("fill-opacity", d => (isDeepest(d) ? 0.8 : 0));

    nodes
        .append("text")
        .attr("class", d => (d.depth === 1 ? "top" : "lower"))
        .attr("dx", d => (d.x1 - d.x0) / 2)
        .attr("dy", d => (d.y1 - d.y0) / 2)
        .text(d => (0 < d.depth && d.depth <= 2 ? d.data.name : ""));
};

function treemap(container, settings) {
    const padder = d => {
        return settings.crossValues.length - d.depth;
    };

    const padding = 30;
    const {width: containerWidth, height: containerHeight} = container.node().getBoundingClientRect();

    const {data} = treeData(settings)[0];

    const treemapLayout = d3
        .treemap()
        .size([containerWidth - padding, containerHeight - padding])
        .paddingInner(d => padder(d));

    treemapLayout.tile(d3.treemapBinary);
    treemapLayout(data);

    container
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .append("g");

    addTreemap(container, data, settings);
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
