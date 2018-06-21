'use strict';

const TREE_COLUMN_INDEX = require('fin-hypergrid/src/behaviors/Behavior').prototype.treeColumnIndex;

var conv = {
    integer: 'integer',
    float: 'float',
    string: 'string',
    boolean: 'boolean',
    date: 'date'
};

module.exports = function psp2hypergrid(data, schema, tschema, row_pivots) {
    if (data.length === 0) {
        let columns = Object.keys(schema);
        return {
            rows: [],
            isTree: false,
            configuration: {},
            columnPaths: columns.map(col => [col]),
            columnTypes: columns.map(col => conv[schema[col]])
        };
    }

    var is_tree = !!row_pivots.length;

    var flat_columns = Object.keys(data[0]).filter(row => row !== '__ROW_PATH__');
    var columnPaths = flat_columns.map(row => row.split(','));

    let rows = data.map(function(row, idx) {
        // `dataRow` (element of `dataModel.data`) keys will be `index` here rather than
        // `columnName` because pivoted data have obscure column names of little use to developer.
        // This also allows us to override `dataModel.getValue` with a slightly more efficient version
        // that doesn't require mapping the name through `dataModel.dataSource.schema` to get the index.
        let dataRow = flat_columns.reduce(function(dataRow, columnName, index) {
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
                isLeaf: row.__ROW_PATH__.length >= (data[idx + 1] ? data[idx + 1].__ROW_PATH__.length : 0)
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
            .concat(columnPaths.map(col => conv[schema[col[col.length - 1]]]))
    };
};
