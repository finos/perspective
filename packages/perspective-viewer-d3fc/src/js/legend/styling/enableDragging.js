/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {isElementOverflowing} from "../../utils/utils";
import {getChartElement} from "../../plugin/root";

const margin = 10;
const pinned = "pinned";
const resizeForDraggingEvent = "resize.for-dragging";

export function enableDragging(element) {
    const node = element.node();
    node.style.cursor = "move";

    const drag = d3.drag().on("drag", function() {
        const [offsetX, offsetY] = enforceContainerBoundaries(this, d3.event.dx, d3.event.dy);
        this.style.left = `${this.offsetLeft + offsetX}px`;
        this.style.top = `${this.offsetTop + offsetY}px`;

        const element = d3.select(this);
        if (isNodeInTopRight(node)) {
            pinNodeToTopRight(node, element);
            return;
        }

        unpinNodeFromTopRight(node, element);
    });

    element.call(drag);
}

function unpinNodeFromTopRight(node, element) {
    if (element.attr(pinned) !== false) {
        element.attr(pinned, false);

        // Default behaviour for the legend is to remain pinned to the top right hand corner with a specific margin.
        // Once the legend has moved we cannot continue to use that css based approach.
        d3.select(window).on(resizeForDraggingEvent, function() {
            const [offsetX, offsetY] = enforceContainerBoundaries(node, 0, 0);
            node.style.left = `${node.offsetLeft + offsetX}px`;
            node.style.top = `${node.offsetTop + offsetY}px`;
        });
    }
}

function pinNodeToTopRight(node, element) {
    element.attr(pinned, true);
    d3.select(window).on(resizeForDraggingEvent, null);
    node.style.left = "auto";
}

function isNodeInTopRight(node) {
    const nodeRect = node.getBoundingClientRect();
    const containerRect = d3
        .select(getChartElement(node).getContainer())
        .node()
        .getBoundingClientRect();

    const fuzz = 5;

    return nodeRect.right + margin + fuzz >= containerRect.right && nodeRect.top - margin - fuzz <= containerRect.top;
}

function enforceContainerBoundaries(legendNode, offsetX, offsetY) {
    const chartNodeRect = d3
        .select(getChartElement(legendNode).getContainer())
        .node()
        .getBoundingClientRect();

    const legendNodeRect = legendNode.getBoundingClientRect();

    const draggedLegendNodeRect = {
        top: legendNodeRect.top + offsetY - margin,
        right: legendNodeRect.right + offsetX + margin,
        bottom: legendNodeRect.bottom + offsetY + margin,
        left: legendNodeRect.left + offsetX - margin
    };

    const adjustedOffsets = {x: offsetX, y: offsetY};
    const boundaries = [{edge: "right", dimension: "x"}, {edge: "left", dimension: "x"}, {edge: "top", dimension: "y"}, {edge: "bottom", dimension: "y"}];

    boundaries.forEach(bound => {
        if (isElementOverflowing(chartNodeRect, draggedLegendNodeRect, bound.edge)) {
            const adjustment = draggedLegendNodeRect[bound.edge] - chartNodeRect[bound.edge];
            adjustedOffsets[bound.dimension] = adjustedOffsets[bound.dimension] - adjustment;
        }
    });

    return [adjustedOffsets.x, adjustedOffsets.y];
}
