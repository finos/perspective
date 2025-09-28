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

import { NodeRect, Orient } from "../types";

export function getOrCreateElement(container, selector, createCallback) {
    let element = container.select(selector);
    return element.size() > 0 ? element : createCallback();
}

export function isElementOverflowing(
    containerRect: DOMRect,
    innerElementRect: NodeRect,
    direction: Orient = "right",
) {
    if (direction === "right" || direction === "bottom") {
        return containerRect[direction] < innerElementRect[direction]
            ? true
            : false;
    }

    if (direction === "left" || direction === "top") {
        return containerRect[direction] > innerElementRect[direction]
            ? true
            : false;
    }

    throw `Direction being checked for overflow is invalid: ${direction}`;
}

export function isElementOverlapping(
    axis: "x" | "y",
    immovableRect: DOMRect,
    elementRect: DOMRect,
    fuzz = 0,
) {
    const dimension = axis === "x" ? "width" : "height";

    const immovableInnerPoint = immovableRect[axis];
    const immovableOuterPoint = immovableRect[axis] + immovableRect[dimension];

    const elementInnerPoint = elementRect[axis];
    const elementOuterPoint = elementRect[axis] + elementRect[dimension];

    const innerPointInside =
        elementInnerPoint + fuzz > immovableInnerPoint &&
        elementInnerPoint - fuzz < immovableOuterPoint;
    const outerPointInside =
        elementOuterPoint + fuzz > immovableInnerPoint &&
        elementOuterPoint - fuzz < immovableOuterPoint;
    const pointsEitherSide =
        elementInnerPoint + fuzz < immovableInnerPoint &&
        elementOuterPoint - fuzz > immovableOuterPoint;

    return innerPointInside || outerPointInside || pointsEitherSide;
}
