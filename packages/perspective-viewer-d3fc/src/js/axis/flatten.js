/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export const flattenExtent = (array) => {
    const withUndefined = (fn) => (a, b) => {
        if (a === undefined) return b;
        if (b === undefined) return a;
        return fn(a, b);
    };
    return array.reduce(
        (r, v) => [
            withUndefined(Math.min)(r[0], v[0]),
            withUndefined(Math.max)(r[1], v[1]),
        ],
        [undefined, undefined]
    );
};

export const flattenArray = (array) => {
    if (Array.isArray(array)) {
        return [].concat(...array.map(flattenArray));
    } else {
        return [array];
    }
};
