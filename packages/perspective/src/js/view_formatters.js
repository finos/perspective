/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const jsonFormatter = {
    initDataValue: () => [],
    initRowValue: () => ({}),
    initColumnValue: (data, row, colName) => (row[colName] = []),
    setColumnValue: (data, row, colName, value) => (row[colName] = value),
    addColumnValue: (data, row, colName, value) => row[colName].unshift(value),
    addRow: (data, row) => data.push(row),
    formatData: (data) => data,
    slice: (data, start) => data.slice(start),
};

const csvFormatter = Object.assign({}, jsonFormatter, {
    addColumnValue: (data, row, colName, value) =>
        row[colName.split("|").join(",")].unshift(value),
    setColumnValue: (data, row, colName, value) =>
        (row[colName.split("|").join(",")] = value),
    formatData: function (data, {delimiter = ","} = {}) {
        if (data.length === 0) {
            return "";
        }

        const format = function (x) {
            if (x === null) {
                return "";
            }
            switch (typeof x) {
                case "object":
                case "string":
                    // CSV escapes with double double quotes, for real.
                    // Section 2.7 of the fake
                    // [CSV spec](https://tools.ietf.org/html/rfc4180)
                    return x.indexOf(delimiter) > -1
                        ? `"${x.replace(/\"/g, '""')}"`
                        : x.toString();
                case "number":
                    return x;
                case "boolean":
                    return x.toString();
            }
        };

        const columns = Object.keys(data[0]);
        let csv = columns.map(format).join(delimiter);
        for (let x = 0; x < data.length; x++) {
            csv +=
                "\r\n" +
                columns
                    .map((column) => format(data[x][column]))
                    .join(delimiter);
        }

        return csv;
    },
});

const jsonTableFormatter = {
    initDataValue: () => new Object(),
    initRowValue: () => {},
    setColumnValue: (data, row, colName, value) => {
        data[colName] = data[colName] || [];
        data[colName].push(value);
    },
    addColumnValue: (data, row, colName, value) => {
        data[colName] = data[colName] || [];
        data[colName][data[colName].length - 1].unshift(value);
    },
    initColumnValue: (data, row, colName) => {
        data[colName] = data[colName] || [];
        data[colName].push([]);
    },
    addRow: () => {},
    formatData: (data) => data,
    slice: (data, start) => {
        let new_data = {};
        for (let x in data) {
            new_data[x] = data[x].slice(start);
        }
        return new_data;
    },
};

export default {
    jsonFormatter,
    jsonTableFormatter,
    csvFormatter,
};
