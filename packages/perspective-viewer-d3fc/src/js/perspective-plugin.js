/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const rectangular = require("rectangular");

/**
 * @this {Behavior}
 * @param payload
 */
function setPSP(payload) {
    const new_schema = [];

    if (payload.isTree) {
        new_schema[this.treeColumnIndex] = {
            name: this.treeColumnIndex.toString(),
            header: " " // space char because empty string defaults to `name`
        };
    }

    payload.columnPaths.forEach(function(columnPath, columnIndex) {
        const col_name = columnPath.join("|"),
            aliases = payload.configuration.columnAliases,
            header = (aliases && aliases[col_name]) || col_name,
            name = columnIndex.toString(),
            type = payload.columnTypes[columnIndex];

        if (payload.isTree && columnIndex === 0) {
            new_schema[-1] = {name, header, type};
        } else {
            new_schema.push({name, header, type});
        }
    });

    this.grid.properties.showTreeColumn = payload.isTree;

    console.log("Setting up initial schema and data load into HyperGrid");

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
        case "number":
        case "float":
            props.halign = "right";
            props.columnHeaderHalign = "right";
            props.format = "FinanceFloat";
            break;
        case "integer":
            props.halign = "right";
            props.columnHeaderHalign = "right";
            props.format = "FinanceInteger";
            break;
        case "date":
            props.format = "FinanceDate";
            break;
        case "datetime":
            props.format = "FinanceDatetime";
            break;
        default:
            if (column.index === this.treeColumnIndex) {
                props.format = "FinanceTree";
            }
    }
}

// `install` makes this a Hypergrid plug-in
exports.install = function(grid) {
    Object.getPrototypeOf(grid.behavior).setPSP = setPSP;
    Object.getPrototypeOf(grid.behavior).cellClicked = function(event) {
        return this.dataModel.toggleRow(event.dataCell.y, event.dataCell.x, event);
    };

    // function isCanvasBlank(canvas) {
    //     var blank = document.createElement("canvas");
    //     blank.width = canvas.width;
    //     blank.height = canvas.height;

    //     return canvas.toDataURL() == blank.toDataURL();
    // }

    grid.canvas.resize = async function() {
        const width = (this.width = Math.floor(this.div.clientWidth));
        const height = (this.height = Math.floor(this.div.clientHeight));

        //fix ala sir spinka, see
        //http://www.html5rocks.com/en/tutorials/canvas/hidpi/
        //just add 'hdpi' as an attribute to the fin-canvas tag
        let ratio = 1;
        const isHIDPI = window.devicePixelRatio && this.component.properties.useHiDPI;
        if (isHIDPI) {
            const devicePixelRatio = window.devicePixelRatio || 1;
            const backingStoreRatio =
                this.gc.webkitBackingStorePixelRatio || this.gc.mozBackingStorePixelRatio || this.gc.msBackingStorePixelRatio || this.gc.oBackingStorePixelRatio || this.gc.backingStorePixelRatio || 1;

            ratio = devicePixelRatio / backingStoreRatio;
        }

        this.bounds = new rectangular.Rectangle(0, 0, width, height);
        this.component.setBounds(this.bounds);
        this.resizeNotification();

        let render = false;
        if (height * ratio > this.canvas.height) {
            render = await new Promise(resolve => this.component.grid.behavior.dataModel.fetchData(undefined, resolve));
        }

        if (!render) {
            this.bounds = new rectangular.Rectangle(0, 0, width, height);
            this.component.setBounds(this.bounds);

            this.buffer.width = this.canvas.width = width * ratio;
            this.buffer.height = this.canvas.height = height * ratio;

            this.canvas.style.width = this.buffer.style.width = width + "px";
            this.canvas.style.height = this.buffer.style.height = height + "px";

            this.bc.scale(ratio, ratio);
            if (isHIDPI && !this.component.properties.useBitBlit) {
                this.gc.scale(ratio, ratio);
            }

            grid.canvas.paintNow();
        }
    };
};
