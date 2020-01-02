/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import rectangular from "rectangular";
import superscript from "superscript-number";
import isEqual from "lodash/isEqual";

import cellRenderersRegistry from "faux-hypergrid/src/cellRenderers";

var Borders = cellRenderersRegistry.BaseClass.extend("Borders", {
    paint: function(gc, config) {
        var bounds = config.bounds,
            x = bounds.x,
            y = bounds.y,
            w = bounds.width,
            h = bounds.height - 1;
        var color;

        gc.save();
        gc.translate(-0.5, 0.5); // paint "sharp" lines on pixels instead of "blury" lines between pixels
        gc.cache.lineWidth = 1;

        color = config.borderTop;
        if (color) {
            gc.beginPath();
            gc.moveTo(x, y);
            gc.lineTo(x + w, y);
            gc.cache.strokeStyle = color;
            gc.stroke();
        }

        color = config.borderRight;
        if (color) {
            gc.beginPath();
            gc.moveTo(x + w, y);
            gc.lineTo(x + w, y + h);
            gc.cache.strokeStyle = color;
            gc.stroke();
        }

        color = config.borderBottom;
        if (color) {
            gc.beginPath();
            gc.moveTo(x, y + h);
            gc.lineTo(x + w, y + h);
            gc.cache.strokeStyle = color;
            gc.stroke();
        }

        color = config.borderLeft;
        if (color) {
            gc.beginPath();
            gc.moveTo(x, y);
            gc.lineTo(x, y + h);
            gc.cache.strokeStyle = color;
            gc.stroke();
        }

        gc.restore();
    }
});

cellRenderersRegistry.add(Borders);

/**
 * @this {Behavior}
 * @param payload
 */
function setPSP(payload, force = false) {
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
            new_schema.push({name, header, type, index: columnIndex - (payload.isTree ? 1 : 0)});
        }
    });

    this.grid.properties.showTreeColumn = payload.isTree;

    const config = this.grid.behavior.dataModel._config;
    const column_only = config.row_pivots.length === 0 && config.column_pivots.length > 0;
    const selectable = !column_only && this.grid.behavior.dataModel._viewer.hasAttribute("selectable");
    this.grid.addProperties(this.grid.get_dynamic_styles(selectable));

    // Following call to setData signals the grid to call createColumns and
    // dispatch the fin-hypergrid-schema-loaded event (in that order). Here we
    // inject a createColumns override into `this` (behavior instance) to
    // complete the setup before the event is dispatched.
    this.createColumns = createColumns;
    this.refreshColumns = refreshColumns;

    if (
        !force &&
        this._memoized_schema &&
        isEqual(this._memoized_schema.slice(0, this._memoized_schema.length), new_schema.slice(0, new_schema.length)) &&
        isEqual(payload.rowPivots, this._memoized_pivots)
    ) {
        this.grid.sbVScroller.index = 0;
        this.grid.behavior.dataModel.data = payload.rows;
        this.grid.behavior.dataModel._data_window = undefined;
    } else {
        this.grid.sbVScroller.index = 0;
        this.grid.sbHScroller.index = 0;
        this.grid.selectionModel.clear();
        this.grid.setData({
            data: payload.rows,
            schema: new_schema
        });
    }
    this._memoized_schema = new_schema;
    this._memoized_pivots = payload.rowPivots;
}

/**
 * @this {Behavior}
 */
function createColumns() {
    Object.getPrototypeOf(this).createColumns.call(this);
    this.refreshColumns();
    this.setHeaders(); // grouped-header override that sets all header cell renderers and header row height
    this.schema_loaded = true;
}

function refreshColumns() {
    this.getActiveColumns().forEach(function(column) {
        setColumnPropsByType.call(this, column);
    }, this);

    let treeColumn = this.getTreeColumn();
    if (treeColumn) {
        setColumnPropsByType.call(this, treeColumn);
    }
}

/**
 * @this {Behavior}
 */
function setColumnPropsByType(column) {
    const props = column.properties;
    if (column.index === this.treeColumnIndex) {
        props.format = "FinanceTree";
    } else {
        props.format = `perspective-${column.type}`;
    }
    const config = this.grid.behavior.dataModel._config;
    const isEditable = this.grid.behavior.dataModel._viewer.hasAttribute("editable");
    if (isEditable && config.row_pivots.length === 0 && config.column_pivots.length === 0) {
        props.editor = {
            integer: "perspective-number",
            string: "perspective-text",
            date: "perspective-date",
            datetime: "perspective-datetime",
            float: "perspective-number"
        }[column.type];
        Object.assign(props, {
            editable: true,
            editOnKeydown: true,
            editOnNextCell: false,
            editOnDoubleClick: true,
            editorActivationKeys: ["alt", "esc"],
            cellSelection: true
        });
    }
    const styles = this.grid.get_styles();
    if (styles[column.type]) {
        Object.assign(props, styles[column.type]);
    }
}

/**
 * @this {Behavior}
 */
function formatColumnHeader(value) {
    const config = this.dataModel.getConfig();
    const index = config.sort.findIndex(item => item[0] === value.trim());

    if (index > -1) {
        const direction = config.sort[index][1];

        if (direction in this.charMap) {
            value = `${value} ${this.charMap[direction]}${config.sort.length > 1 ? superscript(index + 1) : ""}`;
        }
    }

    return value;
}

function addSortChars(charMap) {
    Object.assign(charMap, {
        asc: "\u2191",
        desc: "\u2193",
        "asc abs": "\u21E7",
        "desc abs": "\u21E9",
        "col asc": "\u2192",
        "col desc": "\u2190",
        "col asc abs": "\u21E8",
        "col desc abs": "\u21E6"
    });
}

function sortColumn(event) {
    event.preventDefault();
    event.handled = true;
    const config = this.behavior.dataModel.getConfig();
    const column = this.behavior.getColumn(event.detail.column);
    let column_sorting, column_name;

    if (config.column_pivots.length > 0) {
        column_sorting = true;
        column_name = column.header.split("|")[config.column_pivots.length]; // index of last column is always the length of the column pivots
    } else {
        column_sorting = false;
        column_name = column.header;
    }

    const viewer = this.behavior.dataModel._viewer;

    const item_index = config.sort.findIndex(item => item[0] === column_name.trim());
    const already_sorted = item_index > -1;

    // shift key to enable abs sorting alt key to not remove already sorted
    // columns
    const abs_sorting = event.detail.keys && (event.detail.keys.indexOf("ALTSHIFT") > -1 || event.detail.keys.indexOf("ALT") > -1) && column.type !== "string";
    const shift_pressed = event.detail.keys && (event.detail.keys.indexOf("ALTSHIFT") > -1 || event.detail.keys.indexOf("SHIFT") > -1);
    let new_sort_direction;

    // if the column is already sorted we increment the sort
    if (already_sorted) {
        const item = config.sort[item_index];
        const direction = item[1];
        new_sort_direction = viewer._increment_sort(direction, column_sorting, abs_sorting);
        item[1] = new_sort_direction;
    } else {
        new_sort_direction = viewer._increment_sort("none", column_sorting, abs_sorting);
    }

    //if alt pressed and column is already sorted, we change the sort for the
    //column and leave the rest as is
    if (shift_pressed && already_sorted) {
        if (new_sort_direction === "none") {
            config.sort.splice(item_index, 1);
        }
        viewer.sort = JSON.stringify(config.sort);
    } else if (shift_pressed) {
        // if alt key is pressed and column is NOT already selected, append the
        // new sort column
        config.sort.push([column_name, new_sort_direction]);
        viewer.sort = JSON.stringify(config.sort);
    } else {
        viewer.sort = JSON.stringify([[column_name, new_sort_direction]]);
    }
}

const right_click_handler = e => {
    const old_event = e.detail.primitiveEvent;
    const new_event = new MouseEvent(old_event.type, old_event);
    e.target.parentElement.parentElement.parentElement.dispatchEvent(new_event);
};

// `install` makes this a Hypergrid plug-in
export const install = function(grid) {
    addSortChars(grid.behavior.charMap);

    Object.getPrototypeOf(grid.behavior).setPSP = setPSP;

    Object.getPrototypeOf(grid.behavior).formatColumnHeader = formatColumnHeader;

    grid.addEventListener("fin-column-sort", sortColumn.bind(grid));

    grid.addEventListener("fin-canvas-context-menu", right_click_handler);
    Object.getPrototypeOf(grid.behavior).cellClicked = async function(event) {
        event.primitiveEvent.preventDefault();
        event.handled = true;
        const {x, y} = event.dataCell;
        const config = this.dataModel.getConfig();
        const row_pivots = config.row_pivots;
        const column_pivots = config.column_pivots;
        const start_row = y >= 0 ? y : 0;
        const end_row = start_row + 1;
        const r = await this.dataModel._view.to_json({start_row, end_row});
        const row_paths = r.map(x => x.__ROW_PATH__);
        const row_pivots_values = row_paths[0] || [];
        const row_filters = row_pivots
            .map((pivot, index) => {
                const pivot_value = row_pivots_values[index];
                return pivot_value ? [pivot, "==", pivot_value] : undefined;
            })
            .filter(x => x);
        const column_index = row_pivots.length > 0 ? x + 1 : x;
        const column_paths = Object.keys(r[0])[column_index];
        let column_filters = [];
        let column_names;
        if (column_paths) {
            const column_pivot_values = column_paths.split("|");
            column_names = [column_pivot_values[column_pivot_values.length - 1]];
            column_filters = column_pivots
                .map((pivot, index) => {
                    const pivot_value = column_pivot_values[index];
                    return pivot_value ? [pivot, "==", pivot_value] : undefined;
                })
                .filter(x => x)
                .filter(([, , value]) => value !== "__ROW_PATH__");
        }

        const filters = config.filter.concat(row_filters).concat(column_filters);
        const action = this.grid.properties.rowSelection && this.grid.getSelectedRows().indexOf(y) === -1 ? "deselected" : "selected";

        this.grid.canvas.dispatchEvent(
            new CustomEvent("perspective-click", {
                bubbles: true,
                composed: true,
                detail: {
                    config: {filters},
                    column_names,
                    row: r[0],
                    action
                }
            })
        );

        return this.dataModel.toggleRow(event.dataCell.y, event.dataCell.x, event);
    };

    // Prevents flashing of cell selection on scroll
    const renderGrid = grid.renderer.renderGrid;
    grid.renderer.renderGrid = function(gc) {
        renderGrid.call(this, gc);
        this.renderOverrides(gc);
        this.renderLastSelection(gc);
    };

    grid.canvas.canvas.addEventListener("mousewheel", e => {
        if (e.shiftKey) {
            e.stopPropagation();
        }
    });

    // Corrects for deselection behavior on keyiup due to shadow-dom
    grid.canvas.hasFocus = function() {
        if (!grid.div.isConnected) {
            return;
        }
        const grid_element = grid.div.parentNode.parentNode.host;
        const view_shadow_root = grid_element.parentNode.parentNode.parentNode.parentNode.parentNode;
        return view_shadow_root.activeElement === grid_element;
    };

    // Disable cell selection dragging
    grid.lookupFeature("CellSelection").handleMouseDown = function(grid, event) {
        var dx = event.gridCell.x,
            dy = event.dataCell.y,
            isSelectable = grid.behavior.getCellProperty(event.dataCell.x, event.gridCell.y, "cellSelection");

        if (isSelectable && event.isDataCell && !event.primitiveEvent.detail.isRightClick) {
            var dCell = grid.newPoint(dx, dy),
                primEvent = event.primitiveEvent,
                keys = primEvent.detail.keys;
            this.extendSelection(grid, dCell, keys);
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    };

    // Disable cell selection by shift-click
    grid.lookupFeature("CellSelection").extendSelection = function(grid, gridCell, keys) {
        var hasCTRL = keys.indexOf("CTRL") >= 0,
            hasSHIFT = false,
            mousePoint = grid.getMouseDown(),
            x = gridCell.x, // - numFixedColumns + scrollLeft;
            y = gridCell.y; // - numFixedRows + scrollTop;

        //were outside of the grid do nothing
        if (x < 0 || y < 0) {
            return;
        }

        //we have repeated a click in the same spot deslect the value from last
        //time
        if (hasCTRL && x === mousePoint.x && y === mousePoint.y) {
            grid.clearMostRecentSelection();
            grid.popMouseDown();
            grid.repaint();
            return;
        }

        if (!hasCTRL && !hasSHIFT) {
            grid.clearSelections();
        }

        if (hasSHIFT) {
            grid.clearMostRecentSelection();
            grid.select(mousePoint.x, mousePoint.y, x - mousePoint.x, y - mousePoint.y);
            grid.setDragExtent(grid.newPoint(x - mousePoint.x, y - mousePoint.y));
        } else {
            grid.select(x, y, 0, 0);
            grid.setMouseDown(grid.newPoint(x, y));
            grid.setDragExtent(grid.newPoint(0, 0));
        }
        grid.repaint();
    };

    // Prevent multiple cell moves while pressing navigation keys while editing.
    grid.lookupFeature("CellSelection").handleDOWN = function(grid, event) {
        event.primitiveEvent.preventDefault();
        if (!grid.cellEditor) {
            const count = this.getAutoScrollAcceleration();
            let {x, y} = grid.selectionModel.getLastSelection().origin;
            const max = grid.renderer.dataWindow.origin.y + grid.renderer.dataWindow.extent.y - 2;
            if (y + count > max) {
                grid.sbVScroller.index++;
            }
            y = Math.min(grid.behavior.dataModel.getRowCount() - 1, y + count);
            grid.selectionModel.select(x, y, 0, 0);
            grid.repaint();
        }
    };

    grid.lookupFeature("CellSelection").handleUP = function(grid, event) {
        event.primitiveEvent.preventDefault();
        if (!grid.cellEditor) {
            const count = this.getAutoScrollAcceleration();
            let {x, y} = grid.selectionModel.getLastSelection().origin;
            const min = grid.renderer.dataWindow.origin.y;
            if (y - count < min) {
                grid.sbVScroller.index--;
            }
            y = Math.max(0, y - count);
            grid.selectionModel.select(x, y, 0, 0);
            grid.repaint();
        }
    };

    grid.lookupFeature("CellSelection").handleLEFT = function(grid, event) {
        event.primitiveEvent.preventDefault();
        if (!grid.cellEditor) {
            const count = this.getAutoScrollAcceleration();
            let {x, y} = grid.selectionModel.getLastSelection().origin;
            const min = grid.renderer.dataWindow.origin.x;
            if (x - count < min) {
                grid.sbHScroller.index--;
            }
            x = Math.max(0, x - 1);
            grid.selectionModel.select(x, y, 0, 0);
            grid.repaint();
        }
    };

    grid.lookupFeature("CellSelection").handleRIGHT = function(grid, event) {
        event.primitiveEvent.preventDefault();
        if (!grid.cellEditor) {
            const count = this.getAutoScrollAcceleration();
            let {x, y} = grid.selectionModel.getLastSelection().origin;
            const max = grid.renderer.dataWindow.origin.x + grid.renderer.dataWindow.extent.x - 1;
            if (x + count > max) {
                grid.sbHScroller.index++;
            }
            x = Math.min(grid.behavior.schema.length - 1, x + count);
            grid.selectionModel.select(x, y, 0, 0);
            grid.repaint();
        }
    };

    grid.lookupFeature("CellSelection").moveShiftSelect = function(grid, offsetX, offsetY) {
        grid.moveSingleSelect(offsetX, offsetY);
    };

    function update_bounds() {
        this.width = Math.floor(this.div.clientWidth);
        this.height = Math.floor(this.div.clientHeight);
        this.bounds = new rectangular.Rectangle(0, 0, this.width, this.height);
        this.component.setBounds(this.bounds);
    }

    grid.canvas.resize = async function(force) {
        //fix ala sir spinka, see
        //http://www.html5rocks.com/en/tutorials/canvas/hidpi/ just add 'hdpi'
        //as an attribute to the fin-canvas tag
        let ratio = 1;
        const isHIDPI = window.devicePixelRatio && this.component.properties.useHiDPI;
        if (isHIDPI) {
            const devicePixelRatio = window.devicePixelRatio || 1;
            const backingStoreRatio =
                this.gc.webkitBackingStorePixelRatio || this.gc.mozBackingStorePixelRatio || this.gc.msBackingStorePixelRatio || this.gc.oBackingStorePixelRatio || this.gc.backingStorePixelRatio || 1;

            ratio = devicePixelRatio / backingStoreRatio;
        }

        update_bounds.call(this);

        let render = true;
        const start_time = performance.now();
        const dataModel = this.component.grid.behavior.dataModel;
        if (this.height * ratio !== this.canvas.height || this.width * ratio !== this.canvas.width || force) {
            while (dataModel._view && render) {
                if (performance.now() - start_time > 3000) {
                    throw new Error("Timeout");
                }
                if (typeof render === "object") {
                    // If we are awaiting this grid's initialization, yield
                    // until it is ready.
                    await new Promise(setTimeout);
                }

                update_bounds.call(this);
                render = await new Promise(resolve => dataModel.fetchData(undefined, resolve));
            }
        }

        this.bounds = new rectangular.Rectangle(0, 0, this.width, this.height);
        this.component.setBounds(this.bounds);
        if (dataModel._view) {
            this.resizeNotification();
        }

        this.buffer.width = this.canvas.width = this.width * ratio;
        this.buffer.height = this.canvas.height = this.height * ratio;

        this.canvas.style.width = this.buffer.style.width = this.width + "px";
        this.canvas.style.height = this.buffer.style.height = this.height + "px";

        this.bc.scale(ratio, ratio);
        if (isHIDPI && !this.component.properties.useBitBlit) {
            this.gc.scale(ratio, ratio);
        }
        this.component.grid.renderer.needsComputeCellsBounds = false;
        grid.canvas.paintNow();
    };
};
