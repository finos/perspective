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

export function enableDragging(element) {
    const node = element.node();
    node.style.cursor = "move";

    const drag = d3.drag().on("drag", function() {
        const [offsetX, offsetY] = enforceContainerBoundaries(this, d3.event.dx, d3.event.dy);
        this.style.left = `${this.offsetLeft + offsetX}px`;
        this.style.top = `${this.offsetTop + offsetY}px`;
    });

    element.call(drag);
}

function enforceContainerBoundaries(legendNode, offsetX, offsetY) {
    const chartNodeRect = d3
        .select(getChartElement(legendNode).getContainer())
        .node()
        .getBoundingClientRect();

    const legendNodeRect = legendNode.getBoundingClientRect();

    const margin = 10;
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
