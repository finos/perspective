/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const Hypergrid = require("fin-hypergrid");
const Behaviors = require("fin-hypergrid/src/behaviors");
const Base = require("fin-hypergrid/src/Base.js");

const treeLineRendererPaint = require("./hypergrid-tree-cell-renderer.js").treeLineRendererPaint;
const GroupedHeader = require("./grouped-header.js");

const _ = require("underscore");

const rectangular = require('rectangular')

import {registerElement, detectChrome} from "@jpmorganchase/perspective-common";

var TEMPLATE = require('../html/hypergrid.html');
import "../less/hypergrid.less";

var base_grid_properties = {
    autoSelectRows: false,
    cellPadding: 5,
    cellSelection: false,
    columnSelection: false,
    rowSelection: false,
    checkboxOnlyRowSelections: false,
    columnClip: true,
    columnHeaderFont: '12px amplitude-regular, Helvetica, sans-serif',
    columnHeaderForegroundSelectionFont: '12px "Arial", Helvetica, sans-serif',
    columnsReorderable: false,
    defaultRowHeight: 24,
    doubleClickDelay: 30,
    editable: false,
    editOnKeydown: true,
    editor: 'textfield',
    editorActivationKeys: [ 'alt', 'esc' ],
    enableContinuousRepaint: false,
    fixedColumnCount: 0,
    fixedRowCount: 0,
    font: '12px "Arial", Helvetica, sans-serif',
    foregroundSelectionFont: '12px "Arial", Helvetica, sans-serif',
    gridLinesH: false,
    gridLinesV: false,
    halign: 'left',
    headerTextWrapping: false,
    hoverColumnHighlight: { enabled: false },
    noDataMessage: '',
    minimumColumnWidth: 50,
    multipleSelections: false,
    renderFalsy: false,
    rowHeaderFont: '12px Arial, Helvetica, sans-serif',
    rowHeaderForegroundSelectionFont: '12px "Arial", Helvetica, sans-serif',
    rowResize: true,
    scrollbarHoverOff: 'visible',
    showCheckboxes: false,
    showFilterRow: true,
    showHeaderRow: true,
    showRowNumbers: false,
    showTreeColumn: false,
    singleRowSelectionMode: false,
    sortColumns: [],
    treeColumn: '',
    treeHeaderFont: '12px Arial, Helvetica, sans-serif',
    treeHeaderForegroundSelectionFont: '12px "Arial", Helvetica, sans-serif',
    useBitBlit: false,
    vScrollbarClassPrefix: '',
    voffset: 0
};

var light_theme_overrides = {
    backgroundColor: '#ffffff',
    color: "#666",
    lineColor: '#AAA',
    font: '12px Arial, Helvetica, sans-serif',
    foregroundSelectionFont: '12px amplitude-regular, Helvetica, sans-serif',
    foregroundSelectionColor: '#666',
    backgroundSelectionColor: 'rgba(162, 183, 206, 0.3)',
    selectionRegionOutlineColor: 'rgb(45, 64, 85)',
    columnHeaderColor: '#666',
    paintBackground: function(gc, config) {
    },
    columnHeaderBackgroundColor: '#fff',
    columnHeaderHalign: 'left',
    columnHeaderForegroundSelectionColor: '#333',
    columnHeaderBackgroundSelectionColor: '#40536d',
    columnHeaderBackgroundNumberPositive: '#1078d1',
    columnHeaderBackgroundNumberNegative: "#de3838",
    rowHeaderForegroundSelectionFont: '12px Arial, Helvetica, sans-serif',
    rowProperties: [
        { color: '#666', backgroundColor: '#fff' },
    ],
    hoverCellHighlight: {
        enabled: true,
        backgroundColor: 'rgba(211, 221, 232, 0.85)'
    },
    hoverRowHighlight: {
        enabled: true,
        backgroundColor: 'rgba(211, 221, 232, 0.50)'
    },
};

function generateGridProperties(overrides) {
    var full_properties = {};
    for (var propname in base_grid_properties) {
        full_properties[propname] = base_grid_properties[propname];
    }
    for (propname in overrides) {
        full_properties[propname] = overrides[propname];
    }
    return full_properties;
}

function setPSP(payload) {
    if (payload.data.length === 0) {
        this.grid.setData({data: []})
        return
    };
    if (payload.isTree) {
        this.grid.renderer.properties.fixedColumnCount = 1;
    } else {
        this.grid.renderer.properties.fixedColumnCount = 0;
    }
    var processed_schema = [];
    var treecolumnIndex = 0;
    var col_name, col_header, col_settings;

    if (payload.columnPaths[0].length === 0 || payload.columnPaths[0][0] === "") {
        payload.columnPaths[0] = [' '];
    }

    for (var i = 0; i < payload.columnPaths.length; i++) {
        col_name = payload.columnPaths[i].join('|');
        var aliases = payload.configuration.columnAliases;
        col_header = aliases ? (aliases[col_name] || col_name) : col_name;
        if (this.grid.properties.treeColumn === col_name) {
            treecolumnIndex = i;
        }

        col_settings = { name: i.toString(), header: col_header };
        col_settings['type'] = payload.columnTypes[i] === 'str' ? 'string' : payload.columnTypes[i];
        processed_schema.push(col_settings);
    }
    var old_schema = this.grid.behavior.subgrids.lookup.data.schema;
    this.schema_loaded = this.schema_loaded && _.isEqual(processed_schema, old_schema);
    this.schema = processed_schema;
    var mergedData = mergePathsAndRows(payload.rowPaths, payload.data, payload.rowLeaf);
    this.grid._rowPathsIndex = mergedData.rowPathsIndex;
    if (this.schema_loaded) {
        this.grid.setData({
            data: mergedData.data,
        });
    } else {

        // Memoize column widths;
        const widths = {};
        for (let w = 0; w < this.grid.getColumnCount(); w ++) {
            let header = this.grid.getColumnProperties(w).header;
            let name = header.split("|");
            name = name[name.length - 1];
            let width = this.grid.getColumnWidth(w);
            if (name in widths) {
                widths[header] = width;
            } else {
                widths[name] = width;
            }
        }
        console.log('Setting up initial schema and data load into HyperGrid');
        this.grid.behavior.setData({
            data: mergedData.data,
            schema: this.schema
        });
        this.schema_loaded = true;

        this.grid.canvas.dispatchEvent(new CustomEvent('fin-hypergrid-schema-loaded', { detail: { grid: this.grid } }));

        this.grid.properties.treeColumnIndex = 0;
        this.grid.installPlugins([GroupedHeader]);
        this.grid.behavior.setHeaders();

        let old = this.grid.renderer.computeCellsBounds;
        this.grid.renderer.computeCellsBounds = function() {
            old.call(this);
        }

        for (i = 0; i < this.schema.length; i++) {
            let props = this.grid.getColumnProperties(i);
            if (this.schema[i].type === 'number' || this.schema[i].type === 'float') {
                Object.assign(props, {
                    halign: 'right',
                    columnHeaderHalign: 'right',
                    format: 'FinanceFloat'
                });
            } else if (this.schema[i].type === 'integer') {
                Object.assign(props, {
                    halign: 'right',
                    columnHeaderHalign: 'right',
                    format: 'FinanceInteger'
                });
            } else if (this.schema[i].type === 'date') {
                Object.assign(props, {
                    format: 'FinanceDate'
                });
            }

            // restore column widths;
            let header = props.header;
            let name = header.split("|")
            name = name[name.length - 1];
            if (header in widths) {
                props.width = widths[header];
            } else if (name in widths) {
                props.width = widths[name];
            } else {
                props.width = 50;
            }
            props.columnAutosizing = true;
            this.grid.behavior.setColumnProperties(i, props);
        }
    }
    this.grid.canvas.dispatchEvent(new CustomEvent('fin-hypergrid-data-loaded', { detail: { grid: this.grid } }));

}

function GridUIFixPlugin(grid) {



    grid.canvas.resize = function() {
        var box = this.size = this.div.getBoundingClientRect();

        this.width = Math.floor(this.div.clientWidth);
        this.height = Math.floor(this.div.clientHeight);

        //fix ala sir spinka, see
        //http://www.html5rocks.com/en/tutorials/canvas/hidpi/
        //just add 'hdpi' as an attribute to the fin-canvas tag
        var ratio = 1;
        var isHIDPI = window.devicePixelRatio && this.component.properties.useHiDPI;
        if (isHIDPI) {
            var devicePixelRatio = window.devicePixelRatio || 1;
            var backingStoreRatio = this.gc.webkitBackingStorePixelRatio ||
                this.gc.mozBackingStorePixelRatio ||
                this.gc.msBackingStorePixelRatio ||
                this.gc.oBackingStorePixelRatio ||
                this.gc.backingStorePixelRatio || 1;

            ratio = devicePixelRatio / backingStoreRatio;
            //this.canvasCTX.scale(ratio, ratio);
        }

        this.buffer.width = this.canvas.width = this.width * ratio;
        this.buffer.height = this.canvas.height = this.height * ratio;

        this.canvas.style.width = this.buffer.style.width = this.width + 'px';
        this.canvas.style.height = this.buffer.style.height = this.height + 'px';

        this.bc.scale(ratio, ratio);
        if (isHIDPI && !this.component.properties.useBitBlit) {
            this.gc.scale(ratio, ratio);
        }

        this.bounds = new rectangular.Rectangle(0, 0, this.width, this.height);
        this.component.setBounds(this.bounds);
        this.resizeNotification();
        this.paintNow();
    }

    grid._getGridCellFromMousePoint = grid.getGridCellFromMousePoint;
    grid.getGridCellFromMousePoint = function(mouse) {
        if (this.getRowCount() === 0) {
            return {'fake': 1};
        } else {
            try {
                return this._getGridCellFromMousePoint(mouse);
            } catch (e) {
                return {'fake': 1};

            }
        }
    };


    grid.renderer._paintGridlines = grid.renderer.paintGridlines;
    grid.renderer.paintGridlines = function(gc) {
        var visibleColumns = this.visibleColumns, C = visibleColumns.length,
            visibleRows = this.visibleRows, R = visibleRows.length;

        if (C && R) {
            var gridProps = this.properties,
                lineWidth = gridProps.lineWidth,
                lineColor = gridProps.lineColor,
                viewHeight = visibleRows[R - 1].bottom,
                viewWidth = visibleColumns[C - 1].right;

            gc.cache.fillStyle = lineColor;

            if (gridProps.fixedColumnCount > 0 && gridProps.fixedColumnCount < C) {
                var lw = gridProps.gridLinesV ? lineWidth + 1: lineWidth;
                var fixedX = visibleColumns[gridProps.fixedColumnCount].left - 1;
                gc.fillRect(fixedX, 0, lw, viewHeight);
            }

            if (gridProps.fixedRowCount > 0 && gridProps.fixedRowCount < R) {
                var lw = gridProps.gridLinesH ? lineWidth + 1: lineWidth;
                var fixedY = visibleRows[gridProps.fixedRowCount].bottom;
                gc.fillRect(0, fixedY, viewWidth, lw);
            }

            gc.fillRect(0, visibleRows[0].bottom, viewWidth, 1);

            this._paintGridlines(gc);
        }
    };

    grid.renderer.computeCellsBounds = function() {

        var scrollTop = this.getScrollTop(),
            scrollLeft = this.getScrollLeft(),

            fixedColumnCount = this.grid.getFixedColumnCount(),
            fixedRowCount = this.grid.getFixedRowCount(),

            bounds = this.getBounds(),
            grid = this.grid,
            behavior = grid.behavior,
            editorCellEvent = grid.cellEditor && grid.cellEditor.event,

            vcEd, xEd,
            vrEd, yEd,
            sgEd, isSubgridEd,

            insertionBoundsCursor = 0,
            previousInsertionBoundsCursorValue = 0,

            lineWidthX = grid.properties.gridLinesV ? grid.properties.lineWidth : 1,
            lineWidthY = grid.properties.gridLinesH ? grid.properties.lineWidth : 0,

            start = 0,
            numOfInternalCols = 0,
            x, X, // horizontal pixel loop index and limit
            y, Y, // vertical pixel loop index and limit
            c, C, // column loop index and limit
            g, G, // subgrid loop index and limit
            r, R, // row loop index and limitrows in current subgrid
            subrows, // rows in subgrid g
            base, // sum of rows for all subgrids so far
            subgrids = behavior.subgrids,
            subgrid,
            rowIndex,
            scrollableSubgrid,
            footerHeight,
            vx, vy,
            vr, vc,
            width, height,
            firstVX, lastVX,
            firstVY, lastVY,
            topR,
            xSpaced, widthSpaced, heightSpaced; // adjusted for cell spacing

        if (editorCellEvent) {
            xEd = editorCellEvent.gridCell.x;
            yEd = editorCellEvent.dataCell.y;
            sgEd = editorCellEvent.subgrid;
        }
        if (grid.properties.showRowNumbers) {
            start = behavior.rowColumnIndex;
            numOfInternalCols = Math.abs(start);
        }

        this.scrollHeight = 0;

        this.visibleColumns.length = 0;
        this.visibleRows.length = 0;

        this.visibleColumnsByIndex = []; // array because number of columns will always be reasonable
        this.visibleRowsByDataRowIndex = {}; // hash because keyed by (fixed and) scrolled row indexes

        this.insertionBounds = [];

        for (
            x = 0, c = start, C = grid.getColumnCount(), X = bounds.width || grid.canvas.width;
            c < C && x <= X;
            c++
        ) {
            if (c === behavior.treeColumnIndex && !behavior.hasTreeColumn()) {
                numOfInternalCols = (numOfInternalCols > 0) ? numOfInternalCols - 1 : 0;
                this.visibleColumns[c] = undefined;
                continue;
            }

            vx = c;
            if (c >= fixedColumnCount) {
                lastVX = vx += scrollLeft;
                if (firstVX === undefined) {
                    firstVX = lastVX;
                }
            }
            if (vx >= C) {
                break; // scrolled beyond last column
            }

            width = Math.ceil(behavior.getColumnWidth(vx));

            xSpaced = x ? x + lineWidthX : x;
            widthSpaced = x ? width - lineWidthX : width;
            this.visibleColumns[c] = this.visibleColumnsByIndex[vx] = vc = {
                index: c,
                columnIndex: vx,
                column: behavior.getActiveColumn(vx),
                left: xSpaced,
                width: widthSpaced,
                right: xSpaced + widthSpaced
            };
            if (xEd === vx) {
                vcEd = vc;
            }

            x += width;

            insertionBoundsCursor += Math.round(width / 2) + previousInsertionBoundsCursorValue;
            this.insertionBounds.push(insertionBoundsCursor);
            previousInsertionBoundsCursorValue = Math.round(width / 2);
        }

        // get height of total number of rows in all subgrids following the data subgrid
        footerHeight = grid.properties.defaultRowHeight *
            subgrids.reduce(function(rows, subgrid) {
                if (scrollableSubgrid) {
                    rows += subgrid.getRowCount();
                } else {
                    scrollableSubgrid = subgrid.isData;
                }
                return rows;
            }, 0);

        for (
            base = r = g = y = 0, G = subgrids.length, Y = bounds.height - footerHeight;
            g < G;
            g++, base += subrows
        ) {
            subgrid = subgrids[g];
            subrows = subgrid.getRowCount();
            scrollableSubgrid = subgrid.isData;
            isSubgridEd = (sgEd === subgrid);
            topR = r;

            // For each row of each subgrid...
            for (R = r + subrows; r < R && y < Y; r++) {
                vy = r;
                if (scrollableSubgrid && r >= fixedRowCount) {
                    vy += scrollTop;
                    lastVY = vy - base;
                    if (firstVY === undefined) {
                        firstVY = lastVY;
                    }
                    if (vy >= R) {
                        break; // scrolled beyond last row
                    }
                }

                rowIndex = vy - base;
                height = behavior.getRowHeight(rowIndex, subgrid);

                heightSpaced = height - lineWidthY;
                this.visibleRows[r] = vr = {
                    index: r,
                    subgrid: subgrid,
                    rowIndex: rowIndex,
                    top: y,
                    height: heightSpaced,
                    bottom: y + heightSpaced
                };

                if (scrollableSubgrid) {
                    this.visibleRowsByDataRowIndex[vy - base] = vr;
                }

                if (isSubgridEd && yEd === rowIndex) {
                    vrEd = vr;
                }

                y += height;
            }

            if (scrollableSubgrid) {
                subrows = r - topR;
                Y += footerHeight;
            }
        }

        if (editorCellEvent) {
            editorCellEvent.visibleColumn = vcEd;
            editorCellEvent.visibleRow = vrEd;
            editorCellEvent.gridCell.y = vrEd && vrEd.index;
            editorCellEvent._bounds = null;
        }

        this.viewHeight = Y;

        this.dataWindow = this.grid.newRectangle(firstVX, firstVY, lastVX - firstVX, lastVY - firstVY);

        // Resize CellEvent pool
        var pool = this.cellEventPool,
            previousLength = pool.length,
            P = (this.visibleColumns.length + numOfInternalCols) * this.visibleRows.length;

        if (P > previousLength) {
            pool.length = P; // grow pool to accommodate more cells
        }
        for (var p = previousLength; p < P; p++) {
            pool[p] = new behavior.CellEvent; // instantiate new members
        }

        this.resetAllGridRenderers();
    };
}

function CheckboxTrackingPlugin(grid) {

    grid.selectionModel.checkedRows = {};

    grid._clearSelections = grid._clearSelections;
    grid._clearSelections = function () {
        grid.clearCheckedRows();
        grid._clearSelections();
    };

    grid.clearCheckedRows = function () {
        grid.selectionModel.checkedRows = {};
    };


    grid.isRowChecked = function (rowIdx) {
        var row = grid.getRow(rowIdx);
        if (row) {
            return (grid.selectionModel.checkedRows && (JSON.stringify(row.rowPath) in grid.selectionModel.checkedRows));
        }
    };

    grid.getCheckedRows = function () {
        return grid.selectionModel.checkedRows;
    };

    grid.getRowIdx = function (rowPath) {
        var path = Array.isArray(rowPath) ? JSON.stringify(rowPath) : rowPath;
        return grid._rowPathsIndex[path];
    };

}

function PerspectiveDataModel(grid) {
    Behaviors.JSON.prototype.setPSP = setPSP;

    var treeLineRenderer = Base.extend({ paint: treeLineRendererPaint });
    grid.cellRenderers.add('TreeLines', treeLineRenderer);
    grid.behavior.dataModel.configuration = {};
    grid.behavior.dataModel.configuration['expandedRows'] = [];

    this.grid = grid;
    this.viewData = [];

    grid.mixIn.call(grid.behavior.dataModel, {

        // Override setData
        setData: function (dataPayload, schema) {
            this.viewData = dataPayload;
            this.source.setData(dataPayload, schema);
        },

        // Is the grid view a tree
        isTree: function () {
            if (this.grid.behavior.dataModel.viewData) {
                let data = this.grid.behavior.dataModel.viewData;
                return (data.length === 0) || data[0].rowPath.length !== 0;
            }
            return false;
        },

        // Is this column the 'tree' column
        isTreeCol: function (x) {
            return x === this.grid.properties.treeColumnIndex && this.isTree();
        },

        isLeafNode: function (y) {
            return this.viewData[y].isLeaf;
        },

        // Custom API to check if a given row path and any children are expanded
        matchedRowExpansions: function( rowPath ) {
            var currentExpandedRows = this.configuration['expandedRows'];
            var matchedRowPathIndices = [];
            for (var i = 0; i < currentExpandedRows.length; i++) {
                if (_.isEqual(currentExpandedRows[i], rowPath)) {
                    matchedRowPathIndices.push(i);
                }
                if (rowPath.length < currentExpandedRows[i].length && _.isEqual(rowPath, currentExpandedRows[i].slice(0, rowPath.length))) {
                    matchedRowPathIndices.push(i);
                }
            }
            return matchedRowPathIndices;
        },

        // Return the value for a given cell based on (x,y) coordinates
        getValue: function(x, y) {
            return this.dataSource.data[y].rowData[x];
        },

        // Process a value entered in a cell within the grid
        setValue: function(x, r, value) {
            this.dataSource.setValue(x, r, value);
        },

        // Returns the number of rows for this dataset
        getRowCount: function () {
            return this.dataSource.data.length;
        },

        // Return the number of columns, allowing for the tree column
        getColumnCount: function() {
            var offset = this.grid.behavior.hasTreeColumn() ? -1 : 0;
            return this.dataSource.getColumnCount() + offset;
        },

        // Called when clickong on a row group expand
        toggleRow: function (y, expand, event) {
            if (this.isTreeCol(event.dataCell.x)) {
                var adjusted_path = this.dataSource.data[y].rowPath.slice();
                var existingRowExpansionIndices = this.matchedRowExpansions(adjusted_path);
                if (existingRowExpansionIndices.length > 0) {
                    existingRowExpansionIndices.sort();
                    for (var i = 0; i < existingRowExpansionIndices.length; i++) {
                        this.configuration['expandedRows'].splice(existingRowExpansionIndices[i]-i, 1);
                    }
                } else {
                    this.configuration['expandedRows'].push(adjusted_path);
                }
            }
        },

        cellStyle: function (gridCellConfig, rendererName) {
            if (gridCellConfig.value === null || gridCellConfig.value === undefined) {
                gridCellConfig.color = "#666";
                gridCellConfig.value = '-';
            } else if (['number', 'float', 'integer'].indexOf(this.schema[gridCellConfig.dataCell.x.toString()].type) > -1) {
                if (gridCellConfig.value === 0) {
                    gridCellConfig.color = '#666';
                    gridCellConfig.value = this.schema[gridCellConfig.dataCell.x.toString()].type === 'float' ? '0.00' : '0';
                } else if (isNaN(gridCellConfig.value))  {
                    gridCellConfig.color = '#666';
                    gridCellConfig.value = '-';
                } else {
                    gridCellConfig.color = gridCellConfig.value >= 0 ? (gridCellConfig.columnHeaderBackgroundNumberPositive || 'rgb(160,207,255)') : (gridCellConfig.columnHeaderBackgroundNumberNegative ||'rgb(255,136,136)');
                }
            } else if (this.schema[gridCellConfig.dataCell.x.toString()].type === 'boolean') {
                gridCellConfig.value = String(gridCellConfig.value);
            }
        },

        // Return the cell renderer
        getCell: function (config, rendererName) {
            // if in single row selection mode, hide the header row checkbox
            if (this.grid.properties.singleRowSelectionMode && config.isHandleColumn && config.isHeaderRow) {
                config.value = [];
            }
            else if (this.grid.properties.showCheckboxes && config.isHandleColumn && config.isDataRow) {
                var icon = Hypergrid.images[ this.grid.isRowChecked( config.dataCell.y) ? 'checked' : 'unchecked'];
                config.value = [icon];
            } else if (config.isUserDataArea) {
                this.cellStyle(config, rendererName);
                if (this.isTreeCol(config.dataCell.x)) {
                    config.depth = config.dataRow.rowPath.length-1;
                    config.leaf = config.dataRow.isLeaf;
                    var lastChild = (config.dataCell.y + 1) === this.getRowCount() || this.getRow(config.dataCell.y + 1).rowPath.length != config.dataRow.rowPath.length;
                    var next_row = this.dataSource.data[config.dataCell.y + 1];
                    config.expanded = next_row ? config.dataRow.rowPath.length < next_row.rowPath.length : false;
                    config.last = lastChild;
                    return grid.cellRenderers.get('TreeLines');
                }
            }
            return grid.cellRenderers.get(rendererName);
        },

        // Return the cell editor for a given (x,y) cell coordinate
        getCellEditorAt: function (x, y, declaredEditorName, cellEvent) {

            if (declaredEditorName) {
                var cellEditor = grid.cellEditors.create(declaredEditorName, cellEvent);
                if (declaredEditorName === 'combobox') {
                    cellEditor.modes[0].appendOptions = testingDropdownItems;
                }
                return cellEditor;
            }
            return declaredEditorName;
        }
    });
}


function mergePathsAndRows(rowPaths, rowData, rowLeaf) {
    var mergedData = [];
    var rowPathsIndex = {};
    for (var i = 0; i < rowData.length; i++) {
        var row_data = { rowPath: rowPaths[i], rowData: rowData[i] };
        row_data['isLeaf'] = rowLeaf ? rowLeaf[i] : true;
        mergedData.push(row_data);
        rowPathsIndex[JSON.stringify(rowPaths[i])] = i;
    }
    return { data: mergedData, rowPathsIndex: rowPathsIndex };
}

function convertToType(typ, val) {
    return ['object', 'boolean'].indexOf(typeof (typ)) > -1 ? JSON.parse(val) : (typ.constructor)(val);
}

var conv = {
    'integer': 'integer',
    'float': 'float',
    'string': 'str',
    'boolean': 'boolean',
    'date': 'date'
}

function psp2hypergrid(data, schema) {
    if (data.length === 0) {
        return {
            rowPaths: [],
            data: [],
            isTree: false,
            configuration: {},
            columnPaths: [],
            columnTypes: []
        }
    }
    var is_tree = data[0].hasOwnProperty('__ROW_PATH__');

    var columnPaths = Object.keys(data[0])
        .filter(row => row !== "__ROW_PATH__")
        .map(row => row.split(','));

    let flat_columns = columnPaths.map(col => col.join(","));

    let row_paths = [];
    let rows = [];
    let row_leaves = [];
    for (const idx in data) {
        const row = data[idx];
        let new_row = [];
        if (is_tree) {
            row_paths.push(["ROOT"].concat(row.__ROW_PATH__) || ["ROOT"]);
            let name = row['__ROW_PATH__'][row['__ROW_PATH__'].length - 1];
            if (name === undefined && idx === 0) name = "TOTAL"
            new_row = [name];
            row_leaves.push(row.__ROW_PATH__.length >= (data[idx + 1] ? data[idx + 1].__ROW_PATH__.length : 0));
        } else {
            row_paths.push([]);
        }
        for (var col of flat_columns) {
            new_row.push(row[col]);
        }
        rows.push(new_row);
    }

    var hg_data = {
        rowPaths: row_paths,
        data: rows,
        isTree: is_tree,
        configuration: {},
        columnPaths: (is_tree ? [[" "]] : []).concat(columnPaths),
        columnTypes: (is_tree ? ["str"] : []).concat(columnPaths.map(col => conv[schema[col[col.length - 1]]]))
    };

    if (is_tree) {
        hg_data['rowLeaf'] = row_leaves;
    }

    return hg_data
}

function null_formatter(formatter, null_value = '') {
    let old = formatter.format.bind(formatter);
    formatter.format = (val) => {
        if (typeof val === 'string') {
            return val;
        }
        if (null_value === val) {
            return '-';
        }
        let x = old(val);
        if (x === '') {
            return '-';
        }
        return x;
    }
    return formatter
}

registerElement(TEMPLATE, {

    set_data: { value: function(data, schema) {
        if (this._detached) {
            this._detached = false;
            this.grid.delegateCanvasEvents();
        }
        var hg_data = psp2hypergrid(data, schema);
        if (this.grid) {
            this.grid.behavior.setPSP(hg_data);
        } else {
            this._hg_data = hg_data;
        }
    }},

    detachedCallback: { value: function() {
       this.grid.removeAllEventListeners(true);
       this._detached = true;
    }},

    attachedCallback: {
        value: function () {
            if (!this.grid) {
                var host = this.querySelector('#mainGrid');

                host.setAttribute('hidden', true);
                this.grid = new Hypergrid(host, { Behavior: Behaviors.JSON });
                host.removeAttribute('hidden');
                this.grid.installPlugins([GridUIFixPlugin, PerspectiveDataModel, CheckboxTrackingPlugin ]);

                var grid_properties = generateGridProperties(light_theme_overrides);
                grid_properties['showRowNumbers'] = grid_properties['showCheckboxes'] || grid_properties['showRowNumbers'];
                this.grid.addProperties(grid_properties);

                this.grid.localization.add('FinanceFloat', null_formatter(new this.grid.localization.NumberFormatter('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })));

                this.grid.localization.add('FinanceInteger', null_formatter(new this.grid.localization.NumberFormatter('en-US', {})));

                this.grid.localization.add('FinanceDate', null_formatter(new this.grid.localization.DateFormatter('en-us', {
                    week: 'numeric',
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric'
                }), -1));

                if (this._hg_data) {
                    this.grid.behavior.setPSP(this._hg_data);
                    delete this._hgdata;
                }

            } else {
                this._detached = false;
                this.grid.delegateCanvasEvents();
            }
        }
    },

});


async function grid(div, view, hidden) {
    let [json, schema] = await Promise.all([view.to_json(), view.schema()]);
    if (hidden.length > 0) {
        let first = json[0];
        let to_delete = [];
        for (let key in first) {
            let split_key = key.split(',');
            if (hidden.indexOf(split_key[split_key.length - 1].trim()) >= 0) {
                to_delete.push(key);
            }
        }
        for (let row of json) {
            for (let h of to_delete) {
                delete row[h];
            }
        }
    }

    if (!this.grid) {
        this.grid = document.createElement('perspective-hypergrid');
    } else if (this.grid.grid) {
        this.grid.grid.canvas.stopResizing();
    }
    if (!(document.contains ? document.contains(this.grid) : false)) {
        div.innerHTML = "";
        div.appendChild(this.grid);
    }
    this.grid.set_data(json, schema);

    // TODO this resolves a bug in the TreeRenderer, the calculated tree column
    // width is 0 initially.
    this.grid.grid.canvas.resize();
    this.grid.grid.canvas.resize();
}

global.registerPlugin("hypergrid", {
    name: "Grid", 
    create: grid,
    selectMode: "toggle",
    resize: function () {
        if (this.grid) {
            this.grid.grid.canvas.resize();
        }
    },
    delete: function () {
    }
});


