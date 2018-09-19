/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {COLUMN_SEPARATOR_STRING} from "@jpmorganchase/perspective/src/js/defaults.js";

const TREE_COLUMN_INDEX = require("fin-hypergrid/src/behaviors/Behavior").prototype.treeColumnIndex;

function filter_hidden(hidden, json) {
    for (let key of Object.keys(json)) {
        const split_key = key.split(COLUMN_SEPARATOR_STRING);
        if (hidden.indexOf(split_key[split_key.length - 1].trim()) >= 0) {
            delete json[key];
        }
    }
    return json;
}

function psp2hypergrid(data, hidden, schema, tschema, row_pivots) {
    data = filter_hidden(hidden, data);
    const firstcol = Object.keys(data)[0];
    if (data[firstcol].length === 0) {
        let columns = Object.keys(schema);
        return {
            rows: [],
            isTree: false,
            configuration: {},
            columnPaths: columns.map(col => [col]),
            columnTypes: columns.map(col => schema[col])
        };
    }

    var is_tree = !!row_pivots.length;

    var flat_columns = Object.keys(data).filter(row => row !== "__ROW_PATH__");
    var columnPaths = flat_columns.map(row => row.split(COLUMN_SEPARATOR_STRING));

    let rows = [];

    for (let idx = 0; idx < data[firstcol].length; idx++) {
        let dataRow = flat_columns.reduce(function(dataRow, columnName, index) {
            dataRow[index] = data[columnName][idx];
            return dataRow;
        }, {});
        rows.push(dataRow);

        if (is_tree) {
            if (data["__ROW_PATH__"][idx] === undefined) {
                data["__ROW_PATH__"][idx] = [];
            }

            let name = data["__ROW_PATH__"][idx][data["__ROW_PATH__"][idx].length - 1];
            if (name === undefined && idx === 0) {
                name = "TOTAL";
            }
            dataRow[TREE_COLUMN_INDEX] = {
                rollup: name,
                rowPath: ["ROOT"].concat(data["__ROW_PATH__"][idx]),
                isLeaf: data["__ROW_PATH__"][idx].length >= row_pivots.length
            };
        }
    }

    return {
        rows: rows,
        isTree: is_tree,
        configuration: {},
        columnPaths: (is_tree ? [[" "]] : []).concat(columnPaths),
        columnTypes: (is_tree ? [row_pivots.map(x => tschema[x])] : []).concat(columnPaths.map(col => schema[col[col.length - 1]]))
    };
}

module.exports = {psp2hypergrid};
