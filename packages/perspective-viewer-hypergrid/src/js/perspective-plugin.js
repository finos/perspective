/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

'use strict';

const _ = require('underscore');


/**
 * @this {Behavior}
 * @param payload
 */
function setPSP(payload) {
    const grid = this.grid;
    const new_schema = [];

    if (payload.columnPaths[0].length === 0 || payload.columnPaths[0][0] === '') {
        payload.columnPaths[0] = [' '];
    }

    if (payload.isTree) {
        new_schema[this.treeColumnIndex] = {
            name: this.treeColumnIndex,
            header: ' ' // space char because empty string defaults to `name`
        };
    }

    payload.columnPaths.forEach(function(columnPath, columnIndex) {
        if (payload.isTree && columnIndex === 0) {
            return;
        }

        const col_name = columnPath.join('|'),
            aliases = payload.configuration.columnAliases,
            col_header = aliases ? (aliases[col_name] || col_name) : col_name,
            type = payload.columnTypes[columnIndex];

        new_schema.push({
            name: columnIndex.toString(),
            header: col_header,
            type: type === 'str' ? 'string' : type
        });
    });

    const old_schema = grid.behavior.dataModel.schema;
    this.schema_loaded = this.schema_loaded && _.isEqual(new_schema, old_schema);

    this.grid.properties.showTreeColumn = payload.isTree;

    if (this.schema_loaded) {

        grid.setData({
            data: payload.rows,
        });

    } else {

        console.log('Setting up initial schema and data load into HyperGrid');

        this.stashedWidths = stashColumnWidths.call(this);

        // Following call to setData signals the grid to call createColumns and dispatch the
        // fin-hypergrid-schema-loaded event (in that order). Here we inject a createColumns override
        // into `this` (behavior instance) to complete the setup before the event is dispatched.
        this.createColumns = createColumns;

        grid.setData({
            data: payload.rows,
            schema: new_schema
        });

    }
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
