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
