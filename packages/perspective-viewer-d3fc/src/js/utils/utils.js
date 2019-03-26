/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export function areArraysEqualSimple(arr1, arr2) {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
}

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
