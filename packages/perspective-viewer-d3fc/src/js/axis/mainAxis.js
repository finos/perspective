/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";

export const scale = () => d3.scaleLinear();

export const domain = (settings, data) => {
    const extent = getDataExtentFromArray(data);
    return [extent[0] > 0 ? 0 : extent[0] * 1.1, extent[1] < 0 ? 0 : extent[1] * 1.1];
};

const getDataExtentFromArray = array => {
    const dataExtent = array.map(getDataExtentFromValue);
    const extent = flattenExtent(dataExtent);
    return extent;
};

const getDataExtentFromValue = value => {
    if (Array.isArray(value)) {
        return getDataExtentFromArray(value);
    }
    return [value.mainValue, value.mainValue];
};

export const label = settings => settings.mainValues.map(v => v.name).join(", ");

function flattenExtent(array) {
    const withUndefined = fn => (a, b) => {
        if (a === undefined) return b;
        if (b === undefined) return a;
        return fn(a, b);
    };
    return array.reduce((r, v) => [withUndefined(Math.min)(r[0], v[0]), withUndefined(Math.max)(r[1], v[1])], [undefined, undefined]);
}
