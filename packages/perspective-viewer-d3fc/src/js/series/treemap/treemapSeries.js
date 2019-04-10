/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {preventTextCollisions, centreText} from "./treemapLabel";
import {getGoToParentControls} from "./treemapControls";
import treemapLayout from "../../layout/treemapLayout";

export const textLevel = {
    top: "top",
    mid: "mid",
    lower: "lower"
};

const nodeLevel = {
    leaf: "leafnode",
    branch: "branchnode",
    root: "rootNode"
};

export function treemapSeries() {
    let data = null;
    let color = null;
    let treemapDiv = null;
    let settings = null;

    const _treemapSeries = treemapSvg => {
        const maxDepth = data.height;
        let parent = null;

        const isDeepest = d => d.depth === maxDepth;
        const levelHelper = d => {
            switch (d.depth) {
                case 1:
                    return textLevel.top;
                case 2:
                    return textLevel.mid;
                default:
                    return textLevel.lower;
            }
        };
        const showName = d => maxDepth === 0 || (0 < d.depth && d.depth <= 2);

        const nodes = treemapSvg
            .selectAll("g")
            .data(data.descendants())
            .enter()
            .append("g")
            .attr("transform", d => `translate(${[d.x0, d.y0]})`);

        // draw child nodes first
        nodes.sort((a, b) => (b.depth === 0 ? 0 : b.depth - a.depth));

        nodes
            .append("rect")
            .attr("class", d => `treerect${isDeepest(d) ? ` ${nodeLevel.leaf}` : ` ${nodeLevel.branch}`}`)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => color(d.data.color))
            .on("click", d => transition(d));

        nodes
            .append("text")
            .attr("class", d => levelHelper(d))
            .attr("dx", d => (d.x1 - d.x0) / 2)
            .attr("dy", d => (d.y1 - d.y0) / 2)
            .text(d => (showName(d) ? d.data.name : ""));

        nodes.selectAll("text").each((_, i, nodes) => centreText(nodes[i]));

        preventTextCollisions(nodes);

        const transition = d => {
            if (!d || d.height === 0) return;

            const {width: containerWidth, height: containerHeight} = treemapDiv.node().getBoundingClientRect();

            treemapSvg.selectAll("g").remove();

            let newData = d3.hierarchy(d.data).sum(d => d.size);
            parent = d.parent;
            treemapLayout(containerWidth, containerHeight)(newData);
            newData.parent = d.parent;

            treemapSeries()
                .data(newData)
                .settings(settings)
                .container(treemapDiv)
                .color(color)(treemapSvg);

            getGoToParentControls(treemapDiv)
                .style("display", parent ? "" : "none")
                .select("#goto-parent")
                .html(newData ? newData.data.name : "")
                .on("click", () => {
                    transition(parent);
                });
        };
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

    _treemapSeries.settings = (...args) => {
        if (!args.length) {
            return settings;
        }
        settings = args[0];
        return _treemapSeries;
    };

    return _treemapSeries;
}
