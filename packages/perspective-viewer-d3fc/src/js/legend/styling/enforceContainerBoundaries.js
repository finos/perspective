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

export const margin = 10;

export function enforceContainerBoundaries(innerNode, offsetX, offsetY) {
    const chartNodeRect = d3
        .select(getChartElement(innerNode).getContainer())
        .node()
        .getBoundingClientRect();

    const innerNodeRect = innerNode.getBoundingClientRect();

    const draggedInnerNodeRect = {
        top: innerNodeRect.top + offsetY - margin,
        right: innerNodeRect.right + offsetX + margin,
        bottom: innerNodeRect.bottom + offsetY + margin,
        left: innerNodeRect.left + offsetX - margin,
    };

    const adjustedOffsets = {x: offsetX, y: offsetY};
    const boundaries = [
        {edge: "right", dimension: "x"},
        {edge: "left", dimension: "x"},
        {edge: "top", dimension: "y"},
        {edge: "bottom", dimension: "y"},
    ];

    boundaries.forEach((bound) => {
        if (
            isElementOverflowing(
                chartNodeRect,
                draggedInnerNodeRect,
                bound.edge
            )
        ) {
            const adjustment =
                draggedInnerNodeRect[bound.edge] - chartNodeRect[bound.edge];
            adjustedOffsets[bound.dimension] =
                adjustedOffsets[bound.dimension] - adjustment;
        }
    });

    return adjustedOffsets;
}
