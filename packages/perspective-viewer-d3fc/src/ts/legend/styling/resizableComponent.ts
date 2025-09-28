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

import * as d3 from "d3";
import { enforceContainerBoundaries } from "./enforceContainerBoundaries";

const horizontalHandleClass = "horizontal-drag-handle";
const verticalHandleClass = "vertical-drag-handle";
const cornerHandleClass = "corner-drag-handle";

const handlesContainerId = "dragHandles";

const fillOpacity = 0.0;
const resizeEvent = "resize";

export function resizableComponent() {
    let handleWidthPx = 9;
    let zIndex = 3;
    let settings = null;
    const minDimensionsPx = { height: 100, width: 100 };
    const maxDimensionsPx = { height: null, width: null };

    const callbacks: { event: any; execute: Function }[] = [];
    const executeCallbacks = (event, direction) =>
        callbacks
            .filter((callback) => callback.event === event)
            .forEach((callback) => callback.execute(direction));

    const resizable = (container) => {
        if (handlesContainerExists(container)) {
            return;
        }

        const dragHelper = {
            left: (event) =>
                executeCallbacks(resizeEvent, {
                    horizontal: dragLeft(event),
                    vertical: false,
                }),
            top: (event) =>
                executeCallbacks(resizeEvent, {
                    horizontal: false,
                    vertical: dragTop(event),
                }),
            right: (event) =>
                executeCallbacks(resizeEvent, {
                    horizontal: dragRight(event),
                    vertical: false,
                }),
            bottom: (event) =>
                executeCallbacks(resizeEvent, {
                    horizontal: false,
                    vertical: dragBottom(event),
                }),
            topleft: (event) =>
                executeCallbacks(resizeEvent, {
                    horizontal: dragLeft(event),
                    vertical: dragTop(event),
                }),
            topright: (event) =>
                executeCallbacks(resizeEvent, {
                    horizontal: dragRight(event),
                    vertical: dragTop(event),
                }),
            bottomright: (event) =>
                executeCallbacks(resizeEvent, {
                    horizontal: dragRight(event),
                    vertical: dragBottom(event),
                }),
            bottomleft: (event) =>
                executeCallbacks(resizeEvent, {
                    horizontal: dragLeft(event),
                    vertical: dragBottom(event),
                }),
        };

        const containerNode = container.node();
        if (settings.legend) {
            containerNode.style.height = settings.legend.height;
            containerNode.style.width = settings.legend.width;
        }

        const containerRect: DOMRect = containerNode.getBoundingClientRect();
        const handles: d3.Selection<SVGElement, unknown, undefined, unknown> =
            container
                .append("svg")
                .attr("id", handlesContainerId)
                .attr("width", containerRect.width)
                .attr("height", containerRect.height);

        const handlesGroup = handles.append("g");

        const isVertical = (d) => d === "left" || d === "right";
        const xCoordHelper = {
            left: 0,
            top: handleWidthPx,
            right: containerRect.width - handleWidthPx,
            bottom: handleWidthPx,
        };
        const yCoordHelper = {
            left: handleWidthPx,
            top: 0,
            right: handleWidthPx,
            bottom: containerRect.height - handleWidthPx,
        };
        const edgeHandles = ["left", "top", "right", "bottom"];
        const [leftHandle, topHandle, rightHandle, bottomHandle] =
            edgeHandles.map((edge) =>
                handlesGroup
                    .append("rect")
                    .attr("id", `drag${edge}`)
                    .attr(
                        "class",
                        isVertical(edge)
                            ? verticalHandleClass
                            : horizontalHandleClass,
                    )
                    .attr("y", yCoordHelper[edge])
                    .attr("x", xCoordHelper[edge])
                    .attr(
                        "height",
                        isVertical(edge)
                            ? containerRect.height - handleWidthPx * 2
                            : handleWidthPx,
                    )
                    .attr(
                        "width",
                        isVertical(edge)
                            ? handleWidthPx
                            : containerRect.width - handleWidthPx * 2,
                    )
                    .attr("fill", isVertical(edge) ? "lightgreen" : "lightblue")
                    .attr("fill-opacity", fillOpacity)
                    .style("z-index", zIndex)
                    .attr(
                        "cursor",
                        isVertical(edge) ? "ew-resize" : "ns-resize",
                    )
                    .call(d3.drag().on("drag", dragHelper[edge])),
            );

        const concatCornerEdges = (corner) => `${corner[0]}${corner[1]}`;
        const cornerCursorHelper = {
            topleft: "nwse",
            topright: "nesw",
            bottomright: "nwse",
            bottomleft: "nesw",
        };
        const cornerHandles = [
            ["top", "left"],
            ["top", "right"],
            ["bottom", "right"],
            ["bottom", "left"],
        ];
        const [
            topLeftHandle,
            topRightHandle,
            bottomRightHandle,
            bottomLeftHandle,
        ] = cornerHandles.map((corner) =>
            handlesGroup
                .append("rect")
                .attr("id", `drag${concatCornerEdges(corner)}`)
                .attr("class", `${cornerHandleClass} ${corner[0]} ${corner[1]}`)
                .attr("height", handleWidthPx)
                .attr("width", handleWidthPx)
                .attr("fill", "red")
                .attr("fill-opacity", fillOpacity)
                .style("z-index", zIndex)
                .attr(
                    "cursor",
                    `${cornerCursorHelper[concatCornerEdges(corner)]}-resize`,
                )
                .call(
                    d3.drag().on("drag", dragHelper[concatCornerEdges(corner)]),
                ),
        );

        enforceMaxDimensions("height", "y", bottomHandle);
        enforceMaxDimensions("width", "x", rightHandle);
        pinCorners(handles);

        function dragLeft(event) {
            const offset = enforceDistToParallelBarConstraints(
                enforceContainerBoundaries(leftHandle.node(), event.x, 0).x,
                handles,
                "width",
                (x, y) => x - y,
            );
            containerNode.style.left = `${containerNode.offsetLeft + offset}px`;
            containerNode.style.width = `${
                containerNode.offsetWidth - offset
            }px`;
            updateSettings();
            return resizeAndRelocateHandles(rightHandle, offset, "width", "x");
        }

        function dragRight(event) {
            const offset = -enforceDistToParallelBarConstraints(
                enforceContainerBoundaries(rightHandle.node(), event.dx, 0).x,
                handles,
                "width",
                (x, y) => x + y,
            );
            if (
                pointerFallenBehindAbsoluteCoordinates(
                    offset,
                    "x",
                    rightHandle,
                    event,
                )
            )
                return false;
            containerNode.style.width = `${
                containerNode.offsetWidth - offset
            }px`;
            updateSettings();
            return resizeAndRelocateHandles(rightHandle, offset, "width", "x");
        }

        function dragTop(event) {
            const offset = enforceDistToParallelBarConstraints(
                enforceContainerBoundaries(topHandle.node(), 0, event.y).y,
                handles,
                "height",
                (x, y) => x - y,
            );
            containerNode.style.top = `${containerNode.offsetTop + offset}px`;
            containerNode.style.height = `${
                containerNode.offsetHeight - offset
            }px`;
            updateSettings();
            return resizeAndRelocateHandles(
                bottomHandle,
                offset,
                "height",
                "y",
            );
        }

        function dragBottom(event) {
            const offset = -enforceDistToParallelBarConstraints(
                enforceContainerBoundaries(bottomHandle.node(), 0, event.dy).y,
                handles,
                "height",
                (x, y) => x + y,
            );
            if (
                pointerFallenBehindAbsoluteCoordinates(
                    offset,
                    "y",
                    bottomHandle,
                    event,
                )
            )
                return false;
            containerNode.style.height = `${
                containerNode.offsetHeight - offset
            }px`;
            updateSettings();
            return resizeAndRelocateHandles(
                bottomHandle,
                offset,
                "height",
                "y",
            );
        }

        function updateSettings() {
            const dimensions = {
                top: containerNode.style.top,
                left: containerNode.style.left,
                height: containerNode.style.height,
                width: containerNode.style.width,
            };
            settings.legend = { ...settings.legend, ...dimensions };
        }

        function resizeAndRelocateHandles(handle, offset, dimension, axis) {
            extendHandlesBox(handles, dimension, offset);
            pinHandleToHandleBoxEdge(handle, axis, offset);
            extendPerpendicularHandles(
                handles,
                offset,
                dimension,
                dimension === "height"
                    ? verticalHandleClass
                    : horizontalHandleClass,
            );
            pinCorners(handles);
            return offset != 0;
        }

        function pinCorners(handles) {
            topLeftHandle.attr("y", 0);
            topRightHandle
                .attr("y", 0)
                .attr("x", handles.attr("width") - handleWidthPx);
            bottomRightHandle
                .attr("y", handles.attr("height") - handleWidthPx)
                .attr("x", handles.attr("width") - handleWidthPx);
            bottomLeftHandle
                .attr("y", handles.attr("height") - handleWidthPx)
                .attr("x", 0);
        }

        function enforceMaxDimensions(dimension, axis, relativeHandle) {
            if (
                !!maxDimensionsPx[dimension] &&
                maxDimensionsPx[dimension] < containerRect[dimension]
            ) {
                containerNode.style[dimension] =
                    `${maxDimensionsPx[dimension]}px`;
                resizeAndRelocateHandles(
                    relativeHandle,
                    containerRect[dimension] - maxDimensionsPx[dimension],
                    dimension,
                    axis,
                );
            }
        }
    };

    resizable.on = (event, callback) => {
        callbacks.push({ event: event, execute: callback });
        return resizable;
    };

    resizable.zIndex = (input) => {
        zIndex = input;
        return resizable;
    };

    resizable.settings = (...args) => {
        if (!args.length) {
            return settings;
        }
        settings = args[0];
        return resizable;
    };

    resizable.minWidth = (input) => {
        minDimensionsPx.width = input;
        if (!!maxDimensionsPx.width)
            maxDimensionsPx.width = Math.max(
                minDimensionsPx.width,
                maxDimensionsPx.width,
            );
        return resizable;
    };

    resizable.minHeight = (input) => {
        minDimensionsPx.height = input;
        if (!!maxDimensionsPx.height)
            maxDimensionsPx.height = Math.max(
                minDimensionsPx.height,
                maxDimensionsPx.height,
            );
        return resizable;
    };

    resizable.handleWidth = (input) => {
        handleWidthPx = input;
        return resizable;
    };

    resizable.maxWidth = (input) => {
        maxDimensionsPx.width = input;
        minDimensionsPx.width = Math.min(
            minDimensionsPx.width,
            maxDimensionsPx.width,
        );
        return resizable;
    };

    resizable.maxHeight = (input) => {
        maxDimensionsPx.height = input;
        minDimensionsPx.height = Math.min(
            minDimensionsPx.height,
            maxDimensionsPx.height,
        );
        return resizable;
    };

    function pointerFallenBehindAbsoluteCoordinates(
        offset,
        axis,
        handle,
        event,
    ) {
        const becauseCrossedMinSize = (offset, axis, handle, event) =>
            offset < 0 && event[axis] < Number(handle.attr(axis));
        const becauseExitedCoordinateSpace = (offset, axis, handle, event) =>
            offset > 0 && event[axis] > Number(handle.attr(axis));
        return (
            becauseCrossedMinSize(offset, axis, handle, event) ||
            becauseExitedCoordinateSpace(offset, axis, handle, event)
        );
    }

    function enforceDistToParallelBarConstraints(
        offset,
        dragHandleContainer,
        dimension,
        operatorFunction,
    ) {
        const anticipatedDimension = operatorFunction(
            Number(dragHandleContainer.attr(dimension)),
            offset,
        );
        if (anticipatedDimension < minDimensionsPx[dimension]) {
            const difference =
                minDimensionsPx[dimension] - anticipatedDimension;
            return operatorFunction(offset, difference);
        }
        if (
            !!maxDimensionsPx[dimension] &&
            anticipatedDimension > maxDimensionsPx[dimension]
        ) {
            const difference =
                maxDimensionsPx[dimension] - anticipatedDimension;
            return operatorFunction(offset, difference);
        }
        return offset;
    }

    return resizable;
}

// "dimension" referring to width or height
const extendPerpendicularHandles = (
    handles,
    offset,
    dimension,
    orientationClass,
) => {
    const perpendicularHandles = handles.selectAll(`.${orientationClass}`);
    perpendicularHandles.each((_, i, nodes) => {
        const handleNode = nodes[i];
        const handleElement = d3.select(handleNode);
        handleElement.attr(
            dimension,
            handleNode.getBoundingClientRect()[dimension] - offset,
        );
    });
};

const handlesContainerExists = (container) =>
    container.select(`#${handlesContainerId}`).size() > 0;

const pinHandleToHandleBoxEdge = (handle, axis, offset) =>
    handle.attr(axis, Number(handle.attr(axis)) - offset);

const extendHandlesBox = (handles, dimension, offset) =>
    handles.attr(
        dimension,
        handles.node().getBoundingClientRect()[dimension] - offset,
    );
