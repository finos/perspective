/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {select} from "d3";
import {isElementOverlapping} from "../../utils/utils";
import {calcWidth, calcHeight} from "./treemapSeries";

export const drawLabels = (nodes, treemapLevel, crossValues) => {
    nodes
        .selectAll("text")
        .attr("x", d => d.x0 + calcWidth(d) / 2)
        .attr("y", d => d.y0 + calcHeight(d) / 2)
        .attr("class", d => textLevelHelper(d, treemapLevel, crossValues));
    nodes.selectAll("text").each((_, i, nodes) => centerText(nodes[i]));
    preventTextCollisions(nodes);
};

export const toggleLabels = (nodes, treemapLevel, crossValues) => {
    nodes.selectAll("text").attr("class", d => textLevelHelper(d, treemapLevel, crossValues));
    preventTextCollisions(nodes);
};

export const preventTextCollisions = nodes => {
    const textCollisionFuzzFactorPx = -2;
    const textAdjustPx = 16;
    const rect = element => element.getBoundingClientRect();

    const topNodes = [];
    nodes
        .selectAll("text")
        .filter((_, i, nodes) => select(nodes[i]).attr("class") === textVisability.high)
        .each((_, i, nodes) => topNodes.push(nodes[i]));

    nodes
        .selectAll("text")
        .filter((_, i, nodes) => select(nodes[i]).attr("class") === textVisability.low)
        .each((_, i, nodes) => {
            const lowerNode = nodes[i];
            topNodes
                .filter(topNode => isElementOverlapping("x", rect(topNode), rect(lowerNode)) && isElementOverlapping("y", rect(topNode), rect(lowerNode), textCollisionFuzzFactorPx))
                .forEach(() => select(lowerNode).attr("dy", Number(select(lowerNode).attr("dy")) + textAdjustPx));
        });
};

export const centerText = node => select(node).attr("dx", select(node).attr("dx") - node.getBoundingClientRect().width / 2);

const textLevelHelper = (d, treemapLevel, crossValues) => {
    if (!crossValues.filter(x => x !== "").every(x => d.crossValue.split("|").includes(x))) return textVisability.zero;
    switch (d.depth) {
        case treemapLevel + 1:
            return textVisability.high;
        case treemapLevel + 2:
            return textVisability.low;
        default:
            return textVisability.zero;
    }
};

const textVisability = {
    high: "top",
    low: "mid",
    zero: "lower"
};
