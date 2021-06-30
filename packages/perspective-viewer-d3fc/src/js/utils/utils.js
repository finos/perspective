/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export function getOrCreateElement(container, selector, createCallback) {
    let element = container.select(selector);
    return element.size() > 0 ? element : createCallback();
}

export function isElementOverflowing(containerRect, innerElementRect, direction = "right") {
    if (direction === "right" || direction === "bottom") {
        return containerRect[direction] < innerElementRect[direction] ? true : false;
    }

    if (direction === "left" || direction === "top") {
        return containerRect[direction] > innerElementRect[direction] ? true : false;
    }

    throw `Direction being checked for overflow is invalid: ${direction}`;
}

export function isElementOverlapping(axis, immovableRect, elementRect, fuzz = 0) {
    const dimension = axis === "x" ? "width" : "height";

    const immovableInnerPoint = immovableRect[axis];
    const immovableOuterPoint = immovableRect[axis] + immovableRect[dimension];

    const elementInnerPoint = elementRect[axis];
    const elementOuterPoint = elementRect[axis] + elementRect[dimension];

    const innerPointInside = elementInnerPoint + fuzz > immovableInnerPoint && elementInnerPoint - fuzz < immovableOuterPoint;
    const outerPointInside = elementOuterPoint + fuzz > immovableInnerPoint && elementOuterPoint - fuzz < immovableOuterPoint;
    const pointsEitherSide = elementInnerPoint + fuzz < immovableInnerPoint && elementOuterPoint - fuzz > immovableOuterPoint;

    return innerPointInside || outerPointInside || pointsEitherSide;
}
