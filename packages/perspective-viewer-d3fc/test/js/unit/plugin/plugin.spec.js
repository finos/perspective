/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

jest.mock("../../../../src/less/chart.less", () => jest.fn());

jest.mock("../../../../src/js/charts/charts", () => {
    return [
        {
            plugin: {
                type: "CHART_TYPE"
            }
        }
    ];
});

import {limit_data} from "../../../../src/js/plugin/plugin";

describe("limit_data", () => {
    let limit_fn;

    describe("when data is undefined", () => {
        beforeEach(() => {
            limit_fn = limit_data(2, 2);
        });

        test("truncates the data", () => {
            expect(limit_fn(undefined)).toEqual([]);
        });
    });

    describe("when data is empty", () => {
        const data = [];

        beforeEach(() => {
            limit_fn = limit_data(2, 2);
        });

        test("truncates the data", () => {
            expect(limit_fn(data)).toEqual([]);
        });
    });

    describe("when data exceeds the limit", () => {
        const data = [{__ROW_PATH__: ["Copiers"], x: 1}, {__ROW_PATH__: ["Phones"], x: 2}, {__ROW_PATH__: ["Furnishings"], x: 3}, {__ROW_PATH__: ["Envelopes"], x: 4}];

        beforeEach(() => {
            limit_fn = limit_data(2, 10);
        });

        test("truncates the data", () => {
            expect(limit_fn(data)).toEqual([{__ROW_PATH__: ["Copiers"], x: 1}, {__ROW_PATH__: ["Phones"], x: 2}]);
        });
    });

    describe("when virtual column count exceeded", () => {
        const data = [
            {__ROW_PATH__: ["Copiers"], "Central|Sales": 1, "East|Sales": null, "South|Sales": null, "West|Sales": null},
            {__ROW_PATH__: ["Phones"], "Central|Sales": 2, "East|Sales": null, "South|Sales": 3, "West|Sales": null},
            {__ROW_PATH__: ["Furnishings"], "Central|Sales": 4, "East|Sales": null, "South|Sales": 5, "West|Sales": null},
            {__ROW_PATH__: ["Envelopes"], "Central|Sales": null, "East|Sales": null, "South|Sales": 6, "West|Sales": null}
        ];

        beforeEach(() => {
            limit_fn = limit_data(10, 2);
        });

        test("truncates the columns", () => {
            expect(limit_fn(data)).toEqual([
                {__ROW_PATH__: ["Copiers"], "Central|Sales": 1, "East|Sales": null},
                {__ROW_PATH__: ["Phones"], "Central|Sales": 2, "East|Sales": null},
                {__ROW_PATH__: ["Furnishings"], "Central|Sales": 4, "East|Sales": null},
                {__ROW_PATH__: ["Envelopes"], "Central|Sales": null, "East|Sales": null}
            ]);
        });
    });
});
