/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {GridUIFixPlugin} from "./fixes.js";

const Hypergrid = require("fin-hypergrid");
const Behaviors = require("fin-hypergrid/src/behaviors");
const Base = require("fin-hypergrid/src/Base.js");

const treeLineRendererPaint = require("./hypergrid-tree-cell-renderer.js").treeLineRendererPaint;
const GroupedHeader = require("./grouped-header.js");

const _ = require("underscore");

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
    if (payload.rows.length === 0) {
        this.grid.setData({data: []});
        return;
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
    if (this.schema_loaded) {
        this.grid.setData({
            data: payload.rows,
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
            data: payload.rows,
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
        for (let i = 0; i < grid.getRowCount(); i ++) {
            if (JSON.stringify(grid.getRow(i).rowPath) === path) {
                return i;
            }
        }
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

    let rows = [];
    for (let idx = 0; idx < data.length; idx++) {
        const row = data[idx] || {};
        let new_row = [];
        let row_path = [];
        let row_leaf = true;
        if (is_tree) {
            if (row.__ROW_PATH__ === undefined) {
                row.__ROW_PATH__ = [];
            }
            row_path = ["ROOT"].concat(row.__ROW_PATH__);
            let name = row['__ROW_PATH__'][row['__ROW_PATH__'].length - 1];
            if (name === undefined && idx === 0) name = "TOTAL"
            new_row = [name];
            row_leaf = row.__ROW_PATH__.length >= (data[idx + 1] ? data[idx + 1].__ROW_PATH__.length : 0);
        }
        for (var col of flat_columns) {
            new_row.push(row[col]);
        }
        rows.push({
            rowPath: row_path,
            rowData: new_row,
            rowLeaf: row_leaf
        });
    }

    var hg_data = {
        rows: rows,
        isTree: is_tree,
        configuration: {},
        columnPaths: (is_tree ? [[" "]] : []).concat(columnPaths),
        columnTypes: (is_tree ? ["str"] : []).concat(columnPaths.map(col => conv[schema[col[col.length - 1]]]))
    };

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

const PAGE_SIZE = 1000;

async function fill_page(view, json, hidden, start_row, end_row) {
    let next_page = await view.to_json({start_row: start_row, end_row: end_row});
    if (hidden.length > 0) {
        let first = next_page[0];
        let to_delete = [];
        for (let key in first) {
            let split_key = key.split(',');
            if (hidden.indexOf(split_key[split_key.length - 1].trim()) >= 0) {
                to_delete.push(key);
            }
        }
        for (let row of next_page) {
            for (let h of to_delete) {
                delete row[h];
            }
        }
    }
    for (let idx = 0; idx < next_page.length; idx++) {
        json[start_row + idx] = next_page[idx];
    }
    return json;
}

async function grid(div, view, hidden) {
    let [nrows, json, schema] = await Promise.all([
        view.num_rows(), 
        view.to_json({end_row: 1}), 
        view.schema()
    ]);
    let visible_rows = [];
    if (!this.grid) {
        this.grid = document.createElement('perspective-hypergrid');
        visible_rows = [0, 0, 100];
    } else if (this.grid.grid) {
        this.grid.grid.canvas.stopResizing();
        visible_rows = this.grid.grid.getVisibleRows();
    }
    json.length = nrows;
    if (visible_rows.length > 0) {
        json = await fill_page(view, json, hidden, visible_rows[1], visible_rows[visible_rows.length - 1] + 2);        
    }
    if (!(document.contains ? document.contains(this.grid) : false)) {
        div.innerHTML = "";
        div.appendChild(this.grid);
    }
    this.grid.grid._cache_update = async (s, e) => {
        json = await fill_page(view, json, hidden, s, e + 1);  
        this.grid.set_data(json, schema);
    }
    if (visible_rows.length > 0) {
        this.grid.set_data(json, schema);
        this.grid.grid.canvas.resize();
        this.grid.grid.canvas.resize();
    }
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


