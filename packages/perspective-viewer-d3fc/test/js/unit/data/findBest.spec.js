/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {findBestFromData} = require("../../../../src/js/data/findBest");

describe("findBestFromData should", () => {
    const compareFn = Math.max;

    test("find the right value using the compareFn", () => {
        const array = [1, 2, 3, 4, 5];
        const result = findBestFromData(array, (d) => d, compareFn);
        expect(result).toEqual(5);
    });

    test("work for stacked arrays", () => {
        const array = [[1, 2, 3], 4, 5, [6, [7, 8]]];
        const result = findBestFromData(array, (d) => d, compareFn);
        expect(result).toEqual(8);
    });
});
