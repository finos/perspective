// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { select } from "d3";
import { isElementOverlapping, isElementOverflowing } from "../../utils/utils";

const minTextSize = 7;

export const labelMapExists = (d) =>
    d.target && d.target.textAttributes ? true : false;

export const toggleLabels = (nodes, treemapLevel, crossValues) => {
    nodes.selectAll("text").each(function (d, i) {
        const help = textLevelHelper(d, treemapLevel, crossValues);
        this.style = help;
    });

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
            .attr("style", d.target.textAttributes.style);
    });
};

export const preventTextCollisions = (nodes) => {
    const textCollisionFuzzFactorPx = -2;
    const textAdjustPx = 14; // This should remain the same as the css value for .top => font-size in the chart.less
    const rect = (element): DOMRect => element.getBoundingClientRect();

    const topNodes = [];
    nodes
        .selectAll("text")
        .filter(
            (_, i, nodes) =>
                select(nodes[i]).attr("style") === textVisibility.high,
        )
        .each((_, i, nodes) => topNodes.push(nodes[i]));

    nodes
        .selectAll("text")
        .filter(
            (_, i, nodes) =>
                select(nodes[i]).attr("style") === textVisibility.low,
        )
        .each((_, i, nodes) => {
            const lowerNode = nodes[i];
            topNodes
                .filter(
                    (topNode) =>
                        isElementOverlapping(
                            "x",
                            rect(topNode),
                            rect(lowerNode),
                        ) &&
                        isElementOverlapping(
                            "y",
                            rect(topNode),
                            rect(lowerNode),
                            textCollisionFuzzFactorPx,
                        ),
                )
                .forEach(() =>
                    select(lowerNode).attr(
                        "dy",
                        Number(select(lowerNode).attr("dy")) + textAdjustPx,
                    ),
                );
        });
};

export const lockTextOpacity = (d) =>
    select(d).style("opacity", textOpacity[select(d).attr("class")]);

export const unlockTextOpacity = (d) => select(d).style("opacity", null);

export const textOpacity = { top: 1, mid: 0.7, lower: 0 };

export const selectVisibleNodes = (nodes) =>
    nodes.filter(
        (_, i, nodes) =>
            select(nodes[i]).selectAll("text").attr("style") !==
            textVisibility.zero,
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
        select(d).attr("style", select(d).attr("style"));
    }
};

const needsToShrinkOrHide = (d, rectRect, textRect) => {
    const resize_factor = Math.min(
        rectRect.height / textRect.height,
        rectRect.width / textRect.width,
    );

    if (resize_factor < 1) {
        const fontSize = parseInt(select(d).style("font-size"));
        const newFontSize = Math.floor(fontSize * resize_factor);
        if (fontSize > minTextSize && newFontSize > minTextSize) {
            select(d).style("font-size", `${newFontSize}px`);
            centerText(d);
        } else {
            select(d).style("font-size", null);
            select(d).style("opacity", "0");
        }
        return true;
    }
    return false;
};

const textLevelHelper = (d, treemapLevel, crossValues) => {
    if (
        !crossValues
            .filter((x) => x !== "")
            .every((x) => d.crossValue.includes(x))
    )
        return textVisibility.zero;
    switch (d.depth) {
        case treemapLevel + 1:
            return textVisibility.high;
        case treemapLevel + 2:
            return textVisibility.low;
        default:
            return textVisibility.zero;
    }
};

const textVisibility = {
    high: "font-size:14px;z-index:5;pointer-events: none;",
    low: "font-size:8px;opacity:0.7;z-index:4;",
    zero: "font-size:0px;opacity:0;z-index:4;",
};
