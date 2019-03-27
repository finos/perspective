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

const horizontalHandleClass = "horizontal-drag-handle";
const verticalHandleClass = "vertical-drag-handle";
const cornerHandleClass = "corner-drag-handle";

const handlesContainerId = "dragHandles";

const leftHandleId = "dragleft";
const topHandleId = "dragtop";
const rightHandleId = "dragright";
const bottomHandleId = "dragbottom";

const topLeftHandleId = "dragtopleft";
const topRightHandleId = "dragtopright";
const bottomRightHandleId = "dragbottomright";
const bottomLeftHandleId = "dragbottomleft";

const fillOpacity = 0.0;

export function resizableComponent() {
    let handleWidth = 9;
    let minHeight = 100;
    let minWidth = 100;
    let zIndex = 3;

    const callbackFuncs = [];
    const executeCallbacks = direction => {
        callbackFuncs.forEach(func => {
            func(direction);
        });
    };

    const resizable = container => {
        const dragLeft = d3.drag().on("drag", function() {
            dragLeftFunc(d3.event);
            executeCallbacks("horizontal");
        });
        const dragTop = d3.drag().on("drag", function() {
            dragTopFunc(d3.event);
            executeCallbacks("vertical");
        });
        const dragRight = d3.drag().on("drag", function() {
            dragRightFunc(d3.event);
            executeCallbacks("horizontal");
        });
        const dragBottom = d3.drag().on("drag", function() {
            dragBottomFunc(d3.event);
            executeCallbacks("vertical");
        });

        const dragTopLeft = d3.drag().on("drag", function() {
            dragLeftFunc(d3.event);
            dragTopFunc(d3.event);
            executeCallbacks("diagonal");
        });
        const dragTopRight = d3.drag().on("drag", function() {
            dragRightFunc(d3.event);
            dragTopFunc(d3.event);
            executeCallbacks("diagonal");
        });
        const dragBottomRight = d3.drag().on("drag", function() {
            dragRightFunc(d3.event);
            dragBottomFunc(d3.event);
            executeCallbacks("diagonal");
        });
        const dragBottomLeft = d3.drag().on("drag", function() {
            dragLeftFunc(d3.event);
            dragBottomFunc(d3.event);
            executeCallbacks("diagonal");
        });

        if (handlesContainerExists(container)) {
            return;
        }

        const containerNode = container.node();
        const containerRect = containerNode.getBoundingClientRect();

        const handles = container
            .append("svg")
            .attr("id", handlesContainerId)
            .attr("width", containerRect.width)
            .attr("height", containerRect.height);

        const handlesGroup = handles.append("g");

        const leftHandle = handlesGroup
            .append("rect")
            .attr("id", leftHandleId)
            .attr("class", horizontalHandleClass)
            .attr("y", () => handleWidth)
            .attr("x", () => 0)
            .attr("height", containerRect.height - handleWidth * 2)
            .attr("width", handleWidth)
            .attr("fill", "lightblue")
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "ew-resize")
            .call(dragLeft);

        const topHandle = handlesGroup
            .append("rect")
            .attr("id", topHandleId)
            .attr("class", verticalHandleClass)
            .attr("y", () => 0)
            .attr("x", () => handleWidth)
            .attr("height", handleWidth)
            .attr("width", containerRect.width - handleWidth * 2)
            .attr("fill", "lightgreen")
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "ns-resize")
            .call(dragTop);

        const rightHandle = handlesGroup
            .append("rect")
            .attr("id", rightHandleId)
            .attr("class", horizontalHandleClass)
            .attr("y", () => handleWidth)
            .attr("x", () => containerRect.width - handleWidth)
            .attr("height", containerRect.height - handleWidth * 2)
            .attr("width", handleWidth)
            .attr("fill", "lightblue")
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "ew-resize")
            .call(dragRight);

        const bottomHandle = handlesGroup
            .append("rect")
            .attr("id", bottomHandleId)
            .attr("class", verticalHandleClass)
            .attr("y", () => containerRect.height - handleWidth)
            .attr("x", () => handleWidth)
            .attr("height", handleWidth)
            .attr("width", containerRect.width - handleWidth * 2)
            .attr("fill", "lightgreen")
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "ns-resize")
            .call(dragBottom);

        handlesGroup
            .append("rect")
            .attr("id", topLeftHandleId)
            .attr("class", `${cornerHandleClass} top left`)
            .attr("y", () => 0)
            .attr("x", () => 0)
            .attr("height", handleWidth)
            .attr("width", handleWidth)
            .attr("fill", "red")
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "nwse-resize")
            .call(dragTopLeft);

        const topRightHandle = handlesGroup
            .append("rect")
            .attr("id", topRightHandleId)
            .attr("class", `${cornerHandleClass} top right`)
            .attr("y", () => 0)
            .attr("x", () => containerRect.width - handleWidth)
            .attr("height", handleWidth)
            .attr("width", handleWidth)
            .attr("fill", "red")
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "nesw-resize")
            .call(dragTopRight);

        const bottomRightHandle = handlesGroup
            .append("rect")
            .attr("id", bottomRightHandleId)
            .attr("class", `${cornerHandleClass} bottom right`)
            .attr("y", () => containerRect.height - handleWidth)
            .attr("x", () => containerRect.width - handleWidth)
            .attr("height", handleWidth)
            .attr("width", handleWidth)
            .attr("fill", "red")
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "nwse-resize")
            .call(dragBottomRight);

        const bottomLeftHandle = handlesGroup
            .append("rect")
            .attr("id", bottomLeftHandleId)
            .attr("class", `${cornerHandleClass} bottom left`)
            .attr("y", () => containerRect.height - handleWidth)
            .attr("x", () => 0)
            .attr("height", handleWidth)
            .attr("width", handleWidth)
            .attr("fill", "red")
            .attr("fill-opacity", fillOpacity)
            .style("z-index", zIndex)
            .attr("cursor", "nesw-resize")
            .call(dragBottomLeft);

        function dragLeftFunc(event) {
            const offset = enforceMinDistToRightBar(enforceContainerBoundaries(leftHandle.node(), event.x, 0).x, handles);
            containerNode.style.left = `${containerNode.offsetLeft + offset}px`;
            containerNode.style.width = `${containerNode.offsetWidth - offset}px`;

            extendHandlesBox(handles, "width", offset);
            pinHandleToHandleBoxEdge(rightHandle, "x", offset);
            extendPerpendicularHandles(handles, offset, "width", verticalHandleClass);
            pinCorners(handles);
        }

        function dragRightFunc(event) {
            const offset = -enforceMinDistToLeftBar(enforceContainerBoundaries(rightHandle.node(), event.dx, 0).x, handles);
            if (pointerFallenBehindAbsoluteCoordinates(offset, "x", rightHandle, event)) return;
            containerNode.style.width = `${containerNode.offsetWidth - offset}px`;

            extendHandlesBox(handles, "width", offset);
            pinHandleToHandleBoxEdge(rightHandle, "x", offset);
            extendPerpendicularHandles(handles, offset, "width", verticalHandleClass);
            pinCorners(handles);
        }

        function dragTopFunc(event) {
            const offset = enforceMinDistToBottomBar(enforceContainerBoundaries(topHandle.node(), 0, event.y).y, handles);
            containerNode.style.top = `${containerNode.offsetTop + offset}px`;
            containerNode.style.height = `${containerNode.offsetHeight - offset}px`;

            extendHandlesBox(handles, "height", offset);
            pinHandleToHandleBoxEdge(bottomHandle, "y", offset);
            extendPerpendicularHandles(handles, offset, "height", horizontalHandleClass);
            pinCorners(handles);
        }

        function dragBottomFunc(event) {
            const offset = -enforceMinDistToTopBar(enforceContainerBoundaries(bottomHandle.node(), 0, event.dy).y, handles);
            if (pointerFallenBehindAbsoluteCoordinates(offset, "y", bottomHandle, event)) return;
            containerNode.style.height = `${containerNode.offsetHeight - offset}px`;

            extendHandlesBox(handles, "height", offset);
            pinHandleToHandleBoxEdge(bottomHandle, "y", offset);
            extendPerpendicularHandles(handles, offset, "height", horizontalHandleClass);
            pinCorners(handles);
        }

        function pinCorners(handles) {
            topRightHandle.attr("y", () => 0).attr("x", () => handles.attr("width") - handleWidth);
            bottomRightHandle.attr("y", () => handles.attr("height") - handleWidth).attr("x", () => handles.attr("width") - handleWidth);
            bottomLeftHandle.attr("y", () => handles.attr("height") - handleWidth).attr("x", () => 0);
        }
    };

    resizable.addCallbackToResize = func => {
        callbackFuncs.push(func);
        return resizable;
    };

    resizable.zIndex = input => {
        zIndex = input;
        return resizable;
    };

    resizable.minWidth = input => {
        minWidth = input;
        return resizable;
    };

    resizable.minHeight = input => {
        minHeight = input;
        return resizable;
    };

    resizable.handleWidth = input => {
        handleWidth = input;
        return resizable;
    };

    function enforceMinDistToBottomBar(offset, dragHandleContainer) {
        const anticipatedHeight = Number(dragHandleContainer.attr("height")) - offset;
        if (anticipatedHeight < minHeight) {
            const difference = minHeight - anticipatedHeight;
            return offset - difference;
        }
        return offset;
    }

    function enforceMinDistToTopBar(offset, dragHandleContainer) {
        const anticipatedHeight = Number(dragHandleContainer.attr("height")) + offset;
        if (anticipatedHeight < minHeight) {
            const difference = minHeight - anticipatedHeight;
            return offset + difference;
        }
        return offset;
    }

    function enforceMinDistToRightBar(offset, dragHandleContainer) {
        const anticipatedWidth = Number(dragHandleContainer.attr("width")) - offset;
        if (anticipatedWidth < minWidth) {
            const difference = minWidth - anticipatedWidth;
            return offset - difference;
        }
        return offset;
    }

    function enforceMinDistToLeftBar(offset, dragHandleContainer) {
        const anticipatedWidth = Number(dragHandleContainer.attr("width")) + offset;
        if (anticipatedWidth < minWidth) {
            const difference = minWidth - anticipatedWidth;
            return offset + difference;
        }
        return offset;
    }

    function pointerFallenBehindAbsoluteCoordinates(offset, axis, handle, event) {
        return offset < 0 && event[axis] < Number(handle.attr(axis));
    }

    return resizable;
}

function handlesContainerExists(container) {
    let handlesContainer = container.select(`#${handlesContainerId}`);
    return handlesContainer.size() > 0;
}

// "dimension" referring to width or height
function extendPerpendicularHandles(handles, offset, dimension, orientationClass) {
    const perpendicularHandles = handles.selectAll(`.${orientationClass}`);
    perpendicularHandles.each((_, i, nodes) => {
        const handleNode = nodes[i];
        const handleElement = d3.select(handleNode);
        handleElement.attr(dimension, handleNode.getBoundingClientRect()[dimension] - offset);
    });
}

function pinHandleToHandleBoxEdge(handle, axis, offset) {
    handle.attr(axis, Number(handle.attr(axis)) - offset);
}

function extendHandlesBox(handles, dimension, offset) {
    handles.attr(dimension, handles.node().getBoundingClientRect()[dimension] - offset);
}
