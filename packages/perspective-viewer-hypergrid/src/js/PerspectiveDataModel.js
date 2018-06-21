/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

'use strict';

/*
 * NOTE
 * This data model depends on Perspective injecting the following methods upon view change (dataset redefinition):
 * * `isTree` — Is the grid view a tree?
 * * `getRowCount` — Total height of dataset
 * * `pspFetch` - Lazy loader called internally
 */

const Range = require('./Range');

const TREE_COLUMN_INDEX = require('fin-hypergrid/src/behaviors/Behavior').prototype.treeColumnIndex;

module.exports = require('datasaur-local').extend('PerspectiveDataModel', {
    initialize: function() {
        this.fetchOrdinal = 0;
    },

    // Is this column the 'tree' column
    isTreeCol: function(x) {
        return x === TREE_COLUMN_INDEX && this.isTree();
    },

    // Return the value for a given cell based on (x,y) coordinates
    // All our column names are column indexes (including tree column's), so no need to indirect through schema.
    getValue: function(x, y) {
        var row = this.data[y];
        return row ? row[x] : null;
    },

    // Called by Hypergrid with first two params only, creating a new ordinal;
    // called by self with all four params on error for retry.
    // Note that `reason` comes from catch() albeit not used herein.
    fetchData: function(rectangles, callback, ordinal, reason) {
        if (!ordinal) {
            if (!rectangles.find(uncachedRow, this)) {
                // no uncached rows so all rows available so do nothing
                callback(false); // falsy means success
                return;
            }

            // this is a new fetch request (as opposed to a retry)
            ordinal = ++this.fetchOrdinal;
        }

        this.data.length = 0; // discard previously fetched rows (i.e., don't cache rows)

        const promises = rectangles.map(
            rect => this.pspFetch(Range.create(rect.origin.y, rect.corner.y + 2))
        );

        Promise.all(promises)
            .then(value => {
                if (ordinal === this.fetchOrdinal) { // still current?
                    callback(false); // falsy means success (always, because we are currently retrying indefinitely)
                }
            })
            .catch(this.fetchData.bind(this, rectangles, callback, ordinal)); // retry (with same ordinal)
    },

    // Return the cell renderer
    getCell: function(config, rendererName) {
        var nextRow, depthDelta;
        if (config.isUserDataArea) {
            cellStyle.call(this, config, rendererName);
        } else if (config.dataCell.x === TREE_COLUMN_INDEX) {
            nextRow = this.getRow(config.dataCell.y + 1);
            depthDelta = nextRow ? config.value.rowPath.length - nextRow[TREE_COLUMN_INDEX].rowPath.length : -1;
            config.last = depthDelta !== 0;
            config.expanded = depthDelta < 0;
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

function cellStyle(gridCellConfig, rendererName) {
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
