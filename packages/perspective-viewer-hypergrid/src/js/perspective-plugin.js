/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * @this {Behavior}
 * @param payload
 */
function setPSP(payload) {
    const new_schema = [];

    if (payload.isTree) {
        new_schema[this.treeColumnIndex] = {
            name: this.treeColumnIndex.toString(),
            header: ' ' // space char because empty string defaults to `name`
        };
    }

    payload.columnPaths.forEach(function(columnPath, columnIndex) {
      
        const col_name = columnPath.join('|'),
            aliases = payload.configuration.columnAliases,
            header = aliases && aliases[col_name] || col_name,
            name = columnIndex.toString(),
            type = payload.columnTypes[columnIndex];

        if (payload.isTree && columnIndex === 0) {
            new_schema[-1] = { name, header, type };
        } else {
            new_schema.push({ name, header, type });
        }
    });

    this.grid.properties.showTreeColumn = payload.isTree;

    console.log('Setting up initial schema and data load into HyperGrid');

    this.stashedWidths = stashColumnWidths.call(this);

    // Following call to setData signals the grid to call createColumns and dispatch the
    // fin-hypergrid-schema-loaded event (in that order). Here we inject a createColumns override
    // into `this` (behavior instance) to complete the setup before the event is dispatched.
    this.createColumns = createColumns;

    this.grid.setData({
        data: payload.rows,
        schema: new_schema
    });
}

/**
 * @this {Behavior}
 */
function createColumns() {
    Object.getPrototypeOf(this).createColumns.call(this);

    this.getActiveColumns().forEach(function(column) {
        setColumnPropsByType.call(this, column);
        restoreColumnWidth(this.stashedWidths, column.properties);
    }, this);

    let treeColumn = this.getTreeColumn();
    if (treeColumn) {
        setColumnPropsByType.call(this, treeColumn);
    }

    this.stashedWidths = undefined;

    this.setHeaders(); // grouped-header override that sets all header cell renderers and header row height

    this.schema_loaded = true;
}

/**
 * @this {Behavior}
 */
function setColumnPropsByType(column) {
    var props = column.properties;
    switch (column.type) {
        case 'number':
        case 'float':
            props.halign = 'right';
            props.columnHeaderHalign = 'right';
            props.format = 'FinanceFloat';
            break;
        case 'integer':
            props.halign = 'right';
            props.columnHeaderHalign = 'right';
            props.format = 'FinanceInteger';
            break;
        case 'date':
            props.format = 'FinanceDate';
            break;
        default:
            if (column.index === this.treeColumnIndex) {
                props.format = 'FinanceTree';
            }
    }
}

/**
 * @this {Behavior}
 */
function stashColumnWidths() {
    const widths = {};
    this.getActiveColumns().forEach(function(column) {
        let header = column.properties.header;
        let name = header.split('|');
        name = name[name.length - 1];
        widths[name in widths ? header : name] = column.getWidth();;
    });
    return widths;
}

function restoreColumnWidth(widths, props) {
    let header = props.header;
    let name = header.split('|');
    name = name[name.length - 1];
    props.width = widths[header in widths ? header : name] || 50;
    props.columnAutosizing = true;
}


// `install` makes this a Hypergrid plug-in
exports.install = function(grid) {
    Object.getPrototypeOf(grid.behavior).setPSP = setPSP;
};
