/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const Range = require('./Range');

const TREE_COLUMN_INDEX = require('fin-hypergrid/src/behaviors/Behavior').prototype.treeColumnIndex;

function getSubrects(nrows) {
    if (!this.dataWindow) {
        return []
    }
    var dw = this.dataWindow;
    var rect = this.grid.newRectangle(dw.left, dw.top, dw.width, nrows ? Math.min(nrows - dw.top, dw.height) : dw.height); // convert from InclusiveRect
    return [rect];
}

module.exports = require('datasaur-local').extend('PerspectiveDataModel', {

    isTreeCol: function (x) {
        return x === TREE_COLUMN_INDEX && this.isTree();
    },

    getValue: function (x, y) {
        var row = this.data[y];
        return row ? row[x] : null;
    },

    getRowCount: function () {
        return this._nrows || 0;
    },

    setRowCount: function (count) {
        this._nrows = count || 0;
    },
    
    isTree: function () {
        return this._isTree;
    },

    setIsTree: function (isTree) {
        this._isTree = isTree;
    },

    isCached: function (rects) {
        return !rects || !rects.find(uncachedRow, this);
    },

    setDirty: function (nrows) {
        this._dirty = true;
        this.grid.renderer.computeCellsBounds();
        this._nrows = nrows;
        this.grid.behaviorChanged();
    },

    // Called when clicking on a row group expand
    toggleRow: async function (row, col) {

        if (this.isTreeCol(col)) {
            let isShift = false;
            if (window.event) {
                isShift = !!window.event.detail.primitiveEvent.shiftKey; // typecast to boolean
            }
            let is_expanded = await this._view.get_row_expanded(row);
            if (isShift) {
                if (is_expanded) {
                    if (this.data[row][col].rowPath.length === 1) {
                        this._view.close(row);
                    } else {
                        this._view.collapse_to_depth(this.data[row][col].rowPath.length - 2);
                    }
                } else {
                    this._view.expand_to_depth(this.data[row][col].rowPath.length - 1);
                }
            } else {
                if (is_expanded) {
                    this._view.close(row);
                } else {
                    this._view.open(row);
                }
            }
            let nrows = await this._view.num_rows();
            this.setDirty(nrows);
            this.grid.canvas.paintNow();
        }
    },

    fetchData: function (rectangles, resolve) {
        // if (!rectangles) {
        rectangles = getSubrects.call(this.grid.renderer);
        // }

        if (!this._dirty && !rectangles.find(uncachedRow, this)) {
            resolve(false);
            return;
        }
        
        if (this._outstanding_requested_rects && rectangles[0].within(this._outstanding_requested_rects[0])) {
            resolve(true);
            return;            
        }

        this._dirty = false;
        this._outstanding_requested_rects = rectangles;

        const promises = rectangles.map(
            rect => this.pspFetch(Range.create(rect.origin.y, rect.corner.y + 2))
        );

        Promise.all(promises).then(() => { 
            return this._view.num_rows();
        }).then(nrows => {
            let rects = getSubrects.call(this.grid.renderer, nrows);
            resolve(!!rects.find(uncachedRow, this));
        }).catch(e => {
            resolve(true);
        }).finally(() => {
            this._outstanding_requested_rects = undefined;
        }); 
    },

    getCell: function (config, rendererName) {
        var nextRow, depthDelta;
        if (config.isUserDataArea) {
            cellStyle.call(this, config, rendererName);
        } else if (config.dataCell.x === TREE_COLUMN_INDEX && config.value) {
            nextRow = this.getRow(config.dataCell.y + 1);
            depthDelta = nextRow ? config.value.rowPath.length - nextRow[TREE_COLUMN_INDEX].rowPath.length : 1;
            config.last = depthDelta !== 0;
            config.expanded = depthDelta < 0;
            config._type = this.schema[-1].type[config.value.rowPath.length - 2];
        }
        return config.grid.cellRenderers.get(rendererName);
    },

    pspFetch: async function() {}
});

function uncachedRow(rect) {
    return !(this.data[rect.origin.y] && this.data[Math.min(rect.corner.y, this.getRowCount() - 1)]);
}

function cellStyle(gridCellConfig) {
    if (gridCellConfig.value === null || gridCellConfig.value === undefined) {
        gridCellConfig.value = '-';
    } else {
        const type = this.schema[gridCellConfig.dataCell.x].type;
        if (['number', 'float', 'integer'].indexOf(type) > -1) {
            if (gridCellConfig.value === 0) {
                gridCellConfig.value = type === 'float' ? '0.00' : '0';
            } else if (isNaN(gridCellConfig.value)) {
                gridCellConfig.value = '-';
            } else {
                gridCellConfig.color = gridCellConfig.value >= 0
                    ? (gridCellConfig.columnHeaderBackgroundNumberPositive || 'rgb(160,207,255)')
                    : (gridCellConfig.columnHeaderBackgroundNumberNegative || 'rgb(255,136,136)');
            }
        } else if (type === 'boolean') {
            gridCellConfig.value = String(gridCellConfig.value);
        }
    }
}
