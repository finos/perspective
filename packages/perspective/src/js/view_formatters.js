/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import papaparse from "papaparse";

const jsonFormatter = {
    initDataValue: () => [],
    initRowValue: () => ({}),
    initColumnValue: (row, colName) => row[colName] = [],
    setColumnValue: (data, row, colName, value) => row[colName] = value,
    addColumnValue: (data, row, colName, value) => row[colName].unshift(value),
    addRow: (data, row) => data.push(row),
    formatData: data => data
};

const csvFormatter = Object.assign({}, jsonFormatter, {
    formatData: (data, config) => papaparse.unparse(data, config)
});

export default {
    jsonFormatter,
    csvFormatter
};
