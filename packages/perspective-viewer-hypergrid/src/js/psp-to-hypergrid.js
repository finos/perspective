/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const COLUMN_SEPARATOR_STRING = "|";

const TREE_COLUMN_INDEX = require("faux-hypergrid/src/behaviors/Behavior").prototype.treeColumnIndex;

function page2hypergrid(data, row_pivots, columns) {
    const data_columns = Object.keys(data);
    const firstcol = data_columns.length > 0 ? data_columns[0] : undefined;
    if (typeof firstcol === "undefined") {
        return [];
    }

    const is_tree = !!row_pivots.length;
    const flat_columns = row_pivots.length ? columns.filter(x => x !== "__ROW_PATH__") : columns;
    const data_indices = data_columns.map(x => flat_columns.indexOf(x));
    const rows = [];

    for (let ridx = 0; ridx < data[firstcol].length; ridx++) {
        const dataRow = {};

        for (const cidx in data_columns) {
            const columnName = data_columns[cidx];
            dataRow[data_indices[cidx]] = data[columnName][ridx];
        }

        if (is_tree) {
            if (data["__ROW_PATH__"][ridx] === undefined) {
                data["__ROW_PATH__"][ridx] = [];
            }

            let name = data["__ROW_PATH__"][ridx][data["__ROW_PATH__"][ridx].length - 1];
            if (name === undefined && ridx === 0) {
                name = "TOTAL";
            }

            dataRow[TREE_COLUMN_INDEX] = {
                rollup: name,
                rowPath: ["ROOT"].concat(data["__ROW_PATH__"][ridx]),
                isLeaf: data["__ROW_PATH__"][ridx].length >= row_pivots.length
            };
        }

        if (data.__ID__) {
            dataRow["__ID__"] = data["__ID__"][ridx].join("|");
        }

        if (data.__INDEX__) {
            dataRow["__INDEX__"] = data["__INDEX__"][ridx][0];
        }

        rows.push(dataRow);
    }

    return rows;
}

function psp2hypergrid(data, schema, tschema, row_pivots, columns) {
    const flat_columns = row_pivots.length ? columns.filter(x => x !== "__ROW_PATH__") : columns;
    const columnPaths = flat_columns.map(row => row.split(COLUMN_SEPARATOR_STRING));
    const is_tree = !!row_pivots.length;
    const rows = page2hypergrid(data, row_pivots, columns);

    return {
        rows: rows,
        isTree: is_tree,
        configuration: {},
        rowPivots: row_pivots,
        columnPaths: (is_tree ? [[" "]] : []).concat(columnPaths),
        columnTypes: (is_tree ? [row_pivots.map(x => tschema[x])] : []).concat(columnPaths.map(col => schema[col[col.length - 1]]))
    };
}

module.exports = {psp2hypergrid, page2hypergrid};
