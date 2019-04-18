/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {drawLabels} from "./treemapLabel";
import treemapLayout from "./treemapLayout";
import {changeLevel} from "./treemapClick";

export const nodeLevel = {leaf: "leafnode", branch: "branchnode", root: "rootnode"};
export const calcWidth = d => d.x1 - d.x0;
export const calcHeight = d => d.y1 - d.y0;
const isLeafNode = (maxDepth, d) => d.depth === maxDepth;
const nodeLevelHelper = (maxDepth, d) => (d.depth === 0 ? nodeLevel.root : isLeafNode(maxDepth, d) ? nodeLevel.leaf : nodeLevel.branch);

export function treemapSeries() {
    let settings = null;
    let split = null;
    let data = null;
    let color = null;
    let treemapDiv = null;

    const _treemapSeries = treemapSvg => {
        const maxDepth = data.height;
        settings.treemapLevel = 0;
        const treemap = treemapLayout(treemapDiv.node().getBoundingClientRect().width, treemapDiv.node().getBoundingClientRect().height);
        treemap(data);

        // Draw child nodes first
        const nodes = treemapSvg
            .selectAll("g")
            .data(data.descendants())
            .enter()
            .append("g")
            .sort((a, b) => b.depth - a.depth);

        nodes.append("rect");
        nodes.append("text");

        const nodesMerge = nodes.merge(nodes);

        const rects = nodesMerge
            .select("rect")
            .attr("class", d => `treerect ${nodeLevelHelper(maxDepth, d)}`)
            .style("x", d => d.x0)
            .style("y", d => d.y0)
            .style("width", d => calcWidth(d))
            .style("height", d => calcHeight(d))
            .style("fill", d => color(d.data.color));

        const labels = nodesMerge
            .select("text")
            .attr("x", d => d.x0 + calcWidth(d) / 2)
            .attr("y", d => d.y0 + calcHeight(d) / 2)
            .text(d => d.data.name);

        drawLabels(nodesMerge, settings.treemapLevel, []);

        nodesMerge.each(d => {
            d.mapLevel = [];
            d.mapLevel[settings.treemapLevel] = {
                x0: d.x0,
                x1: calcWidth(d) + d.x0,
                y0: d.y0,
                y1: calcHeight(d) + d.y0,
                visible: true,
                opacity: 1
            };
        });

        const rootNode = rects.filter(d => d.crossValue === "").datum();
        rects.filter(d => d.children).on("click", d => changeLevel(d, rects, nodesMerge, labels, settings, treemapDiv, treemapSvg, rootNode));
    };

    _treemapSeries.settings = (...args) => {
        if (!args.length) {
            return settings;
        }
        settings = args[0];
        return _treemapSeries;
    };

    _treemapSeries.split = (...args) => {
        if (!args.length) {
            return split;
        }
        split = args[0];
        return _treemapSeries;
    };

    _treemapSeries.data = (...args) => {
        if (!args.length) {
            return data;
        }
        data = args[0];
        return _treemapSeries;
    };

    _treemapSeries.color = (...args) => {
        if (!args.length) {
            return color;
        }
        color = args[0];
        return _treemapSeries;
    };

    _treemapSeries.container = (...args) => {
        if (!args.length) {
            return treemapDiv;
        }
        treemapDiv = args[0];
        return _treemapSeries;
    };

    return _treemapSeries;
}
