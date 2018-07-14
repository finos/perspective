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
import {bindTemplate, json_attribute, array_attribute, copy_to_clipboard} from "./utils.js";

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
 * @param {string} name The logical unique name of the plugin.  This will be 
 * used to set the component's `view` attribute.
 * @param {object} plugin An object with this plugin's prototype.  Valid keys are:
 *     name : The display name for this plugin.
 *     create (required) : The creation function - may return a `Promise`.
 *     delete : The deletion function.
 *     mode : The selection mode - may be "toggle" or "select".  
 */
global.registerPlugin = function registerPlugin(name, plugin) {
    RENDERERS[name] = plugin;
}

function _register_debug_plugin() {
    global.registerPlugin('debug', {
        name: "Debug", 
        create: async function(div) { 
            const json = await this._view.to_json();
            const timer = this._render_time();
            let csv = "";
            if (json.length > 0) {
                let columns = Object.keys(json[0]);
                csv += columns.join('|') + '\n';
                for (let row of json) {
                    csv += Object.values(row).join('|') + "\n";                                    
                }
            }
            div.innerHTML = `<pre style="margin:0;overflow:scroll;position:absolute;width:100%;height:100%">${csv}</pre>`;
            timer();
        },
        selectMode: "toggle",
        resize: function () {
            
        },
        delete: function () {
        }
    });
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
    let attr_name = parent.getAttribute('for');
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
    let name = ev.currentTarget.querySelector('ul').getAttribute('for') || ev.currentTarget.getAttribute('id').replace('_', '-');
    let columns = JSON.parse(this.getAttribute(name) || "[]");
    let data_index = columns.indexOf(data[0]);
    if (data_index !== -1) {
        columns.splice(data_index, 1);
    }
    if (name.indexOf('filter') > -1) {
        this.setAttribute(name, JSON.stringify(columns.concat([data])));
    } else if (name.indexOf('sort') > -1) {
        this.setAttribute(name, JSON.stringify(columns.concat([[data[0], "asc"]])));
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

    this._debounce_update();
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
    this._debounce_update();
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
    this._debounce_update();
}

function sort_order_clicked() {
    let sort = JSON.parse(this.getAttribute('sort'));
    let new_sort = this._get_view_sorts();
    for (let s of sort) {
        let updated_sort = new_sort.find(x => x[0] === s[0]);
        if (updated_sort) {
            s[1] = updated_sort[1];
        }
    }
    this.setAttribute('sort', JSON.stringify(sort));
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

    this._debounce_update();
}

function new_row(name, type, aggregate, filter, sort) {
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

    if (sort) {
        row.setAttribute('sort-order', sort);
    } else {
        row.setAttribute('sort-order', "asc");
    }

    row.setAttribute('type', type);
    row.setAttribute('name', name);
    row.setAttribute('aggregate', aggregate);

    row.addEventListener('visibility-clicked', column_visibility_clicked.bind(this));
    row.addEventListener('aggregate-selected', column_aggregate_clicked.bind(this));
    row.addEventListener('filter-selected', column_filter_clicked.bind(this));
    row.addEventListener('close-clicked', event => undrag.call(this, event.detail));
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
    row.addEventListener('sort-order', sort_order_clicked.bind(this));
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
    let sort = this._get_view_sorts("#sort perspective-row");
    let hidden = this._get_view_hidden(aggregates, sort);
    for (let s of hidden) {
        let all = this._get_view_aggregates('#inactive_columns perspective-row');
        aggregates.push(all.reduce((obj, y) => y.column === s ? y : obj));
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
                const timer = this._render_time();
                if (this._task && !this._task.initial) {
                    this._task.cancel();
                } 
                const task = this._task = new CancelTask();
                let updater = this._plugin.update;
                if (!updater) {
                    updater = this._plugin.create;
                }
                updater.call(this, this._datavis, this._view, task).then(() => {
                    timer();
                    task.cancel();
                }).catch(err => {
                    console.error("Error rendering plugin.", err);
                }).finally(() => this.dispatchEvent(new Event('perspective-view-update')));
            }, timeout || 0);
        }
    });

    const timer = this._render_time();
    this._render_count = (this._render_count || 0) + 1;
    if (this._task) {
        this._task.cancel();
    }
    const task = this._task = new CancelTask(() => {
        this._render_count--;
    });
    task.initial = true;

    this._plugin.create.call(this, this._datavis, this._view, task).catch(err => {
        console.warn(err);
    }).finally(() => {
        if (!this.hasAttribute('render_time')) {
            this.dispatchEvent(new Event('perspective-view-update'));
        }
        timer();
        task.cancel();
        if (this._render_count === 0) {
            this.removeAttribute('updating');
        }
    });
}

/******************************************************************************
 *
 * <perspective-viewer> Component
 *
 */

function _fill_numeric(cols, pref, bypass = false) {
    for (let col of cols) {
        let type = col.getAttribute('type');
        let name = col.getAttribute('name');
        if (bypass || ['float', 'integer'].indexOf(type) > -1 && pref.indexOf(name) === -1) {
            pref.push(name);
        }
    }      
}

class ViewPrivate extends HTMLElement {

    _render_time() {
        const t = performance.now();
        return () => this.setAttribute('render_time', performance.now() - t);
    }

    get _plugin() {
        let view = this.getAttribute('view');
        if (!view) {
            view = Object.keys(RENDERERS)[0];
        }
        this.setAttribute('view', view);
        return RENDERERS[view] || RENDERERS[Object.keys(RENDERERS)[0]];
    }

    _set_column_defaults() {
        let cols = Array.prototype.slice.call(this.querySelectorAll("#inactive_columns perspective-row"));
        let current_cols = Array.prototype.slice.call(this.querySelectorAll("#active_columns perspective-row"));
        if (cols.length > 0) {
            if (this._plugin.initial) {
                let pref = [];
                let count = this._plugin.initial.count || 2;
                if (current_cols.length === count) {
                    pref = current_cols.map(x => x.getAttribute('name'));
                } else if (current_cols.length < count) {
                    pref = current_cols.map(x => x.getAttribute('name'));
                    _fill_numeric(cols, pref);                          
                    if (pref.length < count) {
                        _fill_numeric(cols, pref, true);                            
                    }
                } else {
                    if (this._plugin.initial.type === 'number') {
                        _fill_numeric(current_cols, pref);
                        if (pref.length < count) {
                            _fill_numeric(cols, pref);                          
                        }
                        if (pref.length < count) {
                            _fill_numeric(cols, pref, true);                            
                        }
                    }
                }
                this.setAttribute('columns', JSON.stringify(pref.slice(0, count)));
            } else if (this._plugin.selectMode === 'select') {
                this.setAttribute('columns', JSON.stringify([cols[0].getAttribute('name')]));
            }
        }
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

    _get_view_filters() {
        return this._view_columns('#filters perspective-row', false, true);
    }

    _get_view_aggregates(selector) {
        return this._view_columns(selector, true);
    }

    _get_view_sorts() {
        return this._view_columns('#sort perspective-row', false, false, true);
    }

    _get_view_hidden(aggregates, sort) {
        aggregates = aggregates || this._get_view_aggregates();
        let hidden = [];
        sort = sort || this._get_view_sorts("#sort perspective-row");
        for (let s of sort) {
            if (aggregates.map(agg => agg.column).indexOf(s[0]) === -1) {
                hidden.push(s[0]);
            }
        }
        return hidden;
    }

    _view_columns(selector, types, filters, sort) {
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
            } else if (sort) {
                let order = s.getAttribute('sort-order') || "asc";
                return [name, order];
            } else {
                return name;
            }
        });
    }

    _visible_column_count() {
        let cols = Array.prototype.slice.call(this.querySelectorAll("#active_columns perspective-row"));
        return cols.length;
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

    _update_column_view(columns, reset = false) {
        if (!columns) {
            columns = this._view_columns('#active_columns perspective-row');
        }
        this.setAttribute('columns', JSON.stringify(columns));
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

    _register_ids() {
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
    }

    _register_callbacks() {
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
        this._config_button.addEventListener('mousedown', this._toggle_config.bind(this));
        
        this._vis_selector.addEventListener('change', () => {
            this.setAttribute('view', this._vis_selector.value);
            this._debounce_update();
        });
    }

    _register_view_options() {        
        for (let name in RENDERERS) {
            const display_name = RENDERERS[name].name || name;
            const opt = `<option value="${name}">${display_name}</option>`;
            this._vis_selector.innerHTML += opt;
        }
    }

    _register_data_attribute() {
        // TODO this feature needs to become a real attribute.
        if (this.getAttribute('data')) {
            let data = this.getAttribute('data');
            try {
                data = JSON.parse(data);
            } catch (e) {

            }
            this.load(data)
        }
    }

    _register_debounce_instance() {
        const _update = _.debounce(update.bind(this), 10);
        this._debounce_update = () => {
            this.setAttribute('updating', true);
            _update();
        }
    }
 }

/**
 * HTMLElement class for `<perspective-viewer` custom element.
 * 
 * @class View
 * @extends {ViewPrivate}
 */
@bindTemplate(template)
class View extends ViewPrivate {

    constructor() {
        super();
        this._register_debounce_instance();
        this._slaves = [];
        this._show_config = true;
    }

    connectedCallback() {
        if (Object.keys(RENDERERS).length === 0) {
            _register_debug_plugin();
        }

        this.setAttribute('settings', true);

        this._register_ids();
        this._register_callbacks();
        this._register_view_options();
        this._register_data_attribute();
        this._toggle_config();

        for (let attr of ['row-pivots', 'column-pivots', 'filters', 'sort']) {
            if (!this.hasAttribute(attr)) {
                this.setAttribute(attr, "[]");
            }
        }
    }
   
    /**
     * Sets this `perspective.table.view`'s `sort` property, an array of column
     * names.
     * 
     * @name sort
     * @memberof View.prototype
     * @type {array<string>} Array of column names
     * @fires View#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('sort', JSON.stringify(["x"]));
     * @example <caption>via HTML</caption>
     * <perspective-viewer sort='["x"]'></perspective-viewer>
     */
    @array_attribute
    set sort(sort) {
        var inner = this._sort.querySelector( 'ul');
        inner.innerHTML = "";
        if (sort.length > 0) {
            sort.map(function(s) {
                let dir = "asc";
                if (Array.isArray(s)) {
                    dir = s[1];
                    s = s[0];
                }
                let row = new_row.call(this, s, false, false, false, dir);
                inner.appendChild(row);
            }.bind(this));
        }
        this.dispatchEvent(new Event('perspective-config-update'));
        this._debounce_update();
    }
    
    /**
     * The set of visible columns.
     *
     * @name columns
     * @memberof View.prototype
     * @param {array} columns An array of strings, the names of visible columns.
     * @fires View#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('columns', JSON.stringify(["x", "y'"]));
     * @example <caption>via HTML</caption>
     * <perspective-viewer columns='["x", "y"]'></perspective-viewer>
     */
    @array_attribute
    set columns(show) {
        this._update_column_view(show, true);
        this.dispatchEvent(new Event('perspective-config-update'));
        this._debounce_update();
    }

    /**
     * The set of column aggregate configurations.
     *
     * @name aggregates
     * @memberof View.prototype
     * @param {object} aggregates A dictionary whose keys are column names, and
     * values are valid aggregations.  The `aggergates` attribute works as an
     * override;  in lieu of a key for a column supplied by the developers, a
     * default will be selected and reflected to the attribute based on the
     * column's type.  See {@link perspective/src/js/defaults.js}
     * @fires View#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('aggregates', JSON.stringify({x: "distinct count"}));
     * @example <caption>via HTML</caption>
     * <perspective-viewer aggregates='{"x": "distinct count"}'></perspective-viewer>
     */
    @json_attribute
    set aggregates(show) {
        let lis = Array.prototype.slice.call(this.querySelectorAll("#active_columns perspective-row"));
        lis.map(x => {
            let agg = show[x.getAttribute('name')];
            if (agg) {
                x.setAttribute('aggregate', agg);
            }
        });
        this.dispatchEvent(new Event('perspective-config-update'));
        this._debounce_update();
    }

    /**
     * The set of column filter configurations.
     * 
     * @name filters
     * @memberof View.prototype
     * @type {array} filters An arry of filter config objects.  A filter
     * config object is an array of three elements:
     *     * The column name.
     *     * The filter operation as a string.  See 
     *       {@link perspective/src/js/defaults.js}
     *     * The filter argument, as a string, float or Array<string> as the 
     *       filter operation demands.
     * @fires View#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let filters = [
     *     ["x", "<", 3], 
     *     ["y", "contains", "abc"]
     * ];
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('filters', JSON.stringify(filters));
     * @example <caption>via HTML</caption>
     * <perspective-viewer filters='[["x", "<", 3], ["y", "contains", "abc"]]'></perspective-viewer>
     */
    @array_attribute
    set filters(filters) {
        if (!this._updating_filter) {
            var inner = this._filters.querySelector('ul'); 
            inner.innerHTML = "";
            if (filters.length > 0) {
                filters.map(pivot => {
                    const fterms = JSON.stringify({
                        operator: pivot[1], 
                        operand: pivot[2]
                    });
                    const row = new_row.call(
                        this, 
                        pivot[0], 
                        undefined, 
                        undefined, 
                        fterms
                    );
                    inner.appendChild(row);
                });
            }
        }
        this.dispatchEvent(new Event('perspective-config-update'));
        this._debounce_update();
    }

    /**
     * Sets the currently selected plugin, via its `name` field.
     * 
     * @type {string}
     * @fires View#perspective-config-update
     */
    set view(v) {
        this._vis_selector.value = this.getAttribute('view');
        this._set_column_defaults();
        this.dispatchEvent(new Event('perspective-config-update'));
    }

    /**
     * Sets this `perspective.table.view`'s `column_pivots` property.
     * 
     * @name column-pivots
     * @memberof View.prototype
     * @type {array<string>} Array of column names
     * @fires View#perspective-config-update
     */
    @array_attribute
    set 'column-pivots'(pivots) {
        var inner = this._column_pivots.querySelector('ul'); 
        inner.innerHTML = "";
        if (pivots.length > 0) {
            pivots.map(function(pivot) {
                let row = new_row.call(this, pivot);
                inner.appendChild(row);
            }.bind(this));
        }
        this.dispatchEvent(new Event('perspective-config-update'));
        this._debounce_update();
    }

    /**
     * The column name to index by.  Due to the mutable nature of 
     * `perspective.table`, `index` cannot be modified once `load` or `update`
     * has been called.
     * 
     * @type {string}
     */
    set index(index) {
        if (this._table) {
            console.error(`Setting 'index' attribute after initialization has no effect`);
        }
    }

    /**
     * Sets this `perspective.table.view`'s `row_pivots` property.
     * 
     * @name row-pivots
     * @memberof View.prototype
     * @type {array<string>} Array of column names
     * @fires View#perspective-config-update
     */
    @array_attribute
    set 'row-pivots'(pivots) {
        var inner = this._row_pivots.querySelector('ul'); 
        inner.innerHTML = "";
        if (pivots.length > 0) {
            pivots.map(function(pivot) {
                let row = new_row.call(this, pivot);
                inner.appendChild(row);
            }.bind(this));
        }
        this.dispatchEvent(new Event('perspective-config-update'));
        this._debounce_update();
    }

    /**
     * When set, hide the data visualization and display the message.  Setting
     * `message` does not clear the internal `perspective.table`, but it does
     * render it hidden until the message is removed.
     * 
     * @param {string} msg The message. This can be HTML - it is not sanitized.
     * @example
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('message', '<h1>Loading</h1>');
     */
    set message(msg) {
        if (this.getAttribute('message') !== msg) {
            this.setAttribute('message', msg);
            return;
        }
        if (!this._inner_drop_target) return;
        this.querySelector('#app').classList.remove('hide_message');
        this._inner_drop_target.innerHTML = msg;
        for (let slave of this._slaves) {
            slave.setAttribute('message', msg);
        }
    }
    
    /**
     * This element's `perspective` worker instance.  This property is not 
     * reflected as an HTML attribute, and is readonly;  it can be effectively 
     * set however by calliong the `load() method with a `perspective.table` 
     * instance from the preferred worker.
     * 
     * @readonly
     * @example
     * let elem = document.getElementById('my_viewer');
     * let table = elem.worker.table([{x:1, y:2}]);
     * elem.load(table);
     */
    get worker() {
        if (this._table) {
            return this._table.worker;
        }
        return get_worker();
    }

    /**
     * This element's `perpsective.table.view` instance.  The instance itself
     * will change after every `View#perspective-config-update` event. 
     *
     * @readonly
     */
    get view() {
        return this._view;
    }
    
    /**
     * Load data.  If `load` or `update` have already been called on this
     * element, its internal `perspective.table` will also be deleted.
     * 
     * @param {any} data The data to load.  Works with the same input types
     * supported by `perspective.table`.
     * @fires View#perspective-view-update
     * @example <caption>Load JSON</caption>
     * const my_viewer = document.getElementById('#my_viewer');
     * my_viewer.load([
     *     {x: 1, y: 'a'},
     *     {x: 2, y: 'b'}
     * ]);
     * @example <caption>Load CSV</caption>
     * const my_viewer = document.getElementById('#my_viewer');
     * my_viewer.load("x,y\n1,a\n2,b");
     * @example <caption>Load perspective.table</caption>
     * const my_viewer = document.getElementById('#my_viewer');
     * const tbl = perspective.table("x,y\n1,a\n2,b");
     * my_viewer.load(tbl);
     */
    load(data) {
        try {
            data = data.trim();
        } catch (e) {}
        let options = {};
        if (this.getAttribute('index')) {
            options.index = this.getAttribute('index');
        }
        let table;
        if (data.hasOwnProperty("_name")) {
            table = data;
        } else {
            table = get_worker().table(data, options);
        }
        loadTable.call(this, table);
        for (let slave of this._slaves) {
            loadTable.call(slave, table);
        }
        this._slaves = [];
    }

    /**
     * Updates this element's `perspective.table` with new data.
     * 
     * @param {any} data The data to load.  Works with the same input types
     * supported by `perspective.table.update`.
     * @fires View#perspective-view-update
     * @example
     * const my_viewer = document.getElementById('#my_viewer');
     * my_viewer.update([
     *     {x: 1, y: 'a'},
     *     {x: 2, y: 'b'}
     * ]);
     */
    update(data) {
        if (this._table === undefined) {
            this.load(data);
        } else {
            this._table.update(data);
        }
    }
      
    /**
     * Invalidate this element's dimensions and redraw.
     * 
     */
    notifyResize() {
        if (!document.hidden && this.offsetParent && document.contains(this)) {
            this._plugin.resize.call(this);
        }
    }

    /**
     * Duplicate an existing `<perspective-element>`, including data and view
     * settings.  The underlying `perspective.table` will be shared between both
     * elements
     * 
     * @param {any} widget A `<perspective-viewer>` instance to copy.
     */
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
            widget._slaves.push(this);
        }
    }

    /**
     * Deletes this element's data and clears it's internal state (but not its
     * user state).  This (or the underlying `perspective.table`'s equivalent
     * method) must be called in order for its memory to be reclaimed.
     * 
     * @returns {Promise<boolean>} Whether or not this call resulted in the 
     * underlying `perspective.table` actually being deleted.
     */
    delete() {
        let x = this._clear_state();
        if (this._plugin.delete) {
            this._plugin.delete.call(this);
        }
        return x;
    }
    
    /**
     * Serialize this element's attribute/interaction state.
     * 
     * @returns {object} a serialized element.
     */
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

    /**
     * Resotre this element to a state as generated by a reciprocal call to
     * `save`.
     * 
     * @param {object} x returned by `save`.
     */
    restore(x) {
        for (let key in x) {
            this.setAttribute(key, x[key]);
        }
    }

    /**
     * Reset's this element's view state and attributes to default.  Does not
     * delete this element's `perspective.table` or otherwise modify the data
     * state.
     * 
     */
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
        this.dispatchEvent(new Event('perspective-config-update'));
    }

    /**
     * Copies this element's view data (as a CSV) to the clipboard.  This method
     * must be called from an event handler, subject to the browser's 
     * restrictions on clipboard access.  See 
     * {@link https://www.w3.org/TR/clipboard-apis/#allow-read-clipboard}.
     * 
     */
    handleClipboardCopy(options) {
        let data
        if (!this._view) {
            console.warn("No view to copy - skipping");
            return;
        }
        this._view.to_csv(options).then(csv => {
            data = csv;
        }).catch(err => {
            console.error(err);
            data = "";
        });
        let count = 0, f = () => {
            if (typeof data !== "undefined") {
                copy_to_clipboard(data);
            } else if (count < 50) {
                count++;
                setTimeout(f, 50);
            }
        }
        f();
    }
    
}

/**
 * `perspective-config-update` is fired whenever an configuration attribute has
 * been modified, by the user or otherwise.
 *
 * @event View#perspective-config-update
 * @type {string}
 */

 /**
 * `perspective-view-update` is fired whenever underlying `view`'s data has
 * updated, including every invocation of `load` and `update`.
 *
 * @event View#perspective-view-update
 * @type {string}
 */
