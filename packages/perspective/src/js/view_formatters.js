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
    initColumnValue: (data, colName) => {},
    initColumnRowPath: (data, row, colName) => (row[colName] = []),
    setColumnValue: (data, row, colName, value) => (row[colName] = value),
    addColumnValue: (data, row, colName, value) => row[colName].unshift(value),
    addRow: (data, row) => data.push(row),
    formatData: (data) => data,
    slice: (data, start) => data.slice(start),
};

const jsonTableFormatter = {
    initDataValue: () => new Object(),
    initRowValue: () => {},
    initColumnValue: (data, colName) => {
        data[colName] = [];
    },
    setColumnValue: (data, row, colName, value) => {
        data[colName].push(value);
    },
    addColumnValue: (data, row, colName, value) => {
        data[colName][data[colName].length - 1].unshift(value);
    },
    initColumnRowPath: (data, row, colName) => {
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
};
