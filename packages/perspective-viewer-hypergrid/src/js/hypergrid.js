/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const Hypergrid = require('fin-hypergrid');
const Base = require('fin-hypergrid/src/Base');
const groupedHeaderPlugin = require('fin-hypergrid-grouped-header-plugin');

const Range = require('./Range');
const CachedRendererPlugin = require('./CachedRendererPlugin');
const perspectivePlugin = require('./perspective-plugin');
const PerspectiveDataModel = require('./PerspectiveDataModel');
const treeLineRendererPaint = require('./hypergrid-tree-cell-renderer').treeLineRendererPaint;
const psp2hypergrid = require('./psp-to-hypergrid');

// import {detectChrome} from "@jpmorganchase/perspective/src/js/utils.js";
import {bindTemplate} from "@jpmorganchase/perspective-viewer/src/js/utils.js";

const TEMPLATE = require('../html/hypergrid.html');

import "../less/hypergrid.less";

const TREE = require('fin-hypergrid/src/behaviors/Behavior').prototype.treeColumnIndex;

const COLUMN_HEADER_FONT = '12px amplitude-regular, Helvetica, sans-serif';
const GROUP_LABEL_FONT = '12px open sans, sans-serif'; // overrides COLUMN_HEADER_FONT for group labels

var base_grid_properties = {
    autoSelectRows: false,
    cellPadding: 5,
    cellSelection: false,
    columnSelection: false,
    rowSelection: false,
    checkboxOnlyRowSelections: false,
    columnClip: true,
    columnHeaderFont: COLUMN_HEADER_FONT,
    columnHeaderForegroundSelectionFont: '12px "Arial", Helvetica, sans-serif',
    columnsReorderable: false,
    defaultRowHeight: 24,
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
    gridLinesV: true, // except: due to groupedHeaderPlugin's `clipRuleLines: true` option, only header row displays these lines
    gridLinesUserDataArea: false, // restricts vertical rule line rendering to header row only
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
    color: '#666',
    lineColor: '#AAA',
    // font: '12px Arial, Helvetica, sans-serif',
    font: '12px "Open Sans", Helvetica, sans-serif',
    foregroundSelectionFont: '12px amplitude-regular, Helvetica, sans-serif',
    foregroundSelectionColor: '#666',
    backgroundSelectionColor: 'rgba(162, 183, 206, 0.3)',
    selectionRegionOutlineColor: 'rgb(45, 64, 85)',
    columnHeaderColor: '#666',
    columnHeaderHalign: 'left', // except: group header labels always 'center'; numbers always 'right' per `setPSP`
    columnHeaderBackgroundColor: '#fff',
    columnHeaderForegroundSelectionColor: '#333',
    columnHeaderBackgroundSelectionColor: '#40536d',
    columnHeaderBackgroundNumberPositive: '#1078d1',
    columnHeaderBackgroundNumberNegative: '#de3838',
    rowHeaderForegroundSelectionFont: '12px Arial, Helvetica, sans-serif',
    treeHeaderColor: '#666',
    treeHeaderBackgroundColor: '#fff',
    treeHeaderForegroundSelectionColor: '#333',
    treeHeaderBackgroundSelectionColor: '#40536d',
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
    return Object.assign({}, base_grid_properties, overrides);
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
    };

    return formatter;
}

bindTemplate(TEMPLATE)(class HypergridElement extends HTMLElement {

    set_data(data, schema, tschema, row_pivots, s, e, l) {
        if (this._detached) {
            this._detached = false;
        }
        var hg_data = psp2hypergrid(data, schema, tschema, row_pivots, s, e, l);
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
            this.grid = new Hypergrid(host, { DataModel: PerspectiveDataModel });
            host.removeAttribute('hidden');

            // window.g = this.grid; window.p = g.properties; // for debugging convenience in console

            this.grid.installPlugins([
                perspectivePlugin,
              //  CachedRendererPlugin,
                [groupedHeaderPlugin, {
                    paintBackground: null, // no group header label decoration
                    columnHeaderLines: false, // only draw vertical rule lines between group labels
                    groupConfig: [{
                        halign: 'center', // center group labels
                        font: GROUP_LABEL_FONT
                    }]
                }]
            ]);


            let grid_properties = generateGridProperties(Hypergrid._default_properties || light_theme_overrides);
            const style = window.getComputedStyle(this, null);
            const header = window.getComputedStyle(this.querySelector('th'), null);
            grid_properties['showRowNumbers'] = grid_properties['showCheckboxes'] || grid_properties['showRowNumbers'];
            grid_properties['backgroundColor'] = style.getPropertyValue('background-color');
            grid_properties['color'] = style.getPropertyValue('color');
            grid_properties['columnHeaderBackgroundColor'] = header.getPropertyValue('background-color');
            grid_properties['columnHeaderSeparatorColor'] = header.getPropertyValue('border-color');
            grid_properties['columnHeaderColor'] = header.getPropertyValue('color');
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
                format: function(val, type) {
                    let f = {
                        date: date_formatter,
                        integer: integer_formatter,
                        float: float_formatter,
                    }[type];
                    if (f) {
                        return f.format(val);
                    }
                    return val;
                },
                parse: x => x
            });

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
    return json;
}

async function fill_page(view, json, hidden, range) {
    let next_page = await view.to_json(range);
    next_page = filter_hidden(hidden, next_page);
    for (let idx = 0; idx < next_page.length; idx++) {
        json[range.start_row + idx] = next_page[idx];
    }
    return json;
}

const LAZY_THRESHOLD = 10000;

const PRIVATE = Symbol('Hypergrid private');

async function grid(div, view, task) {
    let hidden = this._get_view_hidden();

    this[PRIVATE] = this[PRIVATE] || {};

    let [nrows, json, schema, tschema] = await Promise.all([
        view.num_rows(),
        view.to_json({end_row: 1}),
        view.schema(),
        this._table.schema()
    ]);

    if (!this.hypergrid) {
        this[PRIVATE].grid = document.createElement('perspective-hypergrid');
        Object.defineProperty(this, 'hypergrid', {
            get: () => this[PRIVATE].grid.grid
        });
    }

    json.length = nrows;

    if (!(document.contains ? document.contains(this[PRIVATE].grid) : false)) {
        div.innerHTML = '';
        div.appendChild(this[PRIVATE].grid);
        await new Promise(resolve => setTimeout(resolve));
    }

    this.hypergrid._lazy_load = false;

    this.hypergrid._cache_update = this.hypergrid.behavior.dataModel._cache_update = async (range, cb) => {
        let next_page = await view.to_json(range);
        next_page = filter_hidden(hidden, next_page);
        let new_range = Range.estimate(this.hypergrid);
        let val = false;
        if (new_range.within(range)) {
            let rows = psp2hypergrid(
                next_page, 
                schema,
                tschema,
                JSON.parse(this.getAttribute('row-pivots')), 
                0, 
                next_page.length, 
                next_page.length
            ).rows;
            for (let x = range.start_row; x < range.end_row + 1; x++) {
                let cell = x - range.start_row;
                if (cell < rows.length) {
                    this.hypergrid.behavior.dataModel.data[x] = rows[cell];
                }
            }
            val = true;
        } else if (new_range.start_row + next_page.length < this.hypergrid.behavior.dataModel.data.length + 1) {
            val = true;
        }
        if (cb) cb();
        return val;
    };

    this[PRIVATE].grid.set_data(json, schema, tschema, JSON.parse(this.getAttribute('row-pivots')), 0, 30, nrows);
}

global.registerPlugin('hypergrid', {
    name: 'Grid',
    create: grid,
    selectMode: 'toggle',
    deselectMode: 'pivots',
    resize: function() {
        if (this.hypergrid) {
            this.hypergrid.canvas.resize();
        }
    },
    delete: function() {
        if (this.hypergrid) {
            this.hypergrid.terminate();
        }
    }
});


