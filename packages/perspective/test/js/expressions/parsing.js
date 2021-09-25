/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const common = require("./common.js");

/**
 * Tests the correctness of each datetime computation function in various
 * environments and parameters - different types, nulls, undefined, etc.
 */
module.exports = (perspective) => {
    describe("bucket() function", function () {
        describe("parses arguments separated by arbitrary whitespace", function () {
            for (const [title, expression] of [
                ["space before", `bucket( "a",'Y')`],
                ["space after", `bucket("a",'Y' )`],
                ["space between", `bucket("a", 'Y')`],
                ["two spaces before", `bucket(  "a",'Y')`],
                ["two spaces after", `bucket("a",'Y'  )`],
                ["two spaces between", `bucket("a",  'Y')`],
                ["space before between and after", `bucket( "a", 'Y' )`],
                [
                    "two spaces before between and after",
                    `bucket(  "a",  'Y'  )`,
                ],
            ]) {
                it(title, async function () {
                    const table = await perspective.table({
                        a: "datetime",
                    });

                    const view = await table.view({
                        expressions: [expression],
                    });

                    table.update({
                        a: [
                            new Date(2020, 0, 12),
                            new Date(2020, 0, 15),
                            new Date(2021, 11, 17),
                            new Date(2019, 2, 18),
                            new Date(2019, 2, 29),
                        ],
                    });

                    let result = await view.to_columns();
                    expect(
                        result[expression].map((x) => (x ? new Date(x) : null))
                    ).toEqual(result.a.map((x) => common.year_bucket(x)));

                    view.delete();
                    table.delete();
                });
            }
        });
    });
};
