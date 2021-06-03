/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * Tests the correctness of each datetime computation function in various
 * environments and parameters - different types, nulls, undefined, etc.
 */
module.exports = perspective => {
    describe("integer()", () => {
        it("Should create integers from scalars", async () => {
            const table = await perspective.table({x: [1]});
            const view = await table.view({
                expressions: [
                    `//computed\ninteger(999999.999)`,
                    `//computed2\ninteger(2147483648)`,
                    `//computed3\ninteger(-2147483649)`,
                    `//computed4\ninteger(123456789)`,
                    `//computed5\ninteger(0.00001)`,
                    `//computed6\ninteger(1.9999999999)`,
                    `//computed7\ninteger(2147483647)`,
                    `//computed8\ninteger(-2147483647)`
                ]
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual([999999]);
            expect(result["computed2"]).toEqual([null]);
            expect(result["computed3"]).toEqual([null]);
            expect(result["computed4"]).toEqual([123456789]);
            expect(result["computed5"]).toEqual([0]);
            expect(result["computed6"]).toEqual([1]);
            expect(result["computed7"]).toEqual([2147483647]);
            expect(result["computed8"]).toEqual([-2147483647]);

            await view.delete();
            await table.delete();
        });

        it("Should create integers from integer columns", async () => {
            const table = await perspective.table({x: "integer"});

            const view = await table.view({
                expressions: [`//computed\ninteger("x")`]
            });

            table.update({
                x: [100, -17238.8123, 0.890798, -1.1295, null, 12836215.128937]
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual([100, -17238, 0, -1, null, 12836215]);

            await view.delete();
            await table.delete();
        });

        it("Should create integers from float columns", async () => {
            const table = await perspective.table({x: "float"});

            const view = await table.view({
                expressions: [`//computed\ninteger("x")`]
            });

            table.update({
                x: [100.9999999, -17238.8123, 0.890798, -1.1295, null, 12836215.128937]
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual([100, -17238, 0, -1, null, 12836215]);

            await view.delete();
            await table.delete();
        });

        it("Should create integers from date columns", async () => {
            const table = await perspective.table({x: "date"});

            const view = await table.view({
                expressions: [`//computed\ninteger("x")`]
            });

            const value = new Date(2020, 5, 30);

            table.update({
                x: [value]
            });

            const result = await view.to_columns();

            // The custom format that Perspective uses to store dates - we
            // can validate correctness by applying bitmask/shifting.
            const expected = 132384030;

            expect(result["computed"]).toEqual([expected]);

            const year = (expected & 0xffff0000) >> 16;
            const month = (expected & 0x0000ff00) >> 8;
            const day = (expected & 0x000000ff) >> 0;

            expect(year).toEqual(2020);
            expect(month).toEqual(5);
            expect(day).toEqual(30);

            await view.delete();
            await table.delete();
        });

        it("Should create integers from datetime columns", async () => {
            const table = await perspective.table({x: "datetime"});

            const view = await table.view({
                expressions: [`//computed\ninteger("x")`]
            });

            // first will not overflow, second will
            table.update({
                x: [new Date(1970, 0, 1, 1), new Date(2020, 0, 1, 1)]
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual([new Date(1970, 0, 1, 1).getTime(), null]);

            await view.delete();
            await table.delete();
        });

        it("Should validate types", async () => {
            const table = await perspective.table({x: "string"});
            const validated = await table.validate_expressions([`integer('abc')`, `integer("x")`]);
            expect(validated.expression_schema).toEqual({});
            await table.delete();
        });
    });

    describe("float()", () => {
        it("Should create float from scalars", async () => {
            const table = await perspective.table({x: [1]});
            const view = await table.view({
                expressions: [
                    `//computed\n float(999999.999)`,
                    `//computed2\n float(2147483648)`,
                    `//computed3\n float(-2147483649)`,
                    `//computed4\n float(123456789)`,
                    `//computed5\n float(0.00001)`,
                    `//computed6\n float(1.9999999992)`,
                    `//computed7\n float(2147483647.1234567)`,
                    `//computed8\n float(-2147483647)`
                ]
            });

            expect(await view.expression_schema()).toEqual({
                computed: "float",
                computed2: "float",
                computed3: "float",
                computed4: "float",
                computed5: "float",
                computed6: "float",
                computed7: "float",
                computed8: "float"
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual([999999.999]);
            expect(result["computed2"]).toEqual([2147483648]);
            expect(result["computed3"]).toEqual([-2147483649]);
            expect(result["computed4"]).toEqual([123456789]);
            expect(result["computed5"]).toEqual([0.00001]);
            expect(result["computed6"]).toEqual([1.9999999992]);
            expect(result["computed7"]).toEqual([2147483647.1234567]);
            expect(result["computed8"]).toEqual([-2147483647]);

            await view.delete();
            await table.delete();
        });

        it("Should create float from integer columns", async () => {
            const table = await perspective.table({x: "integer"});

            const view = await table.view({
                expressions: [`//computed\nfloat("x")`]
            });

            table.update({
                x: [100, -17238.8123, 0.890798, -1.1295, null, 12836215.128937]
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual([100, -17238, 0, -1, null, 12836215]);

            await view.delete();
            await table.delete();
        });

        it("Should create float from float columns", async () => {
            const table = await perspective.table({x: "float"});

            const view = await table.view({
                expressions: [`//computed\n float("x")`]
            });

            table.update({
                x: [100.9999999, -17238.8123, 0.890798, -1.1295, null, 12836215.128937]
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual([100.9999999, -17238.8123, 0.890798, -1.1295, null, 12836215.128937]);

            await view.delete();
            await table.delete();
        });

        it("Should create float from date columns", async () => {
            const table = await perspective.table({x: "date"});

            const view = await table.view({
                expressions: [`//computed\nfloat("x")`]
            });

            const value = new Date(2020, 5, 30);

            table.update({
                x: [value]
            });

            const result = await view.to_columns();

            // The custom format that Perspective uses to store dates - we
            // can validate correctness by applying bitmask/shifting.
            const expected = 132384030;

            expect(result["computed"]).toEqual([expected]);

            const year = (expected & 0xffff0000) >> 16;
            const month = (expected & 0x0000ff00) >> 8;
            const day = (expected & 0x000000ff) >> 0;

            expect(year).toEqual(2020);
            expect(month + 1).toEqual(6);
            expect(day).toEqual(30);

            await view.delete();
            await table.delete();
        });

        it("Should create float from datetime columns", async () => {
            const table = await perspective.table({x: "datetime"});

            const view = await table.view({
                expressions: [`//computed\nfloat("x")`]
            });

            table.update({
                x: [new Date(2020, 0, 1, 1), new Date(2020, 0, 1, 1, 50)]
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual([new Date(2020, 0, 1, 1).getTime(), new Date(2020, 0, 1, 1, 50).getTime()]);

            await view.delete();
            await table.delete();
        });

        it("Should validate types", async () => {
            const table = await perspective.table({x: "string"});
            const validated = await table.validate_expressions([`float('abc')`, `float("x")`]);
            expect(validated.expression_schema).toEqual({});
            await table.delete();
        });
    });

    describe("date()", () => {
        it("Should create a date from scalars", async () => {
            const table = await perspective.table({
                x: [1, 2, 3, 4]
            });

            const view = await table.view({
                expressions: [`//computed \n date(2020, 7, 15)`, `//computed2 \n date(1970, 10, 29)`, `//computed3\n date(2020, 1, "x")`]
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual(Array(4).fill(new Date(2020, 6, 15).getTime()));
            expect(result["computed2"]).toEqual(Array(4).fill(new Date(1970, 9, 29).getTime()));
            expect(result["computed3"]).toEqual(
                Array(4)
                    .fill(true)
                    .map((_, idx) => new Date(2020, 0, idx + 1).getTime())
            );
            await view.delete();
            await table.delete();
        });

        it("Should create a date from int columns", async () => {
            const table = await perspective.table({
                y: "integer",
                m: "integer",
                d: "integer"
            });

            const view = await table.view({
                expressions: [`//computed \n date("y", "m", "d")`]
            });

            table.update({
                y: [0, 2020, 1776, 2018, 2020, 2020],
                m: [1, 2, 5, 2, 12, null],
                d: [1, 29, 31, 29, 31, 1]
            });

            const result = await view.to_columns();
            const expected = [new Date(1900, 0, 1), new Date(2020, 1, 29), new Date(1776, 4, 31), new Date(2018, 1, 29), new Date(2020, 11, 31)].map(x => x.getTime());
            expected.push(null);
            expect(result["computed"]).toEqual(expected);
            await view.delete();
            await table.delete();
        });

        it("Should create a date from float columns", async () => {
            const table = await perspective.table({
                y: "float",
                m: "float",
                d: "float"
            });

            const view = await table.view({
                expressions: [`//computed \n date("y", "m", "d")`]
            });

            table.update({
                y: [0, 2020, 1776, 2018, 2020, 2020],
                m: [1, 2, 5, 2, 12, null],
                d: [1, 29, 31, 29, 31, 1]
            });

            const result = await view.to_columns();
            const expected = [new Date(1900, 0, 1), new Date(2020, 1, 29), new Date(1776, 4, 31), new Date(2018, 1, 29), new Date(2020, 11, 31)].map(x => x.getTime());
            expected.push(null);
            expect(result["computed"]).toEqual(expected);
            await view.delete();
            await table.delete();
        });

        it("Should create a date from numeric columns and skip invalid values", async () => {
            const table = await perspective.table({
                y: [-100, 0, 2000, 3000],
                m: [12, 0, 12, 11],
                d: [1, 10, 32, 10]
            });

            const view = await table.view({
                expressions: [`//computed \n date("y", "m", "d")`]
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual([null, null, null, new Date(3000, 10, 10).getTime()]);
            await view.delete();
            await table.delete();
        });

        it("Should create a date from variables inside expression", async () => {
            const table = await perspective.table({
                x: [20200101, 20090531, 19801220, 20200229]
            });

            const view = await table.view({
                expressions: [`//computed \n var year := floor("x" / 10000); var month := floor("x" % 10000 / 100); var day := floor("x" % 100); date(year, month, day)`]
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual([new Date(2020, 0, 1), new Date(2009, 4, 31), new Date(1980, 11, 20), new Date(2020, 1, 29)].map(x => x.getTime()));
            await view.delete();
            await table.delete();
        });

        it("Should validate inputs", async () => {
            const table = await perspective.table({
                y: [-100, 0, 2000, 3000],
                m: [12, 0, 12, 11],
                d: [1, 10, 32, 10]
            });

            const validated = await table.validate_expressions([`//computed \n date()`, `//computed2 \n date('abc', 'def', '123')`, `//computed3\ndate("y", "m", "d")`]);

            expect(validated.expression_schema).toEqual({
                computed3: "date"
            });

            expect(validated.errors).toEqual({
                computed: "Parser Error - Zero parameter call to generic function: date not allowed",
                computed2: "Type Error - inputs do not resolve to a valid expression."
            });

            await table.delete();
        });
    });

    describe("datetime()", () => {
        it("Should create a datetime from scalars", async () => {
            const table = await perspective.table({
                x: [1, 2, 3, 4]
            });

            const a = new Date(2005, 6, 31, 11, 59, 32).getTime();
            const b = new Date(2005, 6, 31, 11, 59, 32).getTime();

            const view = await table.view({
                expressions: [`//computed \n datetime(${a})`, `//computed2 \n datetime(${b})`]
            });

            expect(await view.expression_schema()).toEqual({
                computed: "datetime",
                computed2: "datetime"
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual(Array(4).fill(a));
            expect(result["computed2"]).toEqual(Array(4).fill(b));
            await view.delete();
            await table.delete();
        });

        it("Should not create a datetime from int columns as int32 is too small", async () => {
            const table = await perspective.table({
                x: "integer"
            });

            const view = await table.view({
                expressions: [`//computed \n datetime("x")`]
            });

            const data = [new Date(2020, 1, 29, 5, 1, 2), new Date(1776, 4, 31, 13, 23, 18), new Date(2018, 1, 29, 19, 39, 43), new Date(2020, 11, 31, 23, 59, 59)].map(x => x.getTime());
            data.push(null);

            table.update({
                x: data
            });

            let result = await view.to_columns();

            expect(result["computed"]).toEqual(Array(5).fill(null));
            await view.delete();
            await table.delete();
        });

        it("Should create a datetime from float columns", async () => {
            const table = await perspective.table({
                x: "float"
            });

            const view = await table.view({
                expressions: [`//computed \n datetime("x")`]
            });

            const data = [new Date(2020, 1, 29, 5, 1, 2), new Date(1776, 4, 31, 13, 23, 18), new Date(2018, 1, 29, 19, 39, 43), new Date(2020, 11, 31, 23, 59, 59)].map(x => x.getTime());
            data.push(null);

            table.update({
                x: data
            });

            const result = await view.to_columns();
            expect(result["computed"]).toEqual(data);
            await view.delete();
            await table.delete();
        });

        it("Should create a datetime from numeric scalars < 0", async () => {
            const table = await perspective.table({
                x: [1]
            });

            const view = await table.view({
                expressions: [`//computed1 \n datetime(-1)`, `//computed2 \n datetime(0)`, `//computed3 \n datetime(${new Date(2002, 11, 12, 13, 14, 15).getTime()})`]
            });

            expect(await view.expression_schema()).toEqual({
                computed1: "datetime",
                computed2: "datetime",
                computed3: "datetime"
            });

            const result = await view.to_columns();

            expect(result["computed1"]).toEqual([-1]);
            expect(result["computed2"]).toEqual([0]);
            expect(result["computed3"]).toEqual([new Date(2002, 11, 12, 13, 14, 15).getTime()]);
            await view.delete();
            await table.delete();
        });

        it("Should validate inputs", async () => {
            const table = await perspective.table({
                x: [1]
            });

            const validated = await table.validate_expressions([
                `//computed1 \n datetime()`,
                `//computed2 \n datetime('abcd')`,
                `//computed3 \n datetime(today())`,
                `//computed4 \n datetime(now())`,
                `//computed5 \n datetime(123456, 7)`
            ]);

            expect(validated.expression_schema).toEqual({});

            expect(validated.errors).toEqual({
                computed1: "Parser Error - Zero parameter call to generic function: datetime not allowed",
                computed2: "Type Error - inputs do not resolve to a valid expression.",
                computed3: "Type Error - inputs do not resolve to a valid expression.",
                computed4: "Type Error - inputs do not resolve to a valid expression.",
                computed5: "Parser Error - Failed parameter type check for function 'datetime', Expected 'T'  call set: 'TT'"
            });

            await table.delete();
        });
    });
};
