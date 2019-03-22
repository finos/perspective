/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {enforceContainerBoundaries} from "./enforceContainerBoundaries";

const horizontalDragHandleClass = "horizontal-drag-handle";
const verticalDragHandleClass = "vertical-drag-handle";
const cornerDragHandleClass = "corner-drag-handle";

const dragbarWidth = 7;
const minLegendHeight = 100;
const minLegendWidth = 100;

export function resizableComponent() {
    const resizable = element => {
        const dragLeft = d3.drag().on("drag", function() {
            dragLeftFunc(this, d3.event, element);
        });
        const dragTop = d3.drag().on("drag", function() {
            dragTopFunc(this, d3.event, element);
        });
        const dragRight = d3.drag().on("drag", function() {
            dragRightFunc(this, d3.event, element);
        });
        const dragBottom = d3.drag().on("drag", function() {
            dragBottomFunc(this, d3.event, element);
        });

        const dragTopLeft = d3.drag().on("drag", function() {
            dragLeftFunc(this, d3.event, element);
            dragTopFunc(this, d3.event, element);
        });

        const node = element.node();
        const nodeRect = node.getBoundingClientRect();

        if (dragHandlesContainerExists(element)) {
            return;
        }

        const dragHandlesSvg = element
            .append("svg")
            .attr("id", "dragHandles")
            .attr("width", nodeRect.width)
            .attr("height", nodeRect.height);

        const dragHandlesGroup = dragHandlesSvg.append("g");

        dragHandlesGroup
            .append("rect")
            .attr("id", "dragleft")
            .attr("class", horizontalDragHandleClass)
            .attr("y", () => dragbarWidth)
            .attr("x", () => 0)
            .attr("height", nodeRect.height - dragbarWidth * 2)
            .attr("width", dragbarWidth)
            .attr("fill", "lightblue")
            .attr("fill-opacity", 0.5)
            .style("z-index", 3)
            .attr("cursor", "ew-resize")
            .call(dragLeft);

        dragHandlesGroup
            .append("rect")
            .attr("id", "dragtop")
            .attr("class", verticalDragHandleClass)
            .attr("y", () => 0)
            .attr("x", () => dragbarWidth)
            .attr("height", dragbarWidth)
            .attr("width", nodeRect.width - dragbarWidth * 2)
            .attr("fill", "lightgreen")
            .attr("fill-opacity", 0.5)
            .style("z-index", 3)
            .attr("cursor", "ns-resize")
            .call(dragTop);

        dragHandlesGroup
            .append("rect")
            .attr("id", "dragright")
            .attr("class", horizontalDragHandleClass)
            .attr("y", () => dragbarWidth)
            .attr("x", () => nodeRect.width - dragbarWidth)
            .attr("height", nodeRect.height - dragbarWidth * 2)
            .attr("width", dragbarWidth)
            .attr("fill", "lightblue")
            .attr("fill-opacity", 0.5)
            .style("z-index", 3)
            .attr("cursor", "ew-resize")
            .call(dragRight);

        dragHandlesGroup
            .append("rect")
            .attr("id", "dragbottom")
            .attr("class", verticalDragHandleClass)
            .attr("y", () => nodeRect.height - dragbarWidth)
            .attr("x", () => dragbarWidth)
            .attr("height", dragbarWidth)
            .attr("width", nodeRect.width - dragbarWidth * 2)
            .attr("fill", "lightgreen")
            .attr("fill-opacity", 0.5)
            .style("z-index", 3)
            .attr("cursor", "ns-resize")
            .call(dragBottom);

        dragHandlesGroup
            .append("rect")
            .attr("id", "dragtopleft")
            .attr("class", cornerDragHandleClass)
            .attr("y", () => 0)
            .attr("x", () => 0)
            .attr("height", dragbarWidth)
            .attr("width", dragbarWidth)
            .attr("fill", "red")
            .attr("fill-opacity", 0.5)
            .style("z-index", 3)
            .attr("cursor", "nwse-resize")
            .call(dragTopLeft);
    };

    return resizable;
}

function dragHandlesContainerExists(container) {
    let dragHandlesContainer = container.select("svg#dragHandles");
    return dragHandlesContainer.size() > 0;
}

function dragLeftFunc(handle, event, element) {
    const node = element.node();
    const handles = element.select("#dragHandles");
    const offsetLeft = enforceBoundariesOnX(handle, event.x, handles);

    // adjust values for resizable element.
    node.style.left = `${node.offsetLeft + offsetLeft}px`;
    node.style.width = `${node.offsetWidth - offsetLeft}px`;

    // adjust handles container
    handles.attr("width", handles.node().getBoundingClientRect().width - offsetLeft);

    const parallelHandle = getParallelHandle(handles, handle.id, horizontalDragHandleClass);
    pinHandleToEdge(parallelHandle, "x", offsetLeft);
    extendPerpendicularHandles(handles, offsetLeft, "width", verticalDragHandleClass);
}

function dragRightFunc(handle, event, element) {
    const node = element.node();
    const handles = element.select("#dragHandles");
    const offsetRight = -enforceBoundariesOnX(handle, event.dx, handles, false);

    // adjust values for resizable element.
    node.style.width = `${node.offsetWidth - offsetRight}px`;

    // adjust handles container
    handles.attr("width", handles.node().getBoundingClientRect().width - offsetRight);

    pinHandleToEdge(handle, "x", offsetRight);
    extendPerpendicularHandles(handles, offsetRight, "width", verticalDragHandleClass);
}

function dragTopFunc(handle, event, element) {
    const node = element.node();
    const handles = element.select("#dragHandles");
    const offsetTop = enforceBoundariesOnY(handle, event.y, handles);

    // adjust values for resizable element.
    node.style.top = `${node.offsetTop + offsetTop}px`;
    node.style.height = `${node.offsetHeight - offsetTop}px`;

    // adjust handles container
    handles.attr("height", handles.node().getBoundingClientRect().height - offsetTop);

    const parallelHandle = getParallelHandle(handles, handle.id, verticalDragHandleClass);
    pinHandleToEdge(parallelHandle, "y", offsetTop);
    extendPerpendicularHandles(handles, offsetTop, "height", horizontalDragHandleClass);
}

function dragBottomFunc(handle, event, element) {
    const node = element.node();
    const handles = element.select("#dragHandles");
    const offsetBottom = -enforceBoundariesOnY(handle, event.dy, handles, false);

    // adjust values for resizable element.
    node.style.height = `${node.offsetHeight - offsetBottom}px`;

    // adjust handles container
    handles.attr("height", handles.node().getBoundingClientRect().height - offsetBottom);

    pinHandleToEdge(handle, "y", offsetBottom);
    extendPerpendicularHandles(handles, offsetBottom, "height", horizontalDragHandleClass);
}

function getParallelHandle(handles, thisNodeId, orientationClass) {
    const parallelHandles = handles.selectAll(`.${orientationClass}`);
    let parallelHandle;
    parallelHandles.each((_, i, nodes) => {
        const handleNode = nodes[i];
        if (handleNode.id === thisNodeId) {
            return;
        }
        parallelHandle = handleNode;
    });
    return parallelHandle;
}

// dimension as in width or height
function extendPerpendicularHandles(handles, offset, dimension, orientationClass) {
    const perpendicularHandles = handles.selectAll(`.${orientationClass}`);
    perpendicularHandles.each((_, i, nodes) => {
        const handleNode = nodes[i];
        const handleElement = d3.select(handleNode);
        handleElement.attr(dimension, handleNode.getBoundingClientRect()[dimension] - offset);
    });
}

function pinHandleToEdge(handle, axis, offset) {
    const handleElement = d3.select(handle);
    handleElement.attr(axis, Number(handleElement.attr(axis)) - offset);
}

function enforceBoundariesOnX(handle, offsetX, handles, left = true) {
    const [adjustedOffsetX, _] = enforceContainerBoundaries(handle, offsetX, 0);
    const offset = left ? enforceInternalHorizontalBoundariesLeft(adjustedOffsetX, handles) : enforceInternalHorizontalBoundariesRight(adjustedOffsetX, handles);
    return offset;
}

function enforceBoundariesOnY(handle, offsetY, handles, top = true) {
    const [_, adjustedOffsetY] = enforceContainerBoundaries(handle, 0, offsetY);
    const offset = top ? enforceInternalVerticalBoundariesTop(adjustedOffsetY, handles) : enforceInternalVerticalBoundariesBottom(adjustedOffsetY, handles);
    return offset;
}

function enforceInternalVerticalBoundariesTop(offset, dragHandleContainer) {
    const anticipatedHeight = Number(dragHandleContainer.attr("height")) - offset;
    if (anticipatedHeight < minLegendHeight) {
        const difference = minLegendHeight - anticipatedHeight;
        const reducedOffset = offset - difference;
        return reducedOffset;
    }
    return offset;
}

function enforceInternalVerticalBoundariesBottom(offset, dragHandleContainer) {
    const anticipatedHeight = Number(dragHandleContainer.attr("height")) + offset;
    if (anticipatedHeight < minLegendHeight) {
        const difference = minLegendHeight - anticipatedHeight;
        const reducedOffset = offset + difference;
        return reducedOffset;
    }
    return offset;
}

function enforceInternalHorizontalBoundariesLeft(offset, dragHandleContainer) {
    const anticipatedWidth = Number(dragHandleContainer.attr("width")) - offset;
    if (anticipatedWidth < minLegendWidth) {
        const difference = minLegendWidth - anticipatedWidth;
        const reducedOffset = offset - difference;
        return reducedOffset;
    }
    return offset;
}

function enforceInternalHorizontalBoundariesRight(offset, dragHandleContainer) {
    const anticipatedWidth = Number(dragHandleContainer.attr("width")) + offset;
    if (anticipatedWidth < minLegendWidth) {
        const difference = minLegendWidth - anticipatedWidth;
        const reducedOffset = offset + difference;
        return reducedOffset;
    }
    return offset;
}
