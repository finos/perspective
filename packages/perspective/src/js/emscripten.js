/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/** Translation layer Interface between C++ and JS to handle conversions/data
 * structures that were previously handled in non-portable perspective.js
 */

export const extract_vector = function (vector) {
    // handles deletion already - do not call delete() on the input vector again
    let extracted = [];
    for (let i = 0; i < vector.size(); i++) {
        let item = vector.get(i);
        extracted.push(item);
    }
    vector.delete();
    return extracted;
};

export const extract_map = function (map) {
    // handles deletion already - do not call delete() on the input map again
    let extracted = {};
    let keys = map.keys();
    for (let i = 0; i < keys.size(); i++) {
        let key = keys.get(i);
        extracted[key] = map.get(key);
    }
    map.delete();
    keys.delete();
    return extracted;
};

/**
 * Given a C++ vector constructed in Emscripten, fill it with data. Assume that
 * data types are already validated, thus Emscripten will throw an error if the
 * vector is filled with the wrong type of data.
 *
 * @param {*} vector the `std::vector` to be filled
 * @param {Array} arr the `Array` from which to draw data
 *
 * @private
 */
export const fill_vector = function (vector, arr) {
    for (const elem of arr) {
        vector.push_back(elem);
    }
    return vector;
};
