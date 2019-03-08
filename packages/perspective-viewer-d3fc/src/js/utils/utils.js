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

export function getSVGPlotAreaValues(container) {
    const plotArea = container.select(".plot-area");
    const yAxis = container.select("d3fc-svg.y-axis");
    const xOffset = yAxis._groups[0][0].offsetWidth + yAxis._groups[0][0].offsetLeft;
    const {offsetTop, clientHeight} = plotArea._groups[0][0];
    const yOffset = offsetTop;

    return {xOffset, yOffset, clientHeight};
}
