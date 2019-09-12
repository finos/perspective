/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const TREE_COLUMN_INDEX = require("fin-hypergrid/src/behaviors/Behavior").prototype.treeColumnIndex;
const {get_type_config} = require("@finos/perspective/dist/esm/config/index.js");

function getSubrects(nrows) {
    if (!this.dataWindow) {
        return [];
    }
    var dw = this.dataWindow;
    var rect = this.grid.newRectangle(dw.left, dw.top, dw.width, nrows ? Math.min(nrows - dw.top, dw.height) : dw.height); // convert from InclusiveRect
    return [rect];
}

function find_row(rows, index) {
    for (let ridx in rows) {
        if (rows[ridx].__INDEX__ === index) {
            return parseInt(ridx);
        }
    }
    return -1;
}

module.exports = require("datasaur-local").extend("PerspectiveDataModel", {
    isTreeCol: function(x) {
        return x === TREE_COLUMN_INDEX && this.isTree();
    },

    getValue: function(x, y) {
        var row = this.data[y];
        return row ? row[x] : null;
    },

    getRowCount: function() {
        return this._nrows || 0;
    },

    getConfig: function() {
        return this._config;
    },

    setRowCount: function(count) {
        this._nrows = count || 0;
    },

    isTree: function() {
        return this._isTree;
    },

    setIsTree: function(isTree) {
        this._isTree = isTree;
    },

    isCached: function(rects) {
        return !rects || !rects.find(uncachedRow, this);
    },

    setDirty: function(nrows) {
        if (nrows !== this._nrows) {
            this.grid.renderer.computeCellsBounds();
        }
        this._dirty = true;
        this._nrows = nrows;
        this.grid.behaviorChanged();
    },

    // Called when clicking on a row group expand
    toggleRow: async function(row, col, event) {
        if (this.isTreeCol(col)) {
            let isShift = false;
            if (event.primitiveEvent.detail.primitiveEvent) {
                isShift = !!event.primitiveEvent.detail.primitiveEvent.shiftKey; // typecast to boolean
            }
            let is_expanded = await this._view.get_row_expanded(row);
            if (isShift) {
                if (is_expanded) {
                    if (this.data[row][col].rowPath.length === 1) {
                        this._view.collapse(row);
                    } else {
                        this._view.set_depth(this.data[row][col].rowPath.length - 2);
                    }
                } else {
                    this._view.set_depth(this.data[row][col].rowPath.length - 1);
                }
            } else {
                if (is_expanded) {
                    this._view.collapse(row);
                } else {
                    this._view.expand(row);
                }
            }
            let nrows = await this._view.num_rows();
            this.setDirty(nrows);
            this.grid.canvas.paintNow();
        }
    },

    _update_select_index: function() {
        const has_selections = this.grid.selectionModel.hasSelections();
        if (has_selections) {
            const row = this.data[this.grid.selectionModel.getLastSelection().origin.y];
            if (row) {
                this._select_index = row.__INDEX__;
            }
        }
    },

    _update_editor: function([rect]) {
        const editor = this.grid.cellEditor;
        let new_index;
        if (editor) {
            new_index = find_row(this.data, editor._index);
            editor.event.resetGridXY(editor.event.dataCell.x, new_index - rect.origin.y + 1);
            editor.moveEditor();
        }
        return new_index;
    },

    _update_selection: function(new_index) {
        const has_selections = this.grid.selectionModel.hasSelections();
        if (has_selections) {
            new_index = new_index || find_row(this.data, this._select_index);
            if (new_index !== -1) {
                const col = this.grid.selectionModel.getLastSelection().origin.x;
                this.grid.selectionModel.select(col, new_index, 0, 0);
            }
        }
    },

    fetchData: async function(rectangles, resolve) {
        rectangles = getSubrects.call(this.grid.renderer);

        if (this._view === undefined) {
            resolve(true);
            return;
        }

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

        const promises = rectangles.map(rect =>
            this.pspFetch({
                start_row: rect.origin.y,
                end_row: rect.corner.y,
                start_col: rect.origin.x,
                end_col: rect.corner.x + 1
            })
        );

        try {
            this._update_select_index();

            await Promise.all(promises);

            const new_index = this._update_editor(rectangles);
            this._update_selection(new_index);
            const rects = getSubrects.call(this.grid.renderer);
            resolve(!!rects.find(uncachedRow, this));
        } catch (e) {
            resolve(true);
        } finally {
            this._outstanding_requested_rects = undefined;
        }
    },

    getCellEditorAt: function(columnIndex, rowIndex, declaredEditorName, options) {
        if (!declaredEditorName) {
            return;
        }
        const offset = this.grid.renderer.dataWindow.top;
        const editor = this.grid.cellEditors.create(declaredEditorName, options);
        this.grid.selectionModel.select(columnIndex, rowIndex + offset - 1);
        editor.el.addEventListener("blur", () => setTimeout(() => editor.cancelEditing()));
        const args = {
            start_row: rowIndex + offset - 1,
            end_row: rowIndex + offset,
            start_col: columnIndex,
            end_col: columnIndex + 1,
            index: true
        };
        editor._row = this._view.to_json(args);
        editor._table = this._table;
        editor._data = this.data;
        editor._canvas = this.grid.canvas.canvas;
        editor._index = this.data[rowIndex + offset - 1].__INDEX__;
        return editor;
    },

    getCell: function(config, rendererName) {
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
    let start_row = this.data[rect.origin.y];
    let end_row = this.data[Math.min(rect.corner.y, this.getRowCount() - 1)];
    return !(start_row && start_row[rect.origin.x] !== undefined && end_row && end_row[rect.corner.x - 1] !== undefined);
}

function cellStyle(gridCellConfig) {
    if (gridCellConfig.value === null || gridCellConfig.value === undefined) {
        gridCellConfig.value = "-";
    } else {
        let type = this.schema[gridCellConfig.dataCell.x].type;
        const type_config = get_type_config(type);
        if (type_config.type) {
            type = type_config.type;
        }
        if (["number", "float", "integer"].indexOf(type) > -1) {
            if (gridCellConfig.value === 0) {
                gridCellConfig.value = type === "float" ? "0.00" : "0";
            } else if (isNaN(gridCellConfig.value)) {
                gridCellConfig.value = "-";
            } else {
                if (gridCellConfig.value > 0) {
                    gridCellConfig.color = gridCellConfig.columnColorNumberPositive || "rgb(160,207,255)";
                    gridCellConfig.backgroundColor = gridCellConfig.columnBackgroundColorNumberPositive ? gridCellConfig.columnBackgroundColorNumberPositive : gridCellConfig.backgroundColor;
                } else {
                    gridCellConfig.color = gridCellConfig.columnColorNumberNegative || "rgb(255,136,136)";
                    gridCellConfig.backgroundColor = gridCellConfig.columnBackgroundColorNumberNegative ? gridCellConfig.columnBackgroundColorNumberNegative : gridCellConfig.backgroundColor;
                }
            }
        } else if (type === "boolean") {
            gridCellConfig.value = String(gridCellConfig.value);
        }
    }
}
