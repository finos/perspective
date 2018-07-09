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

// `install` makes this a Hypergrid plug-in
exports.install = function(grid) {
    Object.getPrototypeOf(grid.behavior).setPSP = setPSP;
};
