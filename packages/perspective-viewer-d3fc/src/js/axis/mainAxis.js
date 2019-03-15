/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
import * as fc from "d3fc";
import {extentLinear as customExtent} from "../d3fc/extent/extentLinear";

export const scale = () => d3.scaleLinear();

export const domain = () => {
    let lowerValueName = "mainValue";
    let upperValueName = lowerValueName;

    const extentLinear = customExtent()
        .pad([0, 0.1])
        .padUnit("percent");

    const _domain = function(data) {
        const extent = getDataExtentFromArray(data, lowerValueName, upperValueName);
        return extentLinear(extent);
    };

    fc.rebindAll(_domain, extentLinear);

    // set both upper and lower values to the supplied value
    _domain.valueName = (...args) => {
        if (!args.length) {
            return lowerValueName;
        }
        lowerValueName = args[0];
        upperValueName = lowerValueName;
        return _domain;
    };

    _domain.lowerValueName = (...args) => {
        if (!args.length) {
            return lowerValueName;
        }
        lowerValueName = args[0];
        return _domain;
    };

    _domain.upperValueName = (...args) => {
        if (!args.length) {
            return upperValueName;
        }
        upperValueName = args[0];
        return _domain;
    };

    return _domain;
};

const getDataExtentFromArray = (array, lowerValueName, upperValueName) => {
    const dataExtent = array.map(v => getDataExtentFromValue(v, lowerValueName, upperValueName));
    const extent = flattenExtent(dataExtent);
    return extent;
};

const getDataExtentFromValue = (value, lowerValueName, upperValueName) => {
    if (Array.isArray(value)) {
        return getDataExtentFromArray(value, lowerValueName, upperValueName);
    }
    return [value[lowerValueName], value[upperValueName]];
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
