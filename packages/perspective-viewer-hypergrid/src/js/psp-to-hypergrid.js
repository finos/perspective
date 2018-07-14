/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const TREE_COLUMN_INDEX = require('fin-hypergrid/src/behaviors/Behavior').prototype.treeColumnIndex;

function filter_hidden(hidden, json) {
    if (hidden.length > 0) {
        const first = json[0];
        const to_delete = [];
        for (let key in first) {
            const split_key = key.split(',');
            if (hidden.indexOf(split_key[split_key.length - 1].trim()) >= 0) {
                to_delete.push(key);
            }
        }
        for (let row of json) {
            for (let h of to_delete) {
                delete row[h];
            }
        }
    }
    return json;
}

module.exports = function psp2hypergrid(data, hidden, schema, tschema, row_pivots) {
    data = filter_hidden(hidden, data);
    if (data.length === 0) {
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

    var flat_columns = Object.keys(data[0]).filter(row => row !== '__ROW_PATH__');
    var columnPaths = flat_columns.map(row => row.split(','));

    let rows = data.map(function (row, idx) {
        // `dataRow` (element of `dataModel.data`) keys will be `index` here rather than
        // `columnName` because pivoted data have obscure column names of little use to developer.
        // This also allows us to override `dataModel.getValue` with a slightly more efficient version
        // that doesn't require mapping the name through `dataModel.dataSource.schema` to get the index.
        let dataRow = flat_columns.reduce(function (dataRow, columnName, index) {
            dataRow[index] = row[columnName];
            return dataRow;
        }, {});

        if (is_tree) {
            if (row.__ROW_PATH__ === undefined) {
                row.__ROW_PATH__ = [];
            }

            let name = row.__ROW_PATH__[row.__ROW_PATH__.length - 1];
            if (name === undefined && idx === 0) {
                name = 'TOTAL';
            }

            // Following stores the tree column under [-1] rather than ['Tree'] so our `getValue`
            // override can access it using the tree column index rather than the tree column name.
            dataRow[TREE_COLUMN_INDEX] = {
                rollup: name,
                rowPath: ['ROOT'].concat(row.__ROW_PATH__),
                isLeaf: row.__ROW_PATH__.length >= row_pivots.length
            };
        }

        return dataRow;
    });

    return {
        rows: rows,
        isTree: is_tree,
        configuration: {},
        columnPaths: (is_tree ? [[' ']] : []).concat(columnPaths),
        columnTypes: (is_tree ? [row_pivots.map(x => tschema[x])] : [])
            .concat(columnPaths.map(col => schema[col[col.length - 1]]))
    };
};
