/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";

const horizontalDragHandleClass = "horizontal-drag-handle";
const verticalDragHandleClass = "vertical-drag-handle";

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

        const node = element.node();
        const nodeRect = node.getBoundingClientRect();
        const dragbarWidth = 7;

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
    const offsetLeft = event.x;

    // adjust values for resizable element.
    node.style.left = `${node.offsetLeft + offsetLeft}px`;
    node.style.width = `${node.offsetWidth - offsetLeft}px`;

    // adjust handles container
    handles.attr("width", handles.node().getBoundingClientRect().width - offsetLeft);

    pinParallelHandleToEdge(handles, handle.id, offsetLeft, "x", horizontalDragHandleClass);
    extendPerpendicularHandles(handles, offsetLeft, "width", verticalDragHandleClass);
}

function dragTopFunc(handle, event, element) {
    const node = element.node();
    const handles = element.select("#dragHandles");
    const offsetTop = event.y;

    // adjust values for resizable element.
    node.style.top = `${node.offsetTop + offsetTop}px`;
    node.style.height = `${node.offsetHeight - offsetTop}px`;

    // adjust handles container
    handles.attr("height", handles.node().getBoundingClientRect().height - offsetTop);

    pinParallelHandleToEdge(handles, handle.id, offsetTop, "y", verticalDragHandleClass);
    extendPerpendicularHandles(handles, offsetTop, "height", horizontalDragHandleClass);
}

function dragRightFunc(handle, event, element) {
    const node = element.node();
    const handles = element.select("#dragHandles");
    const offsetRight = -d3.event.dx;

    // adjust values for resizable element.
    node.style.width = `${node.offsetWidth - offsetRight}px`;

    // adjust handles container
    handles.attr("width", handles.node().getBoundingClientRect().width - offsetRight);

    pinThisHandleToEdge(handles, handle.id, offsetRight, "x", horizontalDragHandleClass);
    extendPerpendicularHandles(handles, offsetRight, "width", verticalDragHandleClass);
}

function dragBottomFunc(handle, event, element) {
    const node = element.node();
    const handles = element.select("#dragHandles");
    const offsetBottom = -event.dy;

    // adjust values for resizable element.
    node.style.height = `${node.offsetHeight - offsetBottom}px`;

    // adjust handles container
    handles.attr("height", handles.node().getBoundingClientRect().height - offsetBottom);

    pinThisHandleToEdge(handles, handle.id, offsetBottom, "y", verticalDragHandleClass);
    extendPerpendicularHandles(handles, offsetBottom, "height", horizontalDragHandleClass);
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

function pinThisHandleToEdge(handles, thisNodeId, offset, axis, orientationClass) {
    const parallelHandles = handles.selectAll(`.${orientationClass}`);
    parallelHandles.each((_, i, nodes) => {
        const handleNode = nodes[i];
        if (handleNode.id !== thisNodeId) {
            return;
        }
        updateHandleLocationOnAxis(handleNode, axis, offset);
    });
}

function pinParallelHandleToEdge(handles, thisNodeId, offset, axis, orientationClass) {
    const parallelHandles = handles.selectAll(`.${orientationClass}`);
    parallelHandles.each((_, i, nodes) => {
        const handleNode = nodes[i];
        if (handleNode.id === thisNodeId) {
            return;
        }
        updateHandleLocationOnAxis(handleNode, axis, offset);
    });
}

function updateHandleLocationOnAxis(handleNode, axis, offset) {
    const handleElement = d3.select(handleNode);
    handleElement.attr(axis, Number(handleElement.attr(axis)) - offset);
}
