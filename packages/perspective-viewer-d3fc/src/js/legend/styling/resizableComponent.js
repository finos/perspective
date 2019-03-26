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

const dragbarWidth = 9;
const minElementHeight = 100;
const minElementWidth = 100;
const fillOpacity = 0.0;
const zIndex = 3;

export function resizableComponent() {
    const callbackFuncs = [];
    const executeCallbacks = direction => {
        callbackFuncs.forEach(func => {
            func(direction);
        });
    };

    const resizable = element => {
        const dragLeft = d3.drag().on("drag", function() {
            dragLeftFunc(this, d3.event, element);
            executeCallbacks("horizontal");
        });
        const dragTop = d3.drag().on("drag", function() {
            dragTopFunc(this, d3.event, element);
            executeCallbacks("vertical");
        });
        const dragRight = d3.drag().on("drag", function() {
            dragRightFunc(this, d3.event, element);
            executeCallbacks("horizontal");
        });
        const dragBottom = d3.drag().on("drag", function() {
            dragBottomFunc(this, d3.event, element);
            executeCallbacks("vertical");
        });

        const dragTopLeft = d3.drag().on("drag", function() {
            dragLeftFunc(this, d3.event, element);
            dragTopFunc(this, d3.event, element);
            executeCallbacks("diagonal");
        });
        const dragTopRight = d3.drag().on("drag", function() {
            dragRightFunc(this, d3.event, element);
            dragTopFunc(this, d3.event, element);
            executeCallbacks("diagonal");
        });
        const dragBottomRight = d3.drag().on("drag", function() {
            dragRightFunc(this, d3.event, element);
            dragBottomFunc(this, d3.event, element);
            executeCallbacks("diagonal");
        });
        const dragBottomLeft = d3.drag().on("drag", function() {
            dragLeftFunc(this, d3.event, element);
            dragBottomFunc(this, d3.event, element);
            executeCallbacks("diagonal");
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
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
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
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
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
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
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
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "ns-resize")
            .call(dragBottom);

        dragHandlesGroup
            .append("rect")
            .attr("id", "dragtopleft")
            .attr("class", `${cornerDragHandleClass} top left`)
            .attr("y", () => 0)
            .attr("x", () => 0)
            .attr("height", dragbarWidth)
            .attr("width", dragbarWidth)
            .attr("fill", "red")
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "nwse-resize")
            .call(dragTopLeft);

        dragHandlesGroup
            .append("rect")
            .attr("id", "dragtopright")
            .attr("class", `${cornerDragHandleClass} top right`)
            .attr("y", () => 0)
            .attr("x", () => nodeRect.width - dragbarWidth)
            .attr("height", dragbarWidth)
            .attr("width", dragbarWidth)
            .attr("fill", "red")
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "nesw-resize")
            .call(dragTopRight);

        dragHandlesGroup
            .append("rect")
            .attr("id", "dragbottomright")
            .attr("class", `${cornerDragHandleClass} bottom right`)
            .attr("y", () => nodeRect.height - dragbarWidth)
            .attr("x", () => nodeRect.width - dragbarWidth)
            .attr("height", dragbarWidth)
            .attr("width", dragbarWidth)
            .attr("fill", "red")
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "nwse-resize")
            .call(dragBottomRight);

        dragHandlesGroup
            .append("rect")
            .attr("id", "dragbottomleft")
            .attr("class", `${cornerDragHandleClass} bottom left`)
            .attr("y", () => nodeRect.height - dragbarWidth)
            .attr("x", () => 0)
            .attr("height", dragbarWidth)
            .attr("width", dragbarWidth)
            .attr("fill", "red")
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "nesw-resize")
            .call(dragBottomLeft);
    };

    resizable.addCallbackToResize = func => {
        callbackFuncs.push(func);
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
    pinCorners(handles);
}

function dragRightFunc(handle, event, element) {
    const node = element.node();
    const handles = element.select("#dragHandles");
    const rightHandle = handles.select("#dragright").nodes()[0];
    const offsetRight = -enforceBoundariesOnX(rightHandle, event.dx, handles, false);

    // adjust values for resizable element.
    node.style.width = `${node.offsetWidth - offsetRight}px`;

    // adjust handles container
    handles.attr("width", handles.node().getBoundingClientRect().width - offsetRight);

    pinHandleToEdge(rightHandle, "x", offsetRight);
    extendPerpendicularHandles(handles, offsetRight, "width", verticalDragHandleClass);
    pinCorners(handles);
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
    pinCorners(handles);
}

function dragBottomFunc(handle, event, element) {
    const node = element.node();
    const handles = element.select("#dragHandles");
    const bottomHandle = handles.select("#dragbottom").nodes()[0];
    const offsetBottom = -enforceBoundariesOnY(bottomHandle, event.dy, handles, false);

    // adjust values for resizable element.
    node.style.height = `${node.offsetHeight - offsetBottom}px`;

    // adjust handles container
    handles.attr("height", handles.node().getBoundingClientRect().height - offsetBottom);

    pinHandleToEdge(bottomHandle, "y", offsetBottom);
    extendPerpendicularHandles(handles, offsetBottom, "height", horizontalDragHandleClass);
    pinCorners(handles);
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

function pinCorners(handles) {
    const perpendicularHandles = handles.selectAll(`.${cornerDragHandleClass}`);
    perpendicularHandles.each((_, i, nodes) => {
        const handleNode = nodes[i];
        const handleElement = d3.select(handleNode);
        switch (handleElement.attr("id")) {
            case "dragtopright":
                handleElement.attr("y", () => handles.attr("height") - dragbarWidth).attr("x", () => 0);
                break;
            case "dragbottomright":
                handleElement.attr("y", () => handles.attr("height") - dragbarWidth).attr("x", () => handles.attr("width") - dragbarWidth);
                break;
            case "dragbottomleft":
                handleElement.attr("y", () => 0).attr("x", () => handles.attr("width") - dragbarWidth);
                break;
        }
    });
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
    if (anticipatedHeight < minElementHeight) {
        const difference = minElementHeight - anticipatedHeight;
        const reducedOffset = offset - difference;
        return reducedOffset;
    }
    return offset;
}

function enforceInternalVerticalBoundariesBottom(offset, dragHandleContainer) {
    const anticipatedHeight = Number(dragHandleContainer.attr("height")) + offset;
    if (anticipatedHeight < minElementHeight) {
        const difference = minElementHeight - anticipatedHeight;
        const reducedOffset = offset + difference;
        return reducedOffset;
    }
    return offset;
}

function enforceInternalHorizontalBoundariesLeft(offset, dragHandleContainer) {
    const anticipatedWidth = Number(dragHandleContainer.attr("width")) - offset;
    if (anticipatedWidth < minElementWidth) {
        const difference = minElementWidth - anticipatedWidth;
        const reducedOffset = offset - difference;
        return reducedOffset;
    }
    return offset;
}

function enforceInternalHorizontalBoundariesRight(offset, dragHandleContainer) {
    const anticipatedWidth = Number(dragHandleContainer.attr("width")) + offset;
    if (anticipatedWidth < minElementWidth) {
        const difference = minElementWidth - anticipatedWidth;
        const reducedOffset = offset + difference;
        return reducedOffset;
    }
    return offset;
}
