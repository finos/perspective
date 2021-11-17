/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {treeData} = require("../../../../src/js/data/treeData");
const {
    data,
    splitData,
    mainValues,
    crossValues,
    realValues,
    agg_paths,
} = require("./testTreeData");

describe("treeData should", () => {
    test("create a structure with the right number of levels", () => {
        const {data: result} = treeData({
            data,
            agg_paths,
            mainValues,
            crossValues,
            realValues,
        })[0];
        expect(result.height).toEqual(2);
    });

    test("calculate the correct color extents", () => {
        const {extents} = treeData({
            data,
            agg_paths,
            mainValues,
            crossValues,
            realValues,
        })[0];
        expect(extents).toEqual([1544, 4156]);
    });

    test("produce tree data for each split", () => {
        const result = treeData({
            data: splitData,
            agg_paths,
            mainValues,
            crossValues,
            realValues,
        });
        expect(result.length).toEqual(4);
    });
});
