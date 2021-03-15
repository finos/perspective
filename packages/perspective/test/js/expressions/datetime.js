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
module.exports = perspective => {
    describe("Date, Arity 1 computed", function() {
        it("Hour of day, date", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Hour of Day",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "integer"
            });

            table.update({
                a: [new Date(), new Date(), new Date()]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual([0, 0, 0]);
            view.delete();
            table.delete();
        });

        it("Hour of day, date with null", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Hour of Day",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "integer"
            });

            table.update({
                a: [new Date(), null, undefined, new Date()]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual([0, null, null, 0]);
            view.delete();
            table.delete();
        });

        it("Day of week, date", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Day of Week",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "string"
            });

            table.update({
                a: [new Date(2020, 0, 26), new Date(2020, 0, 27), new Date(2020, 0, 28), new Date(2020, 0, 29), new Date(2020, 0, 30)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => common.days_of_week[new Date(x).getDay()]));
            view.delete();
            table.delete();
        });

        it("Day of week, date with null", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Day of Week",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "string"
            });

            table.update({
                a: [new Date(2020, 0, 26), null, undefined, new Date(2020, 0, 29), new Date(2020, 0, 30)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => (x ? common.days_of_week[new Date(x).getDay()] : null)));
            view.delete();
            table.delete();
        });

        it("Month of year, date", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Month of Year",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "string"
            });

            table.update({
                a: [new Date(2020, 0, 15), new Date(2020, 1, 27), new Date(2020, 2, 28), new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => common.months_of_year[new Date(x).getMonth()]));
            view.delete();
            table.delete();
        });

        it("Month of year, date with null", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Month of Year",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "string"
            });

            table.update({
                a: [new Date(2020, 0, 15), null, undefined, new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => (x ? common.months_of_year[new Date(x).getMonth()] : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (s), date", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (s)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 15), new Date(2020, 1, 27), new Date(2020, 2, 28), new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a);
            view.delete();
            table.delete();
        });

        it("Bucket (s), date", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (s)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 15), null, undefined, new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => (x ? x : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (m), date", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (m)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 15), new Date(2020, 1, 27), new Date(2020, 2, 28), new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a);
            view.delete();
            table.delete();
        });

        it("Bucket (m), date with nulls", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (m)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 15), null, undefined, new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => (x ? x : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (h), date", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (h)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 15), new Date(2020, 1, 27), new Date(2020, 2, 28), new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a);
            view.delete();
            table.delete();
        });

        it("Bucket (h), date with nulls", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (h)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 15), null, undefined, new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => (x ? x : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (D), date", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (D)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 15), new Date(2020, 1, 27), new Date(2020, 2, 28), new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a);
            view.delete();
            table.delete();
        });

        it("Bucket (D), date with null", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (D)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 15), null, undefined, new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => (x ? x : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (W), date", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (W)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2020, 0, 17), new Date(2020, 0, 18), new Date(2020, 0, 29)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => common.week_bucket(x)));
            view.delete();
            table.delete();
        });

        it("Bucket (W), date with null", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (W)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2020, 0, 17), new Date(2020, 0, 18), new Date(2020, 0, 29)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? common.week_bucket(x) : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (W), date shouldn't ever overflow at beginning of year", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (W)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2015, 0, 3, 15), new Date(2015, 0, 4)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => new Date(x))).toEqual(result.a.map(x => common.week_bucket(x)));
            view.delete();
            table.delete();
        });

        it("Bucket (M), date", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (M)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2020, 1, 17), new Date(2020, 2, 18), new Date(2020, 2, 29)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => common.month_bucket(x)));
            view.delete();
            table.delete();
        });

        it("Bucket (M), date with null", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (M)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 12), null, undefined, new Date(2020, 2, 18), new Date(2020, 2, 29)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? common.month_bucket(x) : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (Y), date", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (Y)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2021, 1, 17), new Date(2019, 2, 18), new Date(2019, 2, 29)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => common.year_bucket(x)));
            view.delete();
            table.delete();
        });

        it("Bucket (Y), date with null", async function() {
            const table = await perspective.table({
                a: "date"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (Y)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "date",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 12), null, undefined, new Date(2019, 2, 18), new Date(2019, 2, 29)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? common.year_bucket(x) : null)));
            view.delete();
            table.delete();
        });
    });

    describe("Datetime, Arity 1 computed", function() {
        it("Hour of day, datetime", async function() {
            const table = await perspective.table({
                a: "datetime"
            });
            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Hour of Day",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "integer"
            });

            table.update({
                a: [new Date(), new Date(), new Date()]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => new Date(x).getUTCHours()));
            view.delete();
            table.delete();
        });

        it("Hour of day, datetime with null", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Hour of Day",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "integer"
            });

            table.update({
                a: [new Date(), null, undefined, new Date()]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => (x ? new Date(x).getUTCHours() : null)));
            view.delete();
            table.delete();
        });

        it("Day of week, datetime", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Day of Week",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "string"
            });

            table.update({
                a: [new Date(2020, 0, 26, 1), new Date(2020, 0, 27, 2), new Date(2020, 0, 28, 3), new Date(2020, 0, 29, 4), new Date(2020, 0, 30, 5)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => common.days_of_week[new Date(x).getUTCDay()]));
            view.delete();
            table.delete();
        });

        it("Day of week, datetime with null", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Day of Week",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "string"
            });

            table.update({
                a: [new Date(2020, 0, 26, 1), null, undefined, new Date(2020, 0, 29, 4), new Date(2020, 0, 30, 5)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => (x ? common.days_of_week[new Date(x).getUTCDay()] : null)));
            view.delete();
            table.delete();
        });

        it("Month of year, datetime", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Month of Year",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "string"
            });

            table.update({
                a: [new Date(2020, 0, 15), new Date(2020, 1, 27), new Date(2020, 2, 28), new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => common.months_of_year[new Date(x).getUTCMonth()]));
            view.delete();
            table.delete();
        });

        it("Month of year, datetime", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Month of Year",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "string"
            });

            table.update({
                a: [new Date(2020, 0, 15), null, undefined, new Date(2020, 3, 29), new Date(2020, 4, 30), new Date(2020, 5, 31), new Date(2020, 6, 1)]
            });

            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => (x ? common.months_of_year[new Date(x).getUTCMonth()] : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (s), datetime", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (s)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "datetime"
            });

            table.update({
                a: [new Date(2020, 0, 15, 1, 30, 15), new Date(2020, 1, 27, 1, 30, 30), new Date(2020, 2, 28, 1, 30, 45), new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
            });

            let result = await view.to_columns();
            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => common.second_bucket(x)));
            view.delete();
            table.delete();
        });

        it("Bucket (s), datetime with null", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (s)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "datetime"
            });

            table.update({
                a: [new Date(2020, 0, 15, 1, 30, 15), null, undefined, new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
            });

            let result = await view.to_columns();
            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? common.second_bucket(x) : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (m), datetime", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (m)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "datetime"
            });

            table.update({
                a: [new Date(2020, 0, 15, 1, 30, 15), new Date(2020, 1, 27, 1, 30, 30), new Date(2020, 2, 28, 1, 30, 45), new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
            });

            let result = await view.to_columns();
            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => common.minute_bucket(x)));
            view.delete();
            table.delete();
        });

        it("Bucket (m), datetime with null", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (m)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "datetime"
            });

            table.update({
                a: [new Date(2020, 0, 15, 1, 30, 15), null, undefined, new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
            });

            let result = await view.to_columns();
            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? common.minute_bucket(x) : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (h), datetime", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (h)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "datetime"
            });

            table.update({
                a: [new Date(2020, 0, 15, 1, 30, 15), new Date(2020, 1, 27, 1, 30, 30), new Date(2020, 2, 28, 1, 30, 45), new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
            });

            let result = await view.to_columns();
            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => common.hour_bucket(x)));
            view.delete();
            table.delete();
        });

        it("Bucket (h), datetime with null", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (h)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "datetime"
            });

            table.update({
                a: [new Date(2020, 0, 15, 1, 30, 15), null, undefined, new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
            });

            let result = await view.to_columns();
            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? common.hour_bucket(x) : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (D), datetime", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (D)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 15, 1, 30, 15), new Date(2020, 1, 27, 1, 30, 30), new Date(2020, 2, 28, 1, 30, 45), new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
            });

            let result = await view.to_columns();
            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => common.day_bucket(x)));
            view.delete();
            table.delete();
        });

        it("Bucket (D), datetime with null", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (D)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 15, 1, 30, 15), null, undefined, new Date(2020, 3, 29, 1, 30, 0), new Date(2020, 4, 30, 1, 30, 15)]
            });

            let result = await view.to_columns();
            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? common.day_bucket(x) : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (D), datetime at UTC edge", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (D)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 15, 23, 30, 15), null, undefined, new Date(2020, 3, 29, 23, 30, 0), new Date(2020, 4, 30, 23, 30, 15)]
            });

            let result = await view.to_columns();
            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? common.day_bucket(x) : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (W), datetime", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (W)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2020, 0, 17), new Date(2020, 0, 18), new Date(2020, 0, 29)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => common.week_bucket(x)));
            view.delete();
            table.delete();
        });

        it("Bucket (W), datetime with null", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (W)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 12), null, undefined, new Date(2020, 0, 18), new Date(2020, 0, 29)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? common.week_bucket(x) : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (W), datetime shouldn't ever overflow at beginning of year", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (W)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "date"
            });

            table.update({
                a: [new Date(2015, 0, 3, 15), new Date(2015, 0, 4)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => new Date(x))).toEqual(result.a.map(x => common.week_bucket(x)));
            view.delete();
            table.delete();
        });

        it("Bucket (M), datetime", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (M)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2020, 1, 17), new Date(2020, 2, 18), new Date(2020, 2, 29)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => common.month_bucket(x)));
            view.delete();
            table.delete();
        });

        it("Bucket (M), datetime with nulls", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (M)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 12), null, undefined, new Date(2020, 2, 18), new Date(2020, 2, 29)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? common.month_bucket(x) : null)));
            view.delete();
            table.delete();
        });

        it("Bucket (Y), datetime", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (Y)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 12), new Date(2020, 0, 15), new Date(2021, 11, 17), new Date(2019, 2, 18), new Date(2019, 2, 29)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => common.year_bucket(x)));
            view.delete();
            table.delete();
        });

        it("Bucket (Y), datetime with nulls", async function() {
            const table = await perspective.table({
                a: "datetime"
            });

            const view = await table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Bucket (Y)",
                        inputs: ["a"]
                    }
                ]
            });

            const schema = await view.schema();
            expect(schema).toEqual({
                a: "datetime",
                computed: "date"
            });

            table.update({
                a: [new Date(2020, 0, 12), null, undefined, new Date(2019, 2, 18), new Date(2019, 2, 29)]
            });

            let result = await view.to_columns();

            expect(result.computed.map(x => (x ? new Date(x) : null))).toEqual(result.a.map(x => (x ? common.year_bucket(x) : null)));
            view.delete();
            table.delete();
        });
    });
};
