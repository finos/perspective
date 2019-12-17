/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import Behavior from "faux-hypergrid/src/behaviors/Behavior";
import {get_type_config} from "@finos/perspective/dist/esm/config/index.js";
import {page2hypergrid} from "./psp-to-hypergrid";

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
        if (rows[ridx].__ID__ === index) {
            return parseInt(ridx);
        }
    }
    return -1;
}

const _wrapper = function(f) {
    return async function(_, resolve) {
        let is_error;
        try {
            is_error = await f.call(this);
        } catch (e) {
            resolve(e);
            return;
        }
        resolve(is_error);
    };
};

function pad_data_window(rect, rowPivots = [], selection = false) {
    const range = {
        start_row: rect.origin.y,
        end_row: rect.corner.y + 1,
        start_col: rect.origin.x,
        end_col: rect.corner.x + 3
    };
    range.end_col += rowPivots && rowPivots.length > 0 ? 1 : 0;
    range.id = selection;
    return range;
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
        const has_cell_selections = this._grid.selectionModel.hasSelections();
        const has_row_selections = this._grid.selectionModel.hasRowSelections();
        if (has_cell_selections) {
            const row_data = this.data[this._grid.selectionModel.getLastSelection().origin.y];
            if (row_data) {
                this._selected_cell_index = row_data.__ID__;
            }
        }
        if (has_row_selections) {
            const row_data = this.data[this._grid.getSelectedRows()[0]];
            if (row_data) {
                this._selected_row_index = row_data.__ID__;
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
        const has_cell_selections = this._grid.selectionModel.hasSelections();
        if (has_cell_selections) {
            new_index = new_index || find_row(this.data, this._selected_cell_index);
            if (new_index !== -1) {
                const col = this._grid.selectionModel.getLastSelection().origin.x;
                this._grid.selectionModel.select(col, new_index, 0, 0);
            }
        }
        if (this._selected_row_index) {
            this._grid.selectionModel.clearRowSelection();
            const row_index = new_index || find_row(this.data, this._selected_row_index);
            if (row_index !== -1) {
                this._grid.selectionModel.selectRow(row_index);
            }
        }
    },

    pspFetch: async function(rect) {
        const selection_enabled = this._grid.properties.rowSelection || this._viewer.hasAttribute("editable");
        const range = pad_data_window(rect, this._config.row_pivots, this._viewer.hasAttribute("settings"), selection_enabled);
        const next_page = await this._view.to_columns(range);
        this.data = [];
        const rows = page2hypergrid(next_page, this._config.row_pivots, this._columns);
        const base = range.start_row;
        const data = this.data;
        rows.forEach((row, offset) => (data[base + offset] = row));
    },

    fetchData: _wrapper(async function() {
        if (this._view === undefined) {
            return true;
        }

        let rect = get_rect.call(this._grid.renderer);

        if (!this._dirty && !is_cache_miss(rect, this._data_window)) {
            return;
        }

        this._grid.renderer.needsComputeCellsBounds = true;

        if (this._outstanding && !is_cache_miss(rect, this._outstanding.rect)) {
            await this._outstanding.req;
            this._grid.renderer.needsComputeCellsBounds = true;
            return true;
        }

        this._dirty = false;
        const req = this.pspFetch(rect);
        this._outstanding = {rect, req};
        this._update_select_index();

        try {
            await req;
        } finally {
            this._outstanding = undefined;
            this._grid.renderer.needsComputeCellsBounds = true;
        }

        this._data_window = rect;
        this._update_selection(this._update_editor(rect));

        rect = get_rect.call(this._grid.renderer);
        const ret = is_cache_miss(rect, this._data_window);
        return ret;
    }),

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
        editor._index = this.data[rowIndex + offset - 1].__ID__;
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

    clearSelectionState: function() {
        this._selected_row_index = undefined;
        this._selected_cell_index = undefined;
        this._grid.selectionModel.clear();
    }
});

function is_cache_miss(req, cache) {
    return !cache || req.top !== cache.top || req.top + req.height !== cache.top + cache.height || req.left !== cache.left || req.left + req.width !== cache.left + cache.width;
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
