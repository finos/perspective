/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import "@webcomponents/webcomponentsjs";
import _ from "underscore";
import {polyfill} from "mobile-drag-drop";
import "awesomplete";
import "awesomplete/awesomplete.css";

import perspective from "@jpmorganchase/perspective/src/js/perspective.parallel.js";
import {bindTemplate} from "./utils.js";

import template from "../html/view.html";

import "../less/view.less";

import "./row.js";

polyfill({});

/******************************************************************************
 *
 * Plugin API
 *
 */

const RENDERERS = {};

/**
 * Register a plugin with the <perspective-viewer> component.
 *
 * Params
 * ------
 * name : The logical unique name of the plugin.  This will be used to set the
 *     component's `view` attribute.
 * plugin : An object with this plugin's prototype.  Valid keys are:
 *     name : The display name for this plugin.
 *     create (required) : The creation function - may return a `Promise`.
 *     delete : The deletion function.
 *     mode : The selection mode - may be "toggle" or "select".  
 */
global.registerPlugin = function registerPlugin(name, plugin) {
    RENDERERS[name] = plugin;
}

/******************************************************************************
 *
 * Drag & Drop Utils
 *
 */

function undrag(event) {
    let div = event.target;
    while (div && div.tagName !== 'PERSPECTIVE-ROW') {
        div = div.parentElement;
    }
    let parent = div.parentElement;
    let idx = Array.prototype.slice.call(parent.children).indexOf(div);
    let attr_name = parent.getAttribute('id').replace('_', '-');
    let pivots = JSON.parse(this.getAttribute(attr_name));
    pivots.splice(idx, 1);
    this.setAttribute(attr_name, JSON.stringify(pivots));
}

function calc_index(event) {
    if (this._active_columns.children.length == 0) {
        return 0;
    } else {
        for (let cidx in this._active_columns.children) {
            let child = this._active_columns.children[cidx];
            if (child.offsetTop + child.offsetHeight > event.offsetY + this._active_columns.scrollTop) {
                return cidx;
            }
        }
        return this._active_columns.children.length;
    }
}

function column_undrag(event) {
    let data = event.target.parentElement.parentElement;
    Array.prototype.slice.call(this._active_columns.children).map(x => {x.className = '';});
    if (this._visible_column_count() > 1 && event.dataTransfer.dropEffect !== 'move') {
        this._active_columns.removeChild(data);
        this._update_column_view();
    }
    this._active_columns.classList.remove('dropping');        
}

function column_dragleave(event) {
    let src = event.relatedTarget;
    while (src && src !== this._active_columns) {
        src = src.parentElement;
    }
    if (src === null) {
        this._active_columns.classList.remove('dropping');
        if (this._drop_target_hover.parentElement === this._active_columns) { 
            this._active_columns.removeChild(this._drop_target_hover);
        }
        if (this._original_index !== -1) {
            this._active_columns.insertBefore(this._drop_target_hover, this._active_columns.children[this._original_index]);
        }
        this._drop_target_hover.removeAttribute('drop-target');
    }    
}

function column_dragover(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (event.currentTarget.className !== 'dropping') {
        event.currentTarget.classList.add('dropping');
    }
    if (!this._drop_target_hover.hasAttribute('drop-target')) {
        this._drop_target_hover.setAttribute('drop-target', true);
    }
    let new_index = calc_index.call(this, event);
    let current_index = Array.prototype.slice.call(this._active_columns.children).indexOf(this._drop_target_hover);
    if (current_index < new_index) new_index += 1;
    if (new_index < this._active_columns.children.length) {
        if (!this._active_columns.children[new_index].hasAttribute('drop-target')) {
            this._active_columns.insertBefore(this._drop_target_hover, this._active_columns.children[new_index]);
        }  
    } else {
        if (!this._active_columns.children[this._active_columns.children.length - 1].hasAttribute('drop-target')) {
            this._active_columns.appendChild(this._drop_target_hover);
        }
    }
}

function column_drop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.remove('dropping');
    if (this._drop_target_hover.parentElement === this._active_columns) {
        this._drop_target_hover.removeAttribute('drop-target');
    }
    Array.prototype.slice.call(this._active_columns.children).map(x => {x.className = '';});
    let data = ev.dataTransfer.getData('text');
    if (!data) return;
    
    this._update_column_view();    
}

function drop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.remove('dropping');
    if (this._drop_target_hover) {
        this._drop_target_hover.removeAttribute('drop-target');
    }
    let data = ev.dataTransfer.getData('text');
    if (!data) return;
    data = JSON.parse(data);

    // Update the columns attribute
    let name = ev.currentTarget.getAttribute('id').replace('_', '-');
    let columns = JSON.parse(this.getAttribute(name) || "[]");
    let data_index = columns.indexOf(data[0]);
    if (data_index !== -1) {
        columns.splice(data_index, 1);
    }
    if (name.indexOf('filter') > -1) {
        this.setAttribute(name, JSON.stringify(columns.concat([data])));
    } else {
        this.setAttribute(name, JSON.stringify(columns.concat([data[0]])));
    }

    // Deselect the dropped column
    if (this._plugin.deselectMode === "pivots" && this._visible_column_count() > 1 && name !== "sort") {
        for (let x of this.querySelectorAll("#active_columns perspective-row")) {
            if (x.getAttribute('name') === data) {
                 this._active_columns.removeChild(x);
                 break;
            }
        }
        this._update_column_view();
    }

    this._update();
}

/******************************************************************************
 *
 * Column Row Utils
 *
 */

function column_visibility_clicked(ev) {
    let parent = ev.currentTarget;
    let is_active = parent.parentElement.getAttribute('id') === 'active_columns';
    if (is_active) {
        if (this._visible_column_count() === 1) {
            return;
        }
        if (ev.detail.shiftKey) {
            for (let child of Array.prototype.slice.call(this._active_columns.children)) {
                if (child !== parent) {
                    this._active_columns.removeChild(child);
                }
            }
        } else {
            this._active_columns.removeChild(parent);
        }
    } else {
        if (ev.detail.shiftKey && this._plugin.selectMode === 'toggle' || !ev.detail.shiftKey && this._plugin.selectMode === 'select') {
            for (let child of Array.prototype.slice.call(this._active_columns.children)) {
                this._active_columns.removeChild(child);
            }
        }
        let row = new_row.call(this, parent.getAttribute('name'), parent.getAttribute('type'));
        this._active_columns.appendChild(row);
    }
    let cols = this._view_columns('#active_columns perspective-row');
    this._update_column_view(cols);
}

function column_aggregate_clicked() {
    let aggregates = get_aggregate_attribute.call(this);
    let new_aggregates = this._get_view_aggregates();
    for (let aggregate of aggregates) {
        let updated_agg = new_aggregates.find(x => x.column === aggregate.column);
        if (updated_agg) {
            aggregate.op = updated_agg.op;
        }
    }
    set_aggregate_attribute.call(this, aggregates);
    this._update_column_view();
    this._update();
}


function column_filter_clicked() {
    let filters = JSON.parse(this.getAttribute('filters'));
    let new_filters = this._get_view_filters();
    for (let filter of filters) {
        let updated_filter = new_filters.find(x => x[0] === filter[0]);
        if (updated_filter) {
            filter[1] = updated_filter[1];
            filter[2] = updated_filter[2];
        }
    }
    this._updating_filter = true;
    this.setAttribute('filters', JSON.stringify(filters));
    this._updating_filter = false;
    this._update();
}

/******************************************************************************
 *
 * Perspective Loading
 *
 */

let __WORKER__;

function get_worker() {
    if (__WORKER__ === undefined) {
        __WORKER__ = perspective.worker();
    } 
    return __WORKER__;
} 

if (document.currentScript && document.currentScript.hasAttribute('preload')) {
    get_worker();
}

function load(csv) {
    try {
        csv = csv.trim();
    } catch (e) {}
    let options = {};
    if (this.getAttribute('index')) {
        options.index = this.getAttribute('index');
    }
    let table;
    if (csv.hasOwnProperty("_name")) {
        table = csv;
    } else {
        table = get_worker().table(csv, options);
    }
    loadTable.call(this, table);
    for (let slave of this.slaves) {
        loadTable.call(slave, table);
    }
    this.slaves = [];
}

function get_aggregate_attribute() {
    const aggs = JSON.parse(this.getAttribute('aggregates')) || {};
    return Object.keys(aggs).map(col => ({column: col, op: aggs[col]}));
}

function set_aggregate_attribute(aggs) {
    this.setAttribute('aggregates', JSON.stringify(aggs.reduce((obj, agg) => {
        obj[agg.column] = agg.op;
        return obj;
    }, {})));
}

async function loadTable(table) {
    this.querySelector('#app').classList.add('hide_message');
    this.setAttribute('updating', true);
    
    this._clear_state();

    this._table = table;

    let [cols, schema] = await Promise.all([
        table.columns(),
        table.schema()
    ]);

    this._inactive_columns.innerHTML = "";
    this._active_columns.innerHTML = "";

    this._initial_col_order = cols.slice();
    if (!this.hasAttribute('columns')) {
        this.setAttribute('columns', JSON.stringify(this._initial_col_order));
    }

    let type_order = {integer: 2, string: 0, float: 3, boolean: 4, date: 1};

    // Sort columns by type and then name
    cols.sort((a, b) => {
        let s1 = type_order[schema[a]], s2 = type_order[schema[b]];
        let r = 0;
        if (s1 == s2) {
            let a1 = a.toLowerCase(), b1=b.toLowerCase();
            r = (a1 < b1)?-1:1;
        } else {
            r = (s1 < s2)?-1:1;
        }
        return r;
    });

    // Update Aggregates.
    let aggregates = [];
    const found = {};

    if (this.hasAttribute('aggregates')) {

        // Double check that the persisted aggregates actually match the 
        // expected types.
        aggregates = get_aggregate_attribute.call(this).map(col => {
            let _type = schema[col.column];
            found[col.column] = true;
            if (_type) {
                if (col.op === "" || perspective.TYPE_AGGREGATES[_type].indexOf(col.op) === -1) {
                    col.op = perspective.AGGREGATE_DEFAULTS[_type]
                }
                return col;
            } else {
                console.warn(`No column "${col.column}" found (specified in aggregates attribute).`);
            }
        }).filter(x => x);
    }

    // Add columns detected from dataset.
    for (let col of cols) {
        if (!found[col]) {
            aggregates.push({
                column: col,
                op: perspective.AGGREGATE_DEFAULTS[schema[col]]
            });
        }
    }

    set_aggregate_attribute.call(this, aggregates);

    // Update column rows.
    let shown = JSON.parse(this.getAttribute('columns') || "[]").filter(x => cols.indexOf(x) > -1);

    if (!this.hasAttribute('columns') || shown.length === 0) {
        for (let x of cols) {
            let aggregate = aggregates
                .filter(a => a.column === x)
                .map(a => a.op)[0];
            let row = new_row.call(this, x, schema[x], aggregate);
            this._inactive_columns.appendChild(row);
        }
        this._set_column_defaults()
        shown = JSON.parse(this.getAttribute('columns') || "[]").filter(x => cols.indexOf(x) > -1);
        for (let x in cols) {
            if (shown.indexOf(x) !== -1) {
                this._inactive_columns.children[x].classList.add('active');
            }
        }
    } else {
        for (let x of cols) {
            let aggregate = aggregates
                .filter(a => a.column === x)
                .map(a => a.op)[0];
            let row = new_row.call(this, x, schema[x], aggregate);
            this._inactive_columns.appendChild(row);
            if (shown.indexOf(x) !== -1) {
                row.classList.add('active');
            }
        }

        for (let x of shown) {
            let active_row = new_row.call(this, x, schema[x]);
            this._active_columns.appendChild(active_row);
        }
    }

    if (cols.length === shown.length) {
        this._inactive_columns.style.display = 'none';
    } else {
        this._inactive_columns.style.display = 'block';
    }

    this.filters = this.getAttribute('filters');

    this._update();
}

function new_row(name, type, aggregate, filter) {
    let row = document.createElement('perspective-row');

    if (!type) {
        let all = Array.prototype.slice.call(this.querySelectorAll('#inactive_columns perspective-row'));
        if (all.length > 0) {
            type = all.find(x => x.getAttribute('name') === name)
            if (type) {
                type = type.getAttribute('type');
            } else {
                type = "integer";
            }
        } else {
            type = '';
        }
    }

    if (!aggregate) {
        let aggregates = get_aggregate_attribute.call(this);
        if (aggregates) {
            aggregate = aggregates.find(x => x.column === name);
            if (aggregate) {
                aggregate = aggregate.op;
            } else {
                aggregate = perspective.AGGREGATE_DEFAULTS[type];
            }
        } else {
            aggregate = perspective.AGGREGATE_DEFAULTS[type];
        }
    }

    if (filter) {
        row.setAttribute('filter', filter);
        if (type === 'string') {
            const v = this._table.view({row_pivot:[name], aggregate: []});
            v.to_json().then(json => {
                row.choices(json.slice(1, json.length).map(x => x.__ROW_PATH__));
                v.delete();
            })
        }
    }

    row.setAttribute('type', type);
    row.setAttribute('name', name);
    row.setAttribute('aggregate', aggregate);

    row.addEventListener('visibility-clicked', column_visibility_clicked.bind(this));
    row.addEventListener('aggregate-selected', column_aggregate_clicked.bind(this));
    row.addEventListener('filter-selected', column_filter_clicked.bind(this));
    row.addEventListener('close-clicked', event => undrag.bind(this)(event.detail));
    row.addEventListener('row-drag', () => {
        this.classList.add('dragging');
        this._original_index = Array.prototype.slice.call(this._active_columns.children).findIndex(x => x.getAttribute('name') === name);
        if (this._original_index !== -1) {
            this._drop_target_hover = this._active_columns.children[this._original_index];
            setTimeout(() => row.setAttribute('drop-target', true));
        } else {
            this._drop_target_hover = new_row.call(this, name, type, aggregate);
        }
    });
    row.addEventListener('row-dragend', () => this.classList.remove('dragging'));
    return row;
}

class CancelTask {

    constructor(on_cancel) {
        this._on_cancel = on_cancel;
        this._cancelled = false;
    }

    cancel() {
        if (!this._cancelled && this._on_cancel) {
            this._on_cancel();
        }
        this._cancelled = true;
    }

    get cancelled() {
        return this._cancelled;
    }

}


function update() {
    if (!this._table) return;
    let row_pivots = this._view_columns('#row_pivots perspective-row');
    let column_pivots = this._view_columns('#column_pivots perspective-row');
    let filters = this._get_view_filters();
    let aggregates = this._get_view_aggregates();
    if (aggregates.length === 0) return;
    let hidden = [];
    let sort = this._view_columns("#sort perspective-row");
    for (let s of sort) {
        if (aggregates.map(function(agg) { return agg.column }).indexOf(s) === -1) {
            let all = this._get_view_aggregates('#inactive_columns perspective-row');
            aggregates.push(all.reduce((obj, y) => y.column === s ? y : obj));
            hidden.push(s);
        }
    }

    if (this._view) {
        this._view.delete();
        this._view = undefined;
    }
    this._view = this._table.view({
        filter:  filters,
        row_pivot: row_pivots,
        column_pivot: column_pivots,
        aggregate: aggregates,
        sort: sort
    });
    this._view.on_update(() => {
        if (!this._debounced) {
            let view_count = document.getElementsByTagName('perspective-viewer').length;
            let timeout = this.getAttribute('render_time') * view_count * 2;
            timeout = Math.min(10000, Math.max(0, timeout));
            this._debounced = setTimeout(() => {
                this._debounced = undefined;
                const t = performance.now();
                if (this._task) {
                    this._task.cancel();
                }
                this._task = new CancelTask();
                (task => {
                    this._plugin.create.call(this, this._datavis, this._view, hidden, task).then(() => {
                        this.setAttribute('render_time', performance.now() - t);
                        task.cancel();
                    }).catch(err => {
                        console.error("Error rendering plugin.", err);
                    });
                })(this._task);
            }, timeout || 0);
        }
    });

    const t = performance.now();
    this._render_count = (this._render_count || 0) + 1;
    if (this._task) {
        this._task.cancel();
    }
    this._task = new CancelTask(() => {
        this._render_count--;
    });

    (task => {
        this._plugin.create.call(this, this._datavis, this._view, hidden, task).catch(err => {
            console.debug("View cancelled");
        }).finally(() => {
            if (!this.hasAttribute('render_time')) {
                this.dispatchEvent(new Event('loaded', {bubbles: true}));
            }
            this.setAttribute('render_time', performance.now() - t);
            task.cancel();
            if (this._render_count === 0) {
                this.removeAttribute('updating');
            }
        });
    })(this._task);
}

/******************************************************************************
 *
 * <perspective-viewer> Component
 *
 */
bindTemplate(template)(class View extends HTMLElement {

    notifyResize() {
        if (!document.hidden && this.offsetParent && document.contains(this)) {
            this._plugin.resize.call(this);
        }
    }

    get worker() {
        return get_worker();
    }

    get _plugin() {
        let view = this.getAttribute('view');
        if (!view) {
            view = Object.keys(RENDERERS)[0];
        }
        this.setAttribute('view', view);
        return RENDERERS[view] || RENDERERS[Object.keys(RENDERERS)[0]];
    }

    _toggle_config() {
        if (this._show_config) {
            this._side_panel.style.display = 'none';
            this._top_panel.style.display = 'none';
            this.removeAttribute('settings');
        } else {
            this._side_panel.style.display = 'flex';
            this._top_panel.style.display = 'flex';
            this.setAttribute('settings', true);
        }
        this._show_config = !this._show_config;
        this._plugin.resize.call(this, true);
    }

    set message(msg) {
        if (this.getAttribute('message') !== msg) {
            this.setAttribute('message', msg);
            return;
        }
        if (!this._inner_drop_target) return;
        this.querySelector('#app').classList.remove('hide_message');
        this._inner_drop_target.innerHTML = msg;
        for (let slave of this.slaves) {
            slave.setAttribute('message', msg);
        }
    }

    load(json) {
        load.bind(this)(json);
    }

    update(json) {
        if (this._table === undefined) {
            this.load(json);
        } else {
            this._table.update(json);
        }
    }

    _get_view_filters(selector) {
            return this._view_columns('#filters perspective-row', false, true);
    }

    _get_view_aggregates(selector) {
        return this._view_columns(selector, true);
    }

    _view_columns(selector, types, filters) {
        selector = selector || '#active_columns perspective-row';
        let selection = this.querySelectorAll(selector);
        let sorted = Array.prototype.slice.call(selection);
        return sorted.map(s => {
            let name = s.getAttribute('name');
            if (types) {
                let agg = s.getAttribute('aggregate');
                return {op: agg, column: name};
            } else if (filters) {
                let {operator, operand} = JSON.parse(s.getAttribute('filter'));
                return [name, operator, operand];
            } else {
                return name;
            }
        });
    }

    _visible_column_count() {
        let cols = Array.prototype.slice.call(this.querySelectorAll("#active_columns perspective-row"));
        return cols.length;
    }
  
    _update_column_view(columns, reset = false) {
        if (!columns) {
            columns = this._view_columns('#active_columns perspective-row');
        }
        this.setAttribute('columns', JSON.stringify(columns));
        let idx = 1;
        const lis = Array.prototype.slice.call(this.querySelectorAll("#inactive_columns perspective-row"));
        if (columns.length === lis.length) {
            this._inactive_columns.style.display = 'none';
        } else {
            this._inactive_columns.style.display = 'block';
        }
        lis.forEach(x => {
            const index = columns.indexOf(x.getAttribute('name'));
            if (index === -1) {
                x.classList.remove('active');
            } else {
                x.classList.add('active');
            }
        });
        if (reset) {
            this._active_columns.innerHTML = "";
            columns.map(y => {
                let ref = lis.find(x => x.getAttribute('name') === y);
                if (ref) {
                    this._active_columns.appendChild(new_row.call(
                        this, 
                        ref.getAttribute('name'), 
                        ref.getAttribute('type')
                    ));
                }
            });
        }
    }

    /**
     * The set of visibile columns.
     *
     * @param {array} columns An array of strings, the names of visible columns
     */
    set columns(c) {
        let show = JSON.parse(this.getAttribute('columns'));
        this._update_column_view(show, true);
        this.dispatchEvent(new Event('config-update'));
        this._update();
    }

    /**
     * The set of column aggregate configurations.
     *
     * @param {array} aggregates An arry of aggregate config objects, which
     *     specify what aggregate settings to use when the associated column
     *     is visible, and at least one `row-pivot` is defined.  An aggregate
     *     config object has two properties:
     *         `name`: The column name.
     *         `op`: The aggregate type as a string.  See {@link perspective/src/js/defaults.js}
     */
    set aggregates(a) {
        let show = JSON.parse(this.getAttribute('aggregates'));
        let lis = Array.prototype.slice.call(this.querySelectorAll("#active_columns perspective-row"));
        lis.map((x, ix) => {
            let agg = show[x.getAttribute('name')];
            if (agg) {
                x.setAttribute('aggregate', agg);
            }
        });
        this.dispatchEvent(new Event('config-update'));
        this._update();
    }

    /**
     * The set of column filter configurations.
     *
     * @param {array} filters An arry of filter config objects.  A filter
     *     config object is an array of three elements:
     *         * The column name.
     *         * The filter operation as a string.  See {@link perspective/src/js/defaults.js}
     *         * THe filter argument, as a string, float or Array<string> as the filter operation demands.
     */
    set filters(f) {
        if (!this._updating_filter) {
            let filters = JSON.parse(this.getAttribute('filters'));
            this._filters.innerHTML = "";
            if (filters.length === 0) {
                let label = document.createElement('label');
                label.innerHTML = this._filters.getAttribute('name');
                this._filters.appendChild(label);
            } else {
                filters.map(function(pivot) {
                    let row = new_row.call(this, pivot[0], undefined, undefined, JSON.stringify({operator: pivot[1], operand: pivot[2]}));
                    this._filters.appendChild(row);
                }.bind(this));
            }
        }
        this.dispatchEvent(new Event('config-update'));
        this._update();
    }

    _set_column_defaults() {
        let cols = Array.prototype.slice.call(this.querySelectorAll("#inactive_columns perspective-row"));
        if (cols.length > 0) {
            if (this._plugin.initial) {
                let pref = [];
                let count = this._plugin.initial.count || 2;
                if (this._plugin.initial.type === 'number') {
                    for (let col of cols) {
                        let type = col.getAttribute('type');
                        if (['float', 'integer'].indexOf(type) > -1) {
                            pref.push(col.getAttribute('name'));
                        }
                    }
                    if (pref.length < count) {
                        for (let col of cols) {
                            if (pref.indexOf(col.getAttribute('name')) === -1) {
                                pref.push(col.getAttribute('name'));
                            }
                        }                            
                    }
                }
                this.setAttribute('columns', JSON.stringify(pref.slice(0, count)));
            } else if (this._plugin.selectMode === 'select') {
                this.setAttribute('columns', JSON.stringify([cols[0].getAttribute('name')]));
            }
        }
    }

    set view(v) {
        this._vis_selector.value = this.getAttribute('view');
        this._set_column_defaults();
        this.dispatchEvent(new Event('config-update'));
    }

    set ['column-pivots'](c) {
        let pivots = JSON.parse(this.getAttribute('column-pivots'));
        this._column_pivots.innerHTML = "";
        if (pivots.length === 0) {
            let label = document.createElement('label');
            label.innerHTML = this._column_pivots.getAttribute('name');
            this._column_pivots.appendChild(label);
        } else {
            pivots.map(function(pivot) {
                let row = new_row.call(this, pivot);
                this._column_pivots.appendChild(row);
            }.bind(this));
        }
        this.dispatchEvent(new Event('config-update'));
        this._update();
    }

    set ['index'](i) {
        if (this._table) {
            console.error(`Setting 'index' attribute after initialization has no effect`);
        }
    }

    set ['row-pivots'](r) {
        let pivots = JSON.parse(this.getAttribute('row-pivots'));
        this._row_pivots.innerHTML = "";
        if (pivots.length === 0) {
            let label = document.createElement('label');
            label.innerHTML = this._row_pivots.getAttribute('name');
            this._row_pivots.appendChild(label);
        } else {
            pivots.map(function(pivot) {
                let row = new_row.call(this, pivot);
                this._row_pivots.appendChild(row);
            }.bind(this));
        }
        this.dispatchEvent(new Event('config-update'));
        this._update();
    }

    copy(widget) {
        if (widget.hasAttribute('index')) {
            this.setAttribute('index', widget.getAttribute('index'));
        }
        if (this._inner_drop_target) {
            this._inner_drop_target.innerHTML = widget._inner_drop_target.innerHTML;
        }

        if (widget._table) {
            loadTable.call(this, widget._table);
        } else {
            widget.slaves.push(this);
        }
    }

    set sort(s) {
        let sort = JSON.parse(this.getAttribute('sort'));
        this._sort.innerHTML = "";
        if (sort.length === 0) {
            let label = document.createElement('label');
            label.innerHTML = this._sort.getAttribute('name');
            this._sort.appendChild(label);
        } else {
            sort.map(function(s) {
                let row = new_row.call(this, s);
                this._sort.appendChild(row);
            }.bind(this));
        }
        this.dispatchEvent(new Event('config-update'));
        this._update();
    }

    _clear_state() {
        if (this._task) {
            this._task.cancel();
        }
        let all = [];
        if (this._view) {
            let view = this._view;
            this._view = undefined;
            all.push(view.delete());
        };
        if (this._table) {
            let table = this._table;
            this._table = undefined;
            all.push(table.delete());
        }
        return Promise.all(all);
    }

    delete() {
        let x = this._clear_state();
        if (this._plugin.delete) {
            this._plugin.delete.call(this);
        }
        return x;
    }
    
    save() {
        let obj = {};
        for (let key = 0; key < this.attributes.length; key++) {
            let attr = this.attributes[key];
            if (['id'].indexOf(attr.name) === -1) {
                obj[attr.name] = attr.value;
            }
        }
        return obj;
    }

    restore(x) {
        for (let key in x) {
            this.setAttribute(key, x[key]);
        }
    }

    reset() {
        this.setAttribute('row-pivots', JSON.stringify([]));
        this.setAttribute('column-pivots', JSON.stringify([]));
        this.setAttribute('filters', JSON.stringify([]));
        this.setAttribute('sort', JSON.stringify([]));
        this.removeAttribute('index');
        if (this._initial_col_order) {
            this.setAttribute('columns', JSON.stringify(this._initial_col_order || []));
        } else {
            this.removeAttribute('columns');
        }
        this.setAttribute('view', Object.keys(RENDERERS)[0]);
        this.dispatchEvent(new Event('config-update'));
    }

    connectedCallback() {
        let _update = _.debounce(update.bind(this), 10);
        this._update = () => {
            this.setAttribute('updating', true);
            _update();
        }

        this.slaves = [];
        this._aggregate_selector = this.querySelector('#aggregate_selector');
        this._vis_selector = this.querySelector('#vis_selector');
        this._filters = this.querySelector('#filters');
        this._row_pivots = this.querySelector('#row_pivots');
        this._column_pivots = this.querySelector('#column_pivots');
        this._datavis = this.querySelector('#pivot_chart');
        this._active_columns = this.querySelector('#active_columns');
        this._inactive_columns = this.querySelector('#inactive_columns');
        this._inner_drop_target = this.querySelector('#drop_target_inner');
        this._drop_target = this.querySelector('#drop_target');
        this._config_button = this.querySelector('#config_button');
        this._side_panel = this.querySelector('#side_panel');
        this._top_panel = this.querySelector('#top_panel');
        this._sort = this.querySelector('#sort');

        this._sort.addEventListener('drop', drop.bind(this));
        this._sort.addEventListener('dragend', undrag.bind(this));

        this._row_pivots.addEventListener('drop', drop.bind(this));
        this._row_pivots.addEventListener('dragend', undrag.bind(this));

        this._column_pivots.addEventListener('drop', drop.bind(this));
        this._column_pivots.addEventListener('dragend', undrag.bind(this));

        this._filters.addEventListener('drop', drop.bind(this));
        this._filters.addEventListener('dragend', undrag.bind(this));

        this._active_columns.addEventListener('drop', column_drop.bind(this));
        this._active_columns.addEventListener('dragend', column_undrag.bind(this));
        this._active_columns.addEventListener('dragover', column_dragover.bind(this));
        this._active_columns.addEventListener('dragleave', column_dragleave.bind(this));

        this.setAttribute('settings', true);
        this._show_config = true;
        this._config_button.addEventListener('mousedown', this._toggle_config.bind(this));

        if (!this.hasAttribute('row-pivots')) {
            this.setAttribute('row-pivots', "[]");
        }

        if (!this.hasAttribute('column-pivots')) {
            this.setAttribute('column-pivots', "[]");
        }

        if (!this.hasAttribute('filters')) {
            this.setAttribute('filters', "[]");
        }

        this._vis_selector.addEventListener('change', event => {
            this.setAttribute('view', this._vis_selector.value);
            this._update();
        });

        this.addEventListener('close', () => {
            console.info("Closing");
        });

        if (Object.keys(RENDERERS).length === 0) {
            RENDERERS['debug'] = {
                name: "Debug", 
                create: async div => { 
                    let json = await this._view.to_json();
                    var t = performance.now();
                    let csv = "";
                    if (json.length > 0) {
                        let columns = Object.keys(json[0]);
                        csv += columns.join('|') + '\n';
                        for (let row of json) {
                            csv += Object.values(row).join('|') + "\n";                                    
                        }
                    }
                    div.innerHTML = `<pre style="margin:0;overflow:scroll;position:absolute;width:100%;height:100%">${csv}</pre>`
                    this.setAttribute('render_time', performance.now() - t);
                },
                selectMode: "toggle",
                resize: function () {
                    
                },
                delete: function () {
                }
            };
        }

        for (let name in RENDERERS) {
            let display_name = RENDERERS[name].name || name;
            this._vis_selector.innerHTML += `<option value="${name}">${display_name}</option>`;
        }

        this._modified = false;

        if (this.getAttribute('data')) {
            let data = this.getAttribute('data');
            try {
                data = JSON.parse(data);
            } catch (e) {

            }
            load.bind(this)(data)
            this._modified = true;
        }
        this._toggle_config();
    }

});
