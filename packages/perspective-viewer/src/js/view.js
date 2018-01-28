/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import _ from "underscore";
import {polyfill} from "mobile-drag-drop";

import perspective from "@jpmorganchase/perspective/src/js/perspective.parallel.js";
import {registerElement, importTemplate} from "@jpmorganchase/perspective-common";

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
    let div = event.target.parentElement.parentElement;
    let parent = div.parentElement;
    let idx = Array.prototype.slice.call(parent.children).indexOf(div);
    let attr_name = parent.getAttribute('id').replace('_', '-');
    let pivots = JSON.parse(this.getAttribute(attr_name));
    pivots.splice(idx, 1);
    this.setAttribute(attr_name, JSON.stringify(pivots));
    if (event.dataTransfer.dropEffect !== 'move') {
        this._update();
    }
}

function calc_index(event) {
    let height = this._active_columns.children[0].offsetHeight + 2;
    return Math.floor((event.offsetY + this._active_columns.scrollTop) / height);
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

    // Update the columns attribute
    let name = ev.currentTarget.getAttribute('id').replace('_', '-');
    let columns = JSON.parse(this.getAttribute(name) || "[]");
    let data_index = columns.indexOf(data);
    if (data_index !== -1) {
        columns.splice(data_index, 1);
    }
    this.setAttribute(name, JSON.stringify(columns.concat([data])));

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
    let aggregates = JSON.parse(this.getAttribute('aggregates'));
    let new_aggregates = this._get_view_aggregates();
    for (let aggregate of aggregates) {
        let updated_agg = new_aggregates.find(x => x.column === aggregate.column);
        if (updated_agg) {
            aggregate.op = updated_agg.op;
        }
    }
    this.setAttribute('aggregates', JSON.stringify(aggregates));
    this._update_column_view();
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
}

async function loadTable(table) {
    if (this._view) {
        this._view.delete();
    }
    if (this._table) {
        this._table.delete();
    }

    this._active_columns.innerHTML = "";
    this._table = table;
    
    let [cols, schema] = await Promise.all([table.columns(), table.schema()]);

    if (!this.hasAttribute('columns')) {
        this.setAttribute('columns', JSON.stringify(cols));
    }

    // Update Aggregates, 
    let aggregates = [];
    if (this.hasAttribute('aggregates')) {

        // Double check that the persisted aggregates actually match the 
        // expected types.
        aggregates = JSON.parse(this.getAttribute('aggregates')).map(col => {
            let _type = schema[col.column];
            if (col.op === "" || perspective.TYPE_AGGREGATES[_type].indexOf(col.op) === -1) {
                col.op = perspective.AGGREGATE_DEFAULTS[_type]
            }
            return col;
        });
    } else {
        aggregates = cols.map(col => ({
            column: col,
            op: perspective.AGGREGATE_DEFAULTS[schema[col]]
        }));
    }
    this.setAttribute('aggregates', JSON.stringify(aggregates));

    // Update column rows.
    let shown = JSON.parse(this.getAttribute('columns'));
    for (let x of cols) {
        let aggregate = aggregates
            .filter(a => a.column === x)
            .map(a => a.op)[0];
        let row = new_row.call(this, x, schema[x], aggregate);
        this._inactive_columns.appendChild(row);
        if (shown.indexOf(x) !== -1) {
            row.style.display = 'none';
            let active_row = new_row.call(this, x, schema[x], aggregate);
            this._active_columns.appendChild(active_row);
        }
    }
    if (cols.length === shown.length) {
        this._inactive_columns.style.display = 'none';
    } else {
        this._inactive_columns.style.display = 'block';
    }

    this._filter_input.innerHTML = "";
    this._update();
}

function new_row(name, type, aggregate) {
    let row = document.createElement('perspective-row');
    if (name) {
        if (!type) {
            let all = Array.prototype.slice.call(this.querySelectorAll('#inactive_columns perspective-row'));
            if (all.length > 0) {
                type = all.find(x => x.getAttribute('name') === name).getAttribute('type');
            } else {
                type = '';
            }
        }
        if (!aggregate) {
            let aggregates = JSON.parse(this.getAttribute('aggregates'));
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
        row.setAttribute('type', type);
        row.setAttribute('name', name);
        if (aggregate) {
            row.setAttribute('aggregate', aggregate);
        }
        row.addEventListener('visibility-clicked', column_visibility_clicked.bind(this));
        row.addEventListener('aggregate-selected', column_aggregate_clicked.bind(this));
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
    } else {
        row.setAttribute('drop-target', true);
    }
    return row;
}

function update() {
    if (!this._table) return;
    let row_pivots = this._view_columns('#row_pivots perspective-row');
    let column_pivots = this._view_columns('#column_pivots perspective-row');
    let filters = JSON.parse(this.getAttribute('filters'));
    let aggregates = this._get_view_aggregates();
    if (aggregates.length === 0) return;
    if (row_pivots.length === 0 && column_pivots.length > 0) {
        row_pivots = column_pivots;
        column_pivots = [];
    }
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
                    this._task.cancelled = true;
                }
                this._task = {cancelled: false}
                this._plugin.create.call(this, this._datavis, this._view, hidden, false, this._task).then(() => {
                    this.setAttribute('render_time', performance.now() - t);
                });
            }, timeout || 0);
        }
    });
    this._drop_target.style.display = 'none';

    const t = performance.now();
    this._render_count = (this._render_count || 0) + 1;
    if (this._task) {
        this._task.cancelled = true;
    }
    this._task = {cancelled: false}
    this._plugin.create.call(this, this._datavis, this._view, hidden, true, this._task).then(() => {
        if (!this.hasAttribute('render_time')) {
            this.dispatchEvent(new Event('loaded', {bubbles: true}));
        }
        this.setAttribute('render_time', performance.now() - t);
        this._render_count--;
        if (this._render_count === 0) {
            this.removeAttribute('updating');
        }
    }).catch(() => {
        console.debug("View cancelled");
    });
}

/******************************************************************************
 *
 * <perspective-viewer> Component
 *
 */

registerElement(template, {

    notifyResize: {
        value: function() {
            if (!document.hidden && this.offsetParent && document.contains(this)) {
                this._plugin.resize.call(this);
            }
        }
    },

    worker: {
        get: get_worker
    },

    _plugin: {
        get: function () {
            return RENDERERS[this._vis_selector.value];
        }
    },

    _toggle_config: {
        value: function () {
            if (this._show_config) {
                this._side_panel.style.display = 'none';
                this._top_panel.style.display = 'none';
                this.removeAttribute('settings')
            } else {
                this._side_panel.style.display = 'flex';
                this._top_panel.style.display = 'flex';
                this.setAttribute('settings', true);
            }
            this._show_config = !this._show_config;
            this._plugin.resize.call(this, true);
        }
    },

    message: {
        set: function(msg) {
            if (!this._inner_drop_target) return;
            this._inner_drop_target.innerHTML = msg;
        }
    },

    load: {
        value: function (json) {
            this._inner_drop_target.innerHTML = "<h3>Loading ...</h3>";
            for (let slave of this.slaves) {
                slave._inner_drop_target.innerHTML = "<h3>Loading ...</h3>";
            }
            load.bind(this)(json);
        }
    },

    update: {
        value: function (json) {
            if (this._table === undefined) {
                this.load(json);
            } else {
                this._table.update(json);
            }
        }
    },

    _get_view_filters: {
        value: function () {
            let filters = [];
            let filter = this._filter_input.value.trim();
            let cols = this._view_columns('#inactive_columns perspective-row');
            for (let col of cols) {
                filter = filter.split("`" + col.trim() + "`").join(col + "||||");
            }
            try {
                let terms = filter.split('&');
                let filters = [];
                for (let term of terms) {
                    term = term.split('||||');
                    let col = term[0].trim();
                    term = term[1].trim().split(' ');
                    let op = term[0];
                    let val = term.slice(1).join(' ').trim();
                    let t = parseFloat(val);
                    if (!isNaN(t)) val = t;
                    if (!col || !op || (!val && val !== 0)) {
                        this._filter_input.classList.add('error');
                        return [];
                    }
                    filters.push([col, op, val]);
                }
                this._filter_input.classList.remove('error');
                return filters;
            } catch (e) {
                this._filter_input.classList.add('error');
                return []
            }
        }
    },

    _get_view_aggregates: {
        value: function (selector) {
            selector = selector || '#active_columns perspective-row';
            return this._view_columns(selector, true);
        }
    },

    _view_columns: {
        value: function (selector, types) {
            let selection = this.querySelectorAll(selector);
            let sorted = Array.prototype.slice.call(selection);
            return sorted.map(s => {
                let name = s.getAttribute('name');
                if (types) {
                    let agg = s.getAttribute('aggregate');
                    return {op: agg, column: name};
                } else {
                    return name;
                }
            });
        }
    },

    _visible_column_count: {
        value: function() {
            let cols = Array.prototype.slice.call(this.querySelectorAll("#active_columns perspective-row"));
            return cols.length;
        }
    },

    _update_column_view: {
        value: function (columns, reset = false) {
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
                    x.style.display = 'block';
                } else {
                    x.style.display = 'none';
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
    },

    /**
     * The set of visibile columns.
     *
     * @param {array} columns An array of strings, the names of visible columns
     */
    columns: {
        set: function () {
            let show = JSON.parse(this.getAttribute('columns'));
            this._update_column_view(show, true);
            this.dispatchEvent(new Event('config-update'));
            this._update();
        }
    },

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
    aggregates: {
        set: function () {
            let show = JSON.parse(this.getAttribute('aggregates'));
            let lis = Array.prototype.slice.call(this.querySelectorAll("#side_panel perspective-row"));
            lis.map((x, ix) => {
                let agg = show[x.getAttribute('name')];
                if (agg) {
                    x.setAttribute('aggregate', agg);
                }
            });
            this.dispatchEvent(new Event('config-update'));
        }
    },

    filters: {
        set: function () {
            let filters = JSON.parse(this.getAttribute('filters'));
            if (filters.length > 0) {
                this._filter_input.value = filters.map(x => `\`${x[0]}\` ${x[1]} ${x[2]}`).join(' & ');
            }
            this.dispatchEvent(new Event('config-update'));
        }
    },

    view: {
        set: async function () {
            this._vis_selector.value = this.getAttribute('view');
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
                } else {
                    this.setAttribute('columns', JSON.stringify(cols.map(x => x.getAttribute('name'))));
                }
            }
            this.dispatchEvent(new Event('config-update'));
        }
    },

    'column-pivots': {
        set: function () {
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
    },

    'row-pivots': {
        set: function () {
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
    },

    'copy': {
        value: function (widget) {
            if (widget.hasAttribute('index')) {
                this.setAttribute('index', widget.getAttribute('index'));
            }
            widget.slaves.push(this);
            if (this._inner_drop_target) {
                this._inner_drop_target.innerHTML = widget._inner_drop_target.innerHTML + "<h3>*</h3>";
            }

            if (widget._table) {
                loadTable.call(this, widget._table);
            }
        }
    },

    'sort': {
        set: function () {
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
    },

    delete: {
        value: function () {
            if (this._view) this._view.delete();
            if (this._table) this._table.delete();
            if (this._plugin.delete) {
                this._plugin.delete.call(this);
            }
        }
    },

    'save': {
        value: function () {
            let obj = {};
            for (let key = 0; key < this.attributes.length; key++) {
                let attr = this.attributes[key];
                if (['id'].indexOf(attr.name) === -1) {
                    obj[attr.name] = attr.value;
                }
            }
            return obj;
        }
    },

    'restore': {
        value: function(x) {
            for (let key in x) {
                this.setAttribute(key, x[key]);
            }
        }
    },

    attachedCallback: {
        value: function() {
            let _update = _.debounce(update.bind(this), 10);
            this._update = () => {
                this.setAttribute('updating', true);
                _update();
            }

            this.slaves = [];
            this._aggregate_selector = this.querySelector('#aggregate_selector');
            this._vis_selector = this.querySelector('#vis_selector');
            this._filter_input = this.querySelector('#filter_input');
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

            this._filter_input.addEventListener('keyup', _.debounce(event => {
                let filters = this.getAttribute('filters');
                let new_filters = JSON.stringify(this._get_view_filters());
                if (filters !== new_filters) {
                    this.setAttribute('filters', new_filters);
                    this._update();
                }
            }, 200));

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
    }
})
