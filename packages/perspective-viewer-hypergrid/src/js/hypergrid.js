/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const Hypergrid = require("fin-hypergrid");
const images = require('fin-hypergrid/images');
const JSONBehavior = require("fin-hypergrid/src/behaviors/JSON.js");
const Base = require("fin-hypergrid/src/Base.js");

const treeLineRendererPaint = require("./hypergrid-tree-cell-renderer.js").treeLineRendererPaint;
const GroupedHeader = require("./grouped-header.js");

const _ = require("underscore");

import {detectChrome} from "@jpmorganchase/perspective/src/js/utils.js";
import {bindTemplate} from "@jpmorganchase/perspective-viewer/src/js/utils.js";

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
    fixedLinesHWidth: 1,
    fixedLinesVWidth: 1,
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
    rowHeaderCheckboxes: false,
    rowHeaderNumbers: false,
    showFilterRow: true,
    showHeaderRow: true,
    showTreeColumn: false,
    singleRowSelectionMode: false,
    sortColumns: [],
    treeRenderer: 'TreeCell',
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
    // font: '12px Arial, Helvetica, sans-serif',
    font: '12px "Open Sans", Helvetica, sans-serif',
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
    treeHeaderColor: '#666',
    treeHeaderBackgroundColor: '#fff',
    treeHeaderForegroundSelectionColor: '#333',
    treeHeaderBackgroundSelectionColor: '#40536d',
    rowProperties: [
        { color: '#666', backgroundColor: '#fff' },
    ],
    hoverCellHighlight: {
        enabled: true,
        backgroundColor: '#eeeeee'
    },
    hoverRowHighlight: {
        enabled: true,
        backgroundColor: '#f6f6f6'
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
    var processed_schema = [];
    var col_name, col_header, col_settings;

    if (payload.columnPaths[0].length === 0 || payload.columnPaths[0][0] === "") {
        payload.columnPaths[0] = [' '];
    }

    for (var i = (payload.isTree?1:0); i < payload.columnPaths.length; i++) {
        col_name = payload.columnPaths[i].join('|');
        var aliases = payload.configuration.columnAliases;
        col_header = aliases ? (aliases[col_name] || col_name) : col_name;

        col_settings = { name: i.toString(), header: col_header };
        if (payload.columnTypes[i] === 'str') {
            col_settings['type'] = 'string';
        } else {
            col_settings['type'] = payload.columnTypes[i];
        }
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
        this.grid.setData({
            data: payload.rows,
            schema: this.schema
        });
        this.schema_loaded = true;

        if (payload.isTree) {
            this.grid.properties.showTreeColumn = true;
        }

        this.grid.behavior.setHeaders();

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
            } else if (Array.isArray(this.schema[i].type)) {
                Object.assign(props, {
                    format: 'FinanceTree'
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

        this.grid.canvas.dispatchEvent(new CustomEvent('fin-hypergrid-schema-loaded', { detail: { grid: this.grid } }));

    }
    this.grid.canvas.dispatchEvent(new CustomEvent('fin-hypergrid-data-loaded', { detail: { grid: this.grid } }));

}


function PerspectiveDataModel(grid) {
    grid.behavior.__proto__.setPSP = setPSP;

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

        // Return the value for a given cell based on (x,y) coordinates
        getValue: function(x, y) {
            var offset = this.grid.behavior.hasTreeColumn() ? 1 : 0;
            return this.dataSource.data[y].rowData[x+offset];
        },

        // Process a value entered in a cell within the grid
        setValue: function(x, r, value) {
            this.dataSource.setValue(x, r, value);
        },

        // Returns the number of rows for this dataset
        getRowCount: function () {
            return this.dataSource.data.length;
        },

        cellStyle: function (gridCellConfig, rendererName) {
            if (gridCellConfig.value === null || gridCellConfig.value === undefined) {
                gridCellConfig.value = '-';
            } else if (['number', 'float', 'integer'].indexOf(this.schema[gridCellConfig.dataCell.x.toString()].type) > -1) {
                if (gridCellConfig.value === 0) {
                    gridCellConfig.value = this.schema[gridCellConfig.dataCell.x.toString()].type === 'float' ? '0.00' : '0';
                } else if (isNaN(gridCellConfig.value))  {
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
            if (config.isUserDataArea) {
                this.cellStyle(config, rendererName);
            } else {
                if (config.dataCell.x == -1) {
                    if (!config.isHeaderRow) {
                    config.last = (config.dataCell.y + 1) === this.getRowCount() || this.getRow(config.dataCell.y + 1).rowPath.length != config.dataRow.rowPath.length;

                    var next_row = this.dataSource.data[config.dataCell.y + 1];
                    config.expanded = next_row ? config.dataRow.rowPath.length < next_row.rowPath.length : false;
                    } else {
                        rendererName = 'SimpleCell';
                        config.value = '';
                    }
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

function psp2hypergrid(data, schema, tschema, row_pivots, start = 0, end = undefined, length = undefined) {
    if (data.length === 0) {
        let columns = Object.keys(schema);
        return {
            rows: [],
            rowPaths: [],
            data: [],
            isTree: false,
            configuration: {},
            columnPaths: columns.map(col => [col]),
            columnTypes: columns.map(col => conv[schema[col]])
        }
    }

    var is_tree = data[0].hasOwnProperty('__ROW_PATH__');

    var columnPaths = Object.keys(data[0])
        .filter(row => row !== "__ROW_PATH__")
        .map(row => row.split(','));

    let flat_columns = columnPaths.map(col => col.join(","));

    let rows = [];
    if (length) {
        rows.length = length;
    }
    for (let idx = start; idx < (end || data.length); idx++) {
        const row = data[idx];
        let new_row = [];
        let row_path = [];
        let row_leaf = true;
        if (row) {
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
        }
        rows[idx] = {
            rowPath: row_path,
            rowData: new_row,
            isLeaf: row_leaf
        };
    }

    var hg_data = {
        rows: rows,
        isTree: is_tree,
        configuration: {},
        columnPaths: (is_tree ? [[" "]] : []).concat(columnPaths),
        columnTypes: (is_tree ? [row_pivots.map(x => tschema[x])] : []).concat(columnPaths.map(col => conv[schema[col[col.length - 1]]]))
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
  
function is_subrange(sub, sup) {
    if (!sup) {
        return false;
    }
    return sup[0] <= sub[0] && sup[1] >= sub[1];
}


// How many rows to pad the cache by;  TODO this should really be calculated
// from the parameters of the theme.
const OFFSET_SETTINGS = 5;

/**
 * Estimate the visible range of a Hypergrid.
 * 
 * @param {any} grid 
 * @returns 
 */
function estimate_range(grid) {
    let range = Object.keys(grid.renderer.visibleRowsByDataRowIndex);
    return [parseInt(range[0]), parseInt(range[range.length - 1]) + OFFSET_SETTINGS];
}

import rectangular from 'rectangular';

function CachedRendererPlugin(grid) {

    async function update_cache() {
        if (grid._lazy_load) {
            let range = estimate_range(grid);
            let is_valid_range = Number.isNaN(range[0]) || Number.isNaN(range[1]);
            let is_processing_range = grid._updating_cache && !is_subrange(range, grid._updating_cache.range);
            let is_range_changed = !grid._updating_cache && !is_subrange(range, grid._cached_range);
            if (!is_valid_range && (is_processing_range || is_range_changed)) {
                grid._updating_cache = grid._cache_update(...range);
                grid._updating_cache.range = range
                let updated = await grid._updating_cache;
                if (updated) {
                    grid._updating_cache = undefined;
                    grid._cached_range = range;  
                }
                return updated;
            } else if (!is_subrange(range, grid._cached_range)) {
                return false; 
            }
        }
        return true;
    }

    grid.canvas._paintNow = grid.canvas.paintNow;

    grid.canvas.resize = async function() {
        var box = this.size = this.div.getBoundingClientRect();

        let width = this.width = Math.floor(this.div.clientWidth);
        let height = this.height = Math.floor(this.div.clientHeight);

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


        this.bounds = new rectangular.Rectangle(0, 0, width, height);
        this.component.setBounds(this.bounds);
        this.resizeNotification();

        let render = await update_cache();

        if (render) {
            this.buffer.width = this.canvas.width = width * ratio;
            this.buffer.height = this.canvas.height = height * ratio;

            this.canvas.style.width = this.buffer.style.width = width + 'px';
            this.canvas.style.height = this.buffer.style.height = height + 'px';

            this.bc.scale(ratio, ratio);
            if (isHIDPI && !this.component.properties.useBitBlit) {
                this.gc.scale(ratio, ratio);
            }

            grid.canvas._paintNow();
        }
    }

    grid.canvas.paintNow = async function () {
        let render = await update_cache();
        if (render) {
            grid.canvas._paintNow();
        }
    }
}

bindTemplate(TEMPLATE)(class HypergridElement extends HTMLElement {

    set_data(data, schema, tschema, row_pivots) {
        if (this._detached) {
            this._detached = false;
        }
        var hg_data = psp2hypergrid(data, schema, tschema, row_pivots);
        if (this.grid) {
            this.grid.behavior.setPSP(hg_data);
        } else {
            this._hg_data = hg_data;
        }
    }

    detachedCallback() {
        this._detached = true;
    }

    connectedCallback() {
        if (!this.grid) {
            var host = this.querySelector('#mainGrid');

            host.setAttribute('hidden', true);
            this.grid = new Hypergrid(host, { Behavior: JSONBehavior });
            host.removeAttribute('hidden');

            this.grid.installPlugins([
                PerspectiveDataModel,
                CachedRendererPlugin,
                [GroupedHeader, {CellRenderer: 'SimpleCell'}]
            ]);

            let grid_properties = generateGridProperties(Hypergrid._default_properties || light_theme_overrides);
            this.grid.addProperties(grid_properties);

            // Add tree cell renderer
            this.grid.cellRenderers.add('TreeCell', Base.extend({ paint: treeLineRendererPaint }));

            const float_formatter = null_formatter(new this.grid.localization.NumberFormatter('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }));
            this.grid.localization.add('FinanceFloat', float_formatter);

            const integer_formatter = null_formatter(new this.grid.localization.NumberFormatter('en-US', {}));
            this.grid.localization.add('FinanceInteger', integer_formatter);

            const date_formatter = null_formatter(new this.grid.localization.DateFormatter('en-us', {
                week: 'numeric',
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            }), -1);
            this.grid.localization.add('FinanceDate', date_formatter);

            this.grid.localization.add('FinanceTree', {
                format: function (val, type) {
                    let f = {
                        'date': date_formatter,
                        'integer': integer_formatter,
                        'float': float_formatter,
                    }[type];
                    if (f) {
                        return f.format(val);
                    }
                    return val;
                },
                parse: x => x
            })

            if (this._hg_data) {
                this.grid.behavior.setPSP(this._hg_data);
                delete this._hgdata;
            }
            
        } else {
            this._detached = false;
        }
    }

});

const PAGE_SIZE = 1000;

function filter_hidden(hidden, json) {
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
    return json
}

async function fill_page(view, json, hidden, start_row, end_row) {
    let next_page = await view.to_json({start_row: start_row, end_row: end_row});
    next_page = filter_hidden(hidden, next_page);
    for (let idx = 0; idx < next_page.length; idx++) {
        json[start_row + idx] = next_page[idx];
    }
    return json;
}

const LAZY_THRESHOLD = 10000;

const PRIVATE = Symbol("Hypergrid private");

async function grid(div, view, hidden, task) {

    this[PRIVATE] = this[PRIVATE] || {};

    let [nrows, json, schema, tschema] = await Promise.all([
        view.num_rows(), 
        view.to_json({end_row: 1}), 
        view.schema(),
        this._table.schema()
    ]);

    let visible_rows;

    if (!this.hypergrid) {
        let grid = document.createElement('perspective-hypergrid');
        this[PRIVATE].grid = grid;
        Object.defineProperty(this, 'hypergrid', {
            get: () => this[PRIVATE].grid.grid
        });
    }

    json.length = nrows;

    let lazy_load = nrows > LAZY_THRESHOLD;

    if (!(document.contains ? document.contains(this[PRIVATE].grid) : false)) {
        div.innerHTML = "";
        div.appendChild(this[PRIVATE].grid);
        await new Promise(resolve => setTimeout(resolve));
    }

    if (!lazy_load) {
        json = view.to_json().then(json => filter_hidden(hidden, json));
    } else {
        let range = estimate_range(this.hypergrid);
        if (Number.isNaN(range[0]) || Number.isNaN(range[1])) {
            range = [0, 100];
        }
        json = fill_page(view, json, hidden, ...range);
        this.hypergrid._cached_range = range;
    }

    json = await json;
    if (task.cancelled) {
        return;
    }

    this.hypergrid._lazy_load = lazy_load;

    this.hypergrid._cache_update = async (s, e) => {
        json = await fill_page(view, json, hidden, s, e); 
        let new_range = estimate_range(this.hypergrid);
        if (is_subrange(new_range, [s, e])) {
            let rows = psp2hypergrid(json, schema, tschema, JSON.parse(this.getAttribute('row-pivots')), s, Math.min(e, nrows), nrows).rows;
            rows[0] = this.hypergrid.behavior.dataModel.viewData[0];
            this.hypergrid.setData({data: rows});
            return true;
        } else {
            return false;
        }
    }
   
    this[PRIVATE].grid.set_data(json, schema, tschema, JSON.parse(this.getAttribute('row-pivots')), 0, 30, nrows);
    await this.hypergrid.canvas.resize();
    await this.hypergrid.canvas.resize();
}

global.registerPlugin("hypergrid", {
    name: "Grid", 
    create: grid,
    selectMode: "toggle",
    deselectMode: "pivots",
    resize: function () {
        if (this.hypergrid) {
            this.hypergrid.canvas.resize();
        }
    },
    delete: function () {
        if (this.hypergrid) {
           // this.hypergrid.clearState();
            this.hypergrid.behavior.reset();
            this.hypergrid.renderer.reset();
            this.hypergrid.canvas.resize();
        }
    }
});


