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


    fetchData: function (rectangles, resolve) {
        if (!rectangles.find(uncachedRow, this)) {
            resolve(false);
            return;
        }

        this.data.length = 0;

        const promises = rectangles.map(
            rect => this.pspFetch(Range.create(rect.origin.y, rect.corner.y + 2))
        );

        Promise.all(promises).then(() => {
            resolve(false);
        }).catch(() => {
            resolve(true);
        }); 
    },

    getCell: function (config, rendererName) {
        var nextRow, depthDelta;
        if (config.isUserDataArea) {
            cellStyle.call(this, config, rendererName);
        } else if (config.dataCell.x === TREE_COLUMN_INDEX) {
            nextRow = this.getRow(config.dataCell.y + 1);
            depthDelta = nextRow ? config.value.rowPath.length - nextRow[TREE_COLUMN_INDEX].rowPath.length : -1;
            config.last = depthDelta !== 0;
            config.expanded = depthDelta < 0;
            config._type = this.schema[-1].type[config.value.rowPath.length - 2];
        }
        return config.grid.cellRenderers.get(rendererName);
    },

    pspFetch: async function() {}
});

function uncachedRow(rect) {
    for (var r = rect.origin.y, R = Math.min(rect.corner.y + 2, this.getRowCount()); r < R; ++r) {
        if (!this.data[r]) {
            return true;
        }
    }
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
