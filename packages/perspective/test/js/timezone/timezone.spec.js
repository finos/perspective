/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const perspective = require("../../../dist/cjs/perspective.node.js");

const date_data = [
    {x: new Date(2020, 0, 1)}, // 2020/01/01
    {x: new Date(2020, 2, 8)}, // 2020/03/08
    {x: new Date(2020, 9, 1)}, // 2020/10/01
    {x: new Date(2020, 10, 1)}, // 2020/11/01
    {x: new Date(2020, 11, 31)} // 2020/12/31
];

const date_data_local = [
    {x: new Date(2020, 0, 1).toLocaleDateString()}, // 2020/01/01
    {x: new Date(2020, 2, 8).toLocaleDateString()}, // 2020/03/08
    {x: new Date(2020, 9, 1).toLocaleDateString()}, // 2020/10/01
    {x: new Date(2020, 10, 1).toLocaleDateString()}, // 2020/11/01
    {x: new Date(2020, 11, 31).toLocaleDateString()} // 2020/12/31
];

const datetime_data = [
    {x: new Date(2019, 1, 28, 23, 59, 59)}, // 2019/02/28 23:59:59 GMT-0500
    {x: new Date(2020, 1, 29, 0, 0, 1)}, // 2020/02/29 00:00:01 GMT-0500
    {x: new Date(2020, 2, 8, 1, 59, 59)}, // 2020/03/8 01:59:59 GMT-0400
    {x: new Date(2020, 2, 8, 2, 0, 1)}, // 2020/03/8 02:00:01 GMT-0500
    {x: new Date(2020, 9, 1, 15, 11, 55)}, // 2020/10/01 15:30:55 GMT-0400
    {x: new Date(2020, 10, 1, 19, 29, 55)}, // 2020/11/01 19:30:55 GMT-0400
    {x: new Date(2020, 11, 31, 7, 42, 55)} // 2020/12/31 07:30:55 GMT-0500
];

const datetime_data_local = [
    {x: new Date(2019, 1, 28, 23, 59, 59).toLocaleString()}, // 2019/02/28 23:59:59 GMT-0500
    {x: new Date(2020, 1, 29, 0, 0, 1).toLocaleString()}, // 2020/02/29 00:00:01 GMT-0500
    {x: new Date(2020, 2, 8, 1, 59, 59).toLocaleString()}, // 2020/03/8 01:59:59 GMT-0400
    {x: new Date(2020, 2, 8, 2, 0, 1).toLocaleString()}, // 2020/03/8 02:00:01 GMT-0500
    {x: new Date(2020, 9, 1, 15, 11, 55).toLocaleString()}, // 2020/10/01 15:30:55 GMT-0400
    {x: new Date(2020, 10, 1, 19, 29, 55).toLocaleString()}, // 2020/11/01 19:30:55 GMT-0400
    {x: new Date(2020, 11, 31, 7, 42, 55).toLocaleString()} // 2020/12/31 07:30:55 GMT-0500
];

/**
 * Check that two datasets containing datetimes are equal, specifically that
 * that their locale strings and timezone offsets are equal.
 *
 * @param {*} output output of `view.to_json()`
 * @param {*} expected expected dataset
 */
const check_datetime = (output, expected) => {
    expect(output.length).toEqual(expected.length);
    for (let i = 0; i < output.length; i++) {
        let date = new Date(output[i]["x"]);
        expect(date.toLocaleString()).toEqual(expected[i]["x"].toLocaleString());
        expect(date.getTimezoneOffset()).toEqual(expected[i]["x"].getTimezoneOffset());
    }
};

describe("Timezone Tests", () => {
    beforeAll(() => {
        expect(process.env.TZ).toBe("America/New_York");
        expect(new Date().getTimezoneOffset()).toBe(300);
        console.log("Timezone set to", process.env.TZ);
    });

    /**
     * Date() values are treated as local time, a UTC timestamp is extracted,
     * and then localized on output.
     */
    describe("Date column from Date()", () => {
        it("Displays date correctly from Date()", async () => {
            const table = await perspective.table(date_data);
            expect(await table.schema()).toEqual({x: "date"});
            const view = await table.view();
            let data = await view.to_json();
            check_datetime(data, date_data);
        });

        it("== filters date correctly from Date()", async () => {
            const table = await perspective.table(date_data);
            expect(await table.schema()).toEqual({x: "date"});
            const view = await table.view({filter: [["x", "==", date_data[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, [date_data[2]]);
        });

        it("> filters date correctly from Date()", async () => {
            const table = await perspective.table(date_data);
            expect(await table.schema()).toEqual({x: "date"});
            const view = await table.view({filter: [["x", ">", date_data[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, date_data.slice(3));
        });

        it("< filters date correctly from Date()", async () => {
            const table = await perspective.table(date_data);
            expect(await table.schema()).toEqual({x: "date"});
            const view = await table.view({filter: [["x", "<", date_data[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, date_data.slice(0, 2));
        });

        it(">= filters date correctly from Date()", async () => {
            const table = await perspective.table(date_data);
            expect(await table.schema()).toEqual({x: "date"});
            const view = await table.view({filter: [["x", ">=", date_data[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, date_data.slice(2));
        });

        it("< filters date correctly from Date()", async () => {
            const table = await perspective.table(date_data);
            expect(await table.schema()).toEqual({x: "date"});
            const view = await table.view({filter: [["x", "<=", date_data[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, date_data.slice(0, 3));
        });
    });

    /**
     * Date strings are treated as UTC, and then localized on output.
     *
     * BUT this can lead to confusion when users try to parse date strings
     * that are in a specific locale format - when I give Perspective a
     * datestring like "02/09/2020", I expect it to be parsed as local time
     * and displayed as-is, instead of being displayed as "02/08/2020 19:00:00"
     * because of the assumption that the string is UTC and its subsequent
     * conversion to local time by subtracting the hour offset.
     */
    describe("Date column from string", () => {
        it("Displays date correctly from ISO date string", async () => {
            // Converts automatically to ISO-formatted string
            const deepcopy = JSON.parse(JSON.stringify(date_data));
            const table = await perspective.table({
                x: "date"
            });
            table.update(deepcopy);
            const view = await table.view();
            let data = await view.to_json();
            check_datetime(data, date_data);
        });

        /**
         * Date strings "should" be treated as local time, but right now
         * they are parsed as UTC and would require a large-scale fix of the
         * date parser.
         */
        it.skip("Displays date correctly from local date string", async () => {
            const table = await perspective.table(date_data_local);
            const view = await table.view();
            let data = await view.to_json();

            for (let i = 0; i < data.length; i++) {
                let date = new Date(data[i]["x"]);
                expect(date.toLocaleDateString()).toEqual(date_data_local[i]["x"]);
            }
        });

        it("== filters date correctly from ISO date string", async () => {
            const deepcopy = JSON.parse(JSON.stringify(date_data));
            const table = await perspective.table({
                x: "date"
            });
            table.update(deepcopy);
            expect(await table.schema()).toEqual({x: "date"});
            const view = await table.view({filter: [["x", "==", deepcopy[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, [date_data[2]]);
        });

        it("> filters date correctly from ISO date string", async () => {
            const deepcopy = JSON.parse(JSON.stringify(date_data));
            const table = await perspective.table({
                x: "date"
            });
            table.update(deepcopy);
            expect(await table.schema()).toEqual({x: "date"});
            const view = await table.view({filter: [["x", ">", deepcopy[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, date_data.slice(3));
        });

        it("< filters date correctly from ISO date string", async () => {
            const deepcopy = JSON.parse(JSON.stringify(date_data));
            const table = await perspective.table({
                x: "date"
            });
            table.update(deepcopy);
            expect(await table.schema()).toEqual({x: "date"});
            const view = await table.view({filter: [["x", "<", deepcopy[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, date_data.slice(0, 2));
        });

        it(">= filters date correctly from ISO date string", async () => {
            const deepcopy = JSON.parse(JSON.stringify(date_data));
            const table = await perspective.table({
                x: "date"
            });
            table.update(deepcopy);
            expect(await table.schema()).toEqual({x: "date"});
            const view = await table.view({filter: [["x", ">=", deepcopy[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, date_data.slice(2));
        });

        it("< filters date correctly from ISO date string", async () => {
            const deepcopy = JSON.parse(JSON.stringify(date_data));
            const table = await perspective.table({
                x: "date"
            });
            table.update(deepcopy);
            expect(await table.schema()).toEqual({x: "date"});
            const view = await table.view({filter: [["x", "<=", deepcopy[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, date_data.slice(0, 3));
        });
    });

    describe("Datetime column from Date()", () => {
        /**
         * Date() values are treated as local time, a UTC timestamp is extracted,
         * and then localized on output.
         */
        it("Displays datetime correctly from Date()", async () => {
            const table = await perspective.table(datetime_data);
            expect(await table.schema()).toEqual({x: "datetime"});
            const view = await table.view();
            let data = await view.to_json();
            check_datetime(data, datetime_data);
        });

        it("== filters datetime correctly from Date()", async () => {
            const table = await perspective.table(datetime_data);
            expect(await table.schema()).toEqual({x: "datetime"});
            const view = await table.view({filter: [["x", "==", datetime_data[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, [datetime_data[2]]);
        });

        it("> filters datetime correctly from Date()", async () => {
            const table = await perspective.table(datetime_data);
            expect(await table.schema()).toEqual({x: "datetime"});
            const view = await table.view({filter: [["x", ">", datetime_data[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, datetime_data.slice(3));
        });

        it("< filters datetime correctly from Date()", async () => {
            const table = await perspective.table(datetime_data);
            expect(await table.schema()).toEqual({x: "datetime"});
            const view = await table.view({filter: [["x", "<", datetime_data[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, datetime_data.slice(0, 2));
        });

        it(">= filters datetime correctly from Date()", async () => {
            const table = await perspective.table(datetime_data);
            expect(await table.schema()).toEqual({x: "datetime"});
            const view = await table.view({filter: [["x", ">=", datetime_data[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, datetime_data.slice(2));
        });

        it("< filters datetime correctly from Date()", async () => {
            const table = await perspective.table(datetime_data);
            expect(await table.schema()).toEqual({x: "datetime"});
            const view = await table.view({filter: [["x", "<=", datetime_data[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, datetime_data.slice(0, 3));
        });
    });

    describe("Datetime column from string", () => {
        it("Displays datetime correctly from ISO date string", async () => {
            // Converts automatically to ISO-formatted string
            const deepcopy = JSON.parse(JSON.stringify(datetime_data));
            const table = await perspective.table(deepcopy);
            expect(await table.schema()).toEqual({x: "datetime"});
            const view = await table.view();
            let data = await view.to_json();
            check_datetime(data, datetime_data);
        });

        /**
         * Date strings "should" be treated as local time, but right now
         * they are parsed as UTC and would require a large-scale fix of the
         * date parser.
         */
        it.skip("Displays datetime correctly from local date string", async () => {
            const table = await perspective.table(datetime_data_local);
            const view = await table.view();
            let data = await view.to_json();

            for (let i = 0; i < data.length; i++) {
                let date = new Date(data[i]["x"]);
                expect(date.toLocaleString()).toEqual(" " + datetime_data_local[i]["x"]);
            }
        });

        it("== filters datetime correctly from ISO date string", async () => {
            const deepcopy = JSON.parse(JSON.stringify(datetime_data));
            const table = await perspective.table(deepcopy);
            expect(await table.schema()).toEqual({x: "datetime"});
            const view = await table.view({filter: [["x", "==", deepcopy[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, [datetime_data[2]]);
        });

        it("> filters datetime correctly from ISO date string", async () => {
            const deepcopy = JSON.parse(JSON.stringify(datetime_data));
            const table = await perspective.table(deepcopy);
            expect(await table.schema()).toEqual({x: "datetime"});
            const view = await table.view({filter: [["x", ">", deepcopy[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, datetime_data.slice(3));
        });

        it("< filters datetime correctly from ISO date string", async () => {
            const deepcopy = JSON.parse(JSON.stringify(datetime_data));
            const table = await perspective.table(deepcopy);
            expect(await table.schema()).toEqual({x: "datetime"});
            const view = await table.view({filter: [["x", "<", deepcopy[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, datetime_data.slice(0, 2));
        });

        it(">= filters datetime correctly from ISO date string", async () => {
            const deepcopy = JSON.parse(JSON.stringify(datetime_data));
            const table = await perspective.table(deepcopy);
            expect(await table.schema()).toEqual({x: "datetime"});
            const view = await table.view({filter: [["x", ">=", deepcopy[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, datetime_data.slice(2));
        });

        it("< filters datetime correctly from ISO date string", async () => {
            const deepcopy = JSON.parse(JSON.stringify(datetime_data));
            const table = await perspective.table(deepcopy);
            expect(await table.schema()).toEqual({x: "datetime"});
            const view = await table.view({filter: [["x", "<=", deepcopy[2]["x"]]]});
            let data = await view.to_json();
            check_datetime(data, datetime_data.slice(0, 3));
        });
    });
});
