/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import Behavior from "fin-hypergrid/src/behaviors/Behavior";
import {get_type_config} from "@finos/perspective/dist/esm/config/index.js";

const {
    prototype: {treeColumnIndex: TREE_COLUMN_INDEX}
} = Behavior;

function get_rect(nrows) {
    if (!this.dataWindow) {
        return [];
    }
    const dw = this.dataWindow;
    return this.grid.newRectangle(dw.left, dw.top, dw.width, nrows ? Math.min(nrows - dw.top, dw.height) : dw.height); // convert from InclusiveRect
}

function find_row(rows, index) {
    for (let ridx in rows) {
        if (rows[ridx].__INDEX__ === index) {
            return parseInt(ridx);
        }
    }
    return -1;
}

export default require("datasaur-local").extend("PerspectiveDataModel", {
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

    setDirty: function(nrows) {
        if (!this._grid) {
            return;
        }
        if (nrows !== this._nrows) {
            this._grid.renderer.computeCellsBounds();
        }
        this._dirty = true;
        this._nrows = nrows;
        this._grid.behaviorChanged();
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
            this._grid.canvas.paintNow();
        }
    },

    _update_select_index: function() {
        const has_selections = this._grid.selectionModel.hasSelections();
        if (has_selections) {
            const row = this.data[this._grid.selectionModel.getLastSelection().origin.y];
            if (row) {
                this._select_index = row.__INDEX__;
            }
        }
    },

    _update_editor: function(rect) {
        const editor = this._grid.cellEditor;
        let new_index;
        if (editor) {
            new_index = find_row(this.data, editor._index);
            editor.event.resetGridXY(editor.event.dataCell.x, new_index - rect.origin.y + 1);
            editor.moveEditor();
        }
        return new_index;
    },

    _update_selection: function(new_index) {
        const has_selections = this._grid.selectionModel.hasSelections();
        if (has_selections) {
            new_index = new_index || find_row(this.data, this._select_index);
            if (new_index !== -1) {
                const col = this._grid.selectionModel.getLastSelection().origin.x;
                this._grid.selectionModel.select(col, new_index, 0, 0);
            }
        }
    },

    fetchData: async function(_, resolve) {
        if (this._view === undefined) {
            resolve(true);
            return;
        }

        let rect = get_rect.call(this._grid.renderer);

        if (!this._dirty && !uncachedRow.call(this._data_window, rect)) {
            resolve(false);
            return;
        }

        this._grid.renderer.needsComputeCellsBounds = true;

        if (this._outstanding_rect && !uncachedRow.call(this._oustanding_rect, rect)) {
            resolve(true);
            return;
        }

        this._outstanding_rect = rect;
        this._dirty = false;

        const action = this.pspFetch({
            start_row: rect.origin.y,
            end_row: rect.corner.y,
            start_col: rect.origin.x,
            end_col: rect.corner.x + 1
        });

        try {
            this._update_select_index();
            await action;
            this._data_window = rect;
            this._outstanding_rect = undefined;
            const new_index = this._update_editor(rect);
            this._update_selection(new_index);
            rect = get_rect.call(this._grid.renderer);
            this._grid.renderer.needsComputeCellsBounds = !!uncachedRow.call(this._data_window, rect);
            resolve(this._grid.renderer.needsComputeCellsBounds);
        } catch (e) {
            resolve(e);
        }
    },

    getCellEditorAt: function(columnIndex, rowIndex, declaredEditorName, options) {
        if (!declaredEditorName) {
            return;
        }
        const offset = this._grid.renderer.dataWindow.top;
        const editor = this._grid.cellEditors.create(declaredEditorName, options);
        this._grid.selectionModel.select(columnIndex, rowIndex + offset - 1);
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
        editor._canvas = this._grid.canvas.canvas;
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
    return !this || this.top !== rect.top || this.height !== rect.height || this.left !== rect.left || this.width !== rect.width;
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
                    gridCellConfig.borderBottom = gridCellConfig.borderBottomPositive ? gridCellConfig.borderBottomPositive : gridCellConfig.borderBottom;
                    gridCellConfig.borderRight = gridCellConfig.borderRightPositive ? gridCellConfig.borderRightPositive : gridCellConfig.borderRight;
                } else {
                    gridCellConfig.color = gridCellConfig.columnColorNumberNegative || "rgb(255,136,136)";
                    gridCellConfig.backgroundColor = gridCellConfig.columnBackgroundColorNumberNegative ? gridCellConfig.columnBackgroundColorNumberNegative : gridCellConfig.backgroundColor;
                    gridCellConfig.borderBottom = gridCellConfig.borderBottomNegative ? gridCellConfig.borderBottomNegative : gridCellConfig.borderBottom;
                    gridCellConfig.borderRight = gridCellConfig.borderRightNegative ? gridCellConfig.borderRightNegative : gridCellConfig.borderRight;
                }
            }
        } else if (type === "boolean") {
            gridCellConfig.value = String(gridCellConfig.value);
        }
    }
}
