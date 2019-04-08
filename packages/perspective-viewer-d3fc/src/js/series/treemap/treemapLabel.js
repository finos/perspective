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

export const centreText = node => select(node).attr("dx", select(node).attr("dx") - node.getBoundingClientRect().width / 2);

export const preventTextCollisions = nodes => {
    const textCollisionFuzzFactorPx = -2;
    const textAdjustPx = 16;
    const rect = element => element.getBoundingClientRect();

    const topNodes = [];
    nodes
        .selectAll("text")
        .filter((_, i, nodes) => select(nodes[i]).attr("class") === "top")
        .each((_, i, nodes) => topNodes.push(nodes[i]));

    nodes
        .selectAll("text")
        .filter((_, i, nodes) => select(nodes[i]).attr("class") === "lower" && select(nodes[i]).text() !== "")
        .each((_, i, nodes) => {
            const lowerNode = nodes[i];
            topNodes
                .filter(topNode => isElementOverlapping("x", rect(topNode), rect(lowerNode)) && isElementOverlapping("y", rect(topNode), rect(lowerNode), textCollisionFuzzFactorPx))
                .forEach(() => select(lowerNode).attr("dy", Number(select(lowerNode).attr("dy")) + textAdjustPx));
        });
};
