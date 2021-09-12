/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {select} from "d3";
import {getChartContainer} from "../plugin/root";
import {getOrCreateElement, isElementOverflowing} from "../utils/utils";
import tooltipTemplate from "../../html/tooltip.html";
import {generateHtml} from "./generateHTML";
import {selectionEvent} from "./selectionEvent";

export const tooltip = () => {
    let alwaysShow = false;
    let tooltipDiv = null;
    let settings = null;
    let centered = false;

    const _tooltip = (selection) => {
        const node = selection.node();

        if (!node || !node.isConnected) {
            hideTooltip(tooltipDiv);
            return;
        }

        const container = select(getChartContainer(node));
        tooltipDiv = getTooltipDiv(container);

        const showTip = (data, i, nodes) => {
            generateHtml(tooltipDiv, data, settings);
            showTooltip(container.node(), nodes[i], tooltipDiv, centered);
            select(nodes[i]).style("opacity", "0.7");
        };
        const hideTip = (data, i, nodes) => {
            hideTooltip(tooltipDiv);
            if (nodes) select(nodes[i]).style("opacity", "1");
        };

        if (alwaysShow) {
            selection.each(showTip);
        } else {
            selection.on("mouseover", showTip).on("mouseout", hideTip);
            selectionEvent().settings(settings)(selection);
        }
    };

    _tooltip.alwaysShow = (...args) => {
        if (!args.length) {
            return alwaysShow;
        }
        alwaysShow = args[0];
        return _tooltip;
    };

    _tooltip.centered = (...args) => {
        if (!args.length) {
            return centered;
        }
        centered = args[0];
        return _tooltip;
    };

    _tooltip.settings = (...args) => {
        if (!args.length) {
            return settings;
        }
        settings = args[0];
        return _tooltip;
    };

    return _tooltip;
};

function getTooltipDiv(container) {
    return getOrCreateElement(container, "div.tooltip", () =>
        container
            .append("div")
            .attr("class", "tooltip")
            .style("z-index", 3)
            .style("opacity", 0)
            .html(tooltipTemplate)
    );
}

function showTooltip(containerNode, node, tooltipDiv, centered) {
    const containerRect = containerNode.getBoundingClientRect();
    const rect = node.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - containerRect.left;
    let top = rect.top - containerRect.top + containerNode.scrollTop;

    if (centered)
        top =
            rect.top +
            rect.height / 2 -
            containerRect.top +
            containerNode.scrollTop;

    tooltipDiv
        .style("left", `${left}px`)
        .style("top", `${top}px`)
        // .transition()
        // .duration(200)
        .style("opacity", 0.9);

    if (centered) [left, top] = centerTip(tooltipDiv, containerRect);

    shiftIfOverflowingChartArea(tooltipDiv, containerRect, left, top, centered);
}

function centerTip(tooltipDiv, containerRect) {
    const tooltipDivRect = tooltipDiv.node().getBoundingClientRect();

    const leftAdjust = tooltipDivRect.width / 2;
    const newLeft = tooltipDivRect.left - leftAdjust - containerRect.left;
    tooltipDiv.style("left", `${newLeft}px`);

    const topAdjust = tooltipDivRect.height / 2;
    const newTop = tooltipDivRect.top - topAdjust - containerRect.top;
    tooltipDiv.style("top", `${newTop}px`);
    return [newLeft, newTop];
}

function shiftIfOverflowingChartArea(
    tooltipDiv,
    containerRect,
    left,
    top,
    centered = false
) {
    const tooltipDivRect = tooltipDiv.node().getBoundingClientRect();

    if (isElementOverflowing(containerRect, tooltipDivRect)) {
        const leftAdjust = tooltipDivRect.right - containerRect.right;
        tooltipDiv.style("left", `${left - leftAdjust}px`);
    }

    if (isElementOverflowing(containerRect, tooltipDivRect, "bottom")) {
        const topAdjust = tooltipDivRect.bottom - containerRect.bottom;
        tooltipDiv.style("top", `${top - topAdjust}px`);
    }

    if (!centered) return;

    if (isElementOverflowing(containerRect, tooltipDivRect, "left")) {
        const leftAdjust = tooltipDivRect.left - containerRect.left;
        tooltipDiv.style("left", `${left - leftAdjust}px`);
    }

    if (isElementOverflowing(containerRect, tooltipDivRect, "top")) {
        const topAdjust = tooltipDivRect.top - containerRect.top;
        tooltipDiv.style("top", `${top - topAdjust}px`);
    }
}

function hideTooltip(tooltipDiv) {
    if (tooltipDiv) {
        tooltipDiv
            // .transition()
            // .duration(500)
            .style("opacity", 0);
    }
}
