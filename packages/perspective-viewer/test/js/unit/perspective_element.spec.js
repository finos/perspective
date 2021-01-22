/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {PerspectiveElement} from "../../../src/js/viewer/perspective_element";

describe(PerspectiveElement, () => {
    describe(".get_maxes", () => {
        let max_cells, max_columns, num_columns, num_columns_fn, perspective_element, schema, schema_fn;

        beforeEach(() => {
            perspective_element = new PerspectiveElement();
            num_columns_fn = jest.fn(() => num_columns);
            schema_fn = jest.fn(() => schema);

            perspective_element._view = {
                schema: schema_fn,
                num_columns: num_columns_fn
            };

            Object.defineProperty(perspective_element, "_plugin", {
                get: () => {
                    return {
                        max_columns,
                        max_cells
                    };
                }
            });
        });

        describe("when schema is empty and no columns", () => {
            beforeEach(() => {
                schema = {};
                num_columns = 0;
            });

            test("the max cols and max rows are undefined", async done => {
                const {max_cols, max_rows} = await perspective_element.get_maxes();
                expect(max_cols).toEqual(undefined);
                expect(max_rows).toEqual(undefined);
                done();
            });
        });

        describe("when columns do NOT exceed max columns", () => {
            beforeEach(() => {
                num_columns = 1;
                max_columns = 2;
            });

            test("the max_cols is undefined", async done => {
                const {max_cols} = await perspective_element.get_maxes();
                expect(max_cols).toEqual(undefined);
                done();
            });
        });

        describe("when columns exceed max columns", () => {
            test("the max columns is the max", async done => {
                num_columns = 2;
                max_columns = 1;

                const {max_cols, max_rows} = await perspective_element.get_maxes();
                expect(max_cols).toEqual(1);
                expect(max_rows).toEqual(undefined);
                done();
            });

            describe("when schema columns present", () => {
                test("the max columns is extended to include the full column group", async done => {
                    num_columns = 100;
                    schema = {one: 1, two: 2};
                    max_columns = 3;

                    const {max_cols, max_rows} = await perspective_element.get_maxes();
                    expect(max_cols).toEqual(4);
                    expect(max_rows).toEqual(undefined);
                    done();
                });
            });
        });

        describe("when max cells exists", () => {
            beforeEach(() => {
                max_cells = 2;
                num_columns = 1;
                max_columns = undefined;
            });

            test("the max rows is the max cell", async done => {
                const {max_cols, max_rows} = await perspective_element.get_maxes();
                expect(max_cols).toEqual(undefined);
                expect(max_rows).toEqual(2);
                done();
            });
        });

        describe("when columns exceed max columns and max cells exists", () => {
            beforeEach(() => {
                max_cells = 10;
                max_columns = 2;
                num_columns = 4;
                schema = {};
            });

            test("the max columns is set and max rows * max cols = max cells", async done => {
                const {max_cols, max_rows} = await perspective_element.get_maxes();
                expect(max_cols).toEqual(2);
                expect(max_rows).toEqual(5);
                expect(max_cols * max_rows).toEqual(max_cells);
                done();
            });
        });
    });
});
