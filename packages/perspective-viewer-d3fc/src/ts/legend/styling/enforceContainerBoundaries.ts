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
import { isElementOverflowing } from "../../utils/utils";
import { getChartElement } from "../../plugin/root";
import { NodeRect, Orient } from "../../types";

export const margin = 10;

export type AdjustedOffsets = {
    x: number;
    y: number;
};

export function enforceContainerBoundaries(
    innerNode: Element,
    offsetX: number,
    offsetY: number,
): AdjustedOffsets {
    const chartNodeRect: DOMRect = d3
        .select(getChartElement(innerNode).getContainer())
        .node()
        .getBoundingClientRect();

    const innerNodeRect: NodeRect = innerNode.getBoundingClientRect();

    const draggedInnerNodeRect: NodeRect = {
        top: innerNodeRect.top + offsetY - margin,
        right: innerNodeRect.right + offsetX + margin,
        bottom: innerNodeRect.bottom + offsetY + margin,
        left: innerNodeRect.left + offsetX - margin,
    };

    const adjustedOffsets: AdjustedOffsets = { x: offsetX, y: offsetY };
    const boundaries: { edge: Orient; dimension: "x" | "y" }[] = [
        { edge: "right", dimension: "x" },
        { edge: "left", dimension: "x" },
        { edge: "top", dimension: "y" },
        { edge: "bottom", dimension: "y" },
    ];

    boundaries.forEach((bound) => {
        if (
            isElementOverflowing(
                chartNodeRect,
                draggedInnerNodeRect,
                bound.edge,
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
