/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {treeData, treeColor} from "../data/treeData";

const base_font_size = 12;

const addTreemap = (selection, data, settings) => {
    const adjustFontSize = d => {
        return `${base_font_size + 2 * settings.row_pivots.length - 2 * d.depth}px`;
    };

    const nodes = selection
        .select("svg g")
        .selectAll("g")
        .data(data.descendants())
        .enter()
        .append("g")
        .attr("transform", function(d) {
            return `translate(${[d.x0, d.y0]})`;
        });

    nodes
        .append("rect")
        .attr("class", "treerect")
        .attr("width", function(d) {
            return d.x1 - d.x0;
        })
        .attr("height", function(d) {
            return d.y1 - d.y0;
        });

    nodes
        .append("text")
        .attr("dx", function(d) {
            return (d.x1 - d.x0) / 2;
        })
        .attr("dy", function(d) {
            return (d.y1 - d.y0) / 2;
        })
        .attr("font-size", function(d) {
            return adjustFontSize(d);
        })
        .text(function(d) {
            return d.depth > 0 ? d.data.name : "";
        });
};

function treemap(container, settings) {
    //console.log("settings", settings);
    const padder = d => {
        return settings.row_pivots.length - d.depth;
    };

    const {width: containerWidth, height: containerHeight} = container.node().getBoundingClientRect();
    const padding = 30;
    const selectedContainer = d3.select(container);
    const data = treeData(settings)[0].data.data;

    console.log("data", data);
    console.log("selectedContainer", selectedContainer);

    var treemapLayout = d3
        .treemap()
        .size([containerWidth - padding, containerHeight - padding])
        .paddingInner(d => padder(d));
    //.paddingOuter(16);

    treemapLayout.tile(d3.treemapBinary);
    treemapLayout(data);

    selectedContainer
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .append("g");

    addTreemap(selectedContainer, data, settings);
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
