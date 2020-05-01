/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export function getChartElement(element) {
    return element.getRootNode().host;
}

export function getChartContainer(element) {
    return element.closest("#container.chart");
}
