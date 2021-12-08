/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {select} from "d3";
import {isElementOverlapping, isElementOverflowing} from "../../utils/utils";

const minTextSize = 7;

export const labelMapExists = (d) =>
    d.target && d.target.textAttributes ? true : false;

export const toggleLabels = (nodes, treemapLevel, crossValues) => {
    nodes
        .selectAll("text")
        .style("font-size", null)
        .attr("class", (d) => textLevelHelper(d, treemapLevel, crossValues));

    const visibleNodes = selectVisibleNodes(nodes);
    centerLabels(visibleNodes);
    preventTextCollisions(visibleNodes);
};

export const restoreLabels = (nodes) => {
    nodes.each((d, i, nodes) => {
        const label = select(nodes[i]).selectAll("text");
        label
            .attr("dx", d.target.textAttributes.dx)
            .attr("dy", d.target.textAttributes.dy)
            .attr("class", d.target.textAttributes.class)
            .style("font-size", d.target.textAttributes["font-size"]);
    });
};

export const preventTextCollisions = (nodes) => {
    const textCollisionFuzzFactorPx = -2;
    const textAdjustPx = 14; // This should remain the same as the css value for .top => font-size in the chart.less
    const rect = (element) => element.getBoundingClientRect();

    const topNodes = [];
    nodes
        .selectAll("text")
        .filter(
            (_, i, nodes) =>
                select(nodes[i]).attr("class") === textVisability.high
        )
        .each((_, i, nodes) => topNodes.push(nodes[i]));

    nodes
        .selectAll("text")
        .filter(
            (_, i, nodes) =>
                select(nodes[i]).attr("class") === textVisability.low
        )
        .each((_, i, nodes) => {
            const lowerNode = nodes[i];
            topNodes
                .filter(
                    (topNode) =>
                        isElementOverlapping(
                            "x",
                            rect(topNode),
                            rect(lowerNode)
                        ) &&
                        isElementOverlapping(
                            "y",
                            rect(topNode),
                            rect(lowerNode),
                            textCollisionFuzzFactorPx
                        )
                )
                .forEach(() =>
                    select(lowerNode).attr(
                        "dy",
                        Number(select(lowerNode).attr("dy")) + textAdjustPx
                    )
                );
        });
};

export const lockTextOpacity = (d) =>
    select(d).style("opacity", textOpacity[select(d).attr("class")]);

export const unlockTextOpacity = (d) => select(d).style("opacity", null);

export const textOpacity = {top: 1, mid: 0.7, lower: 0};

export const selectVisibleNodes = (nodes) =>
    nodes.filter(
        (_, i, nodes) =>
            select(nodes[i]).selectAll("text").attr("class") !==
            textVisability.zero
    );

export const adjustLabelsThatOverflow = (nodes) =>
    nodes.selectAll("text").each((_, i, nodes) => shrinkOrHideText(nodes[i]));

const centerLabels = (nodes) =>
    nodes.selectAll("text").each((_, i, nodes) => centerText(nodes[i]));

const centerText = (d) => {
    const nodeSelect = select(d);
    const rect = d.getBoundingClientRect();
    nodeSelect.attr("dx", 0 - rect.width / 2).attr("dy", 0 + rect.height / 4);
};

// WOuld be ideal to use IntersectionObserver here, but it does not support SVG
const shrinkOrHideText = (d) => {
    const parent = d.parentNode;
    const rect = parent.childNodes[0];

    const textRect = d.getBBox();
    const rectRect = rect.getBBox();

    if (!needsToShrinkOrHide(d, rectRect, textRect)) {
        select(d).attr("class", select(d).attr("class"));
    }
};

const needsToShrinkOrHide = (d, rectRect, textRect) => {
    const resize_factor = Math.min(
        rectRect.height / textRect.height,
        rectRect.width / textRect.width
    );

    if (resize_factor < 1) {
        const fontSize = parseInt(select(d).style("font-size"));
        const newFontSize = Math.floor(fontSize * resize_factor);
        if (fontSize > minTextSize && newFontSize > minTextSize) {
            select(d).style("font-size", `${newFontSize}px`);
            centerText(d);
        } else {
            select(d).style("font-size", null);
            select(d).attr("class", textVisability.zero);
        }
        return true;
    }
    return false;
};

const textLevelHelper = (d, treemapLevel, crossValues) => {
    if (
        !crossValues
            .filter((x) => x !== "")
            .every((x) => d.crossValue.split("|").includes(x))
    )
        return textVisability.zero;
    switch (d.depth) {
        case treemapLevel + 1:
            return textVisability.high;
        case treemapLevel + 2:
            return textVisability.low;
        default:
            return textVisability.zero;
    }
};

const textVisability = {high: "top", low: "mid", zero: "lower"};
