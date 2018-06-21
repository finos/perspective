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

const base_grid_properties = {
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

const light_theme_overrides = {
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

    set_data(data, schema, tschema, row_pivots) {
        if (this._detached) {
            this._detached = false;
        }
        const hg_data = psp2hypergrid(data, schema, tschema, row_pivots);
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
            const host = this.querySelector('#mainGrid');

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


            const grid_properties = generateGridProperties(Hypergrid._default_properties || light_theme_overrides);
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
                    const f = {
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

function filter_hidden(hidden, json) {
    if (hidden.length > 0) {
        const first = json[0];
        const to_delete = [];
        for (let key in first) {
            const split_key = key.split(',');
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

const PRIVATE = Symbol('Hypergrid private');

async function grid(div, view, task) {
    const hidden = this._get_view_hidden();

    this[PRIVATE] = this[PRIVATE] || {};

    const [nrows, json, schema, tschema] = await Promise.all([
        view.num_rows(),
        view.to_json(Range.create(0, 100)),
        view.schema(),
        this._table.schema()
    ]);

    const rowPivots = JSON.parse(this.getAttribute('row-pivots')), isTree = !!rowPivots.length;

    let perspectiveHypergridElement;

    if (!this.hypergrid) {
        perspectiveHypergridElement = this[PRIVATE].grid = document.createElement('perspective-hypergrid');
        Object.defineProperty(this, 'hypergrid', {
            configurable: true,
            get: () => perspectiveHypergridElement.grid
        });
    } else {
        perspectiveHypergridElement = this[PRIVATE].grid;
    }

    if (!document.body.contains(perspectiveHypergridElement)) {
        div.innerHTML = '';
        div.appendChild(perspectiveHypergridElement);
        await new Promise(resolve => setTimeout(resolve));
    }

    const dataModel = this.hypergrid.behavior.dataModel;

    this.hypergrid._lazy_load = false;

    dataModel.isTree = function() {
        return isTree;
    };

    dataModel.getRowCount = function() {
        return nrows;
    };

    dataModel.pspFetch = async function(range) {
        let next_page = await view.to_json(range);
        next_page = filter_hidden(hidden, next_page);
        const rows = psp2hypergrid(next_page, schema, tschema, rowPivots).rows;
        const data = this.data, base = range.start_row;
        rows.forEach((row, offset) => data[base + offset] = row);
    };

    perspectiveHypergridElement.set_data(json, schema, tschema, rowPivots);
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


