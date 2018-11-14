/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import _ from "underscore";

import perspective from "@jpmorganchase/perspective";
import {CancelTask} from "./cancel_task.js";
import {COMPUTATIONS} from "../computed_column.js";

import {StateElement} from "./state_element.js";

/******************************************************************************
 *
 * Web Worker Singleton
 *
 */

const WORKER_SINGLETON = (function() {
    let __WORKER__;
    return {
        getInstance: function() {
            if (__WORKER__ === undefined) {
                __WORKER__ = perspective.worker();
            }
            return __WORKER__;
        }
    };
})();

if (document.currentScript && document.currentScript.hasAttribute("preload")) {
    WORKER_SINGLETON.getInstance();
}

/******************************************************************************
 *
 * Perspective Loading
 *
 */

let TYPE_ORDER = {integer: 2, string: 0, float: 3, boolean: 4, datetime: 1};

const column_sorter = schema => (a, b) => {
    let s1 = TYPE_ORDER[schema[a]];
    let s2 = TYPE_ORDER[schema[b]];
    let r = 0;
    if (s1 == s2) {
        r = a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    } else {
        r = s1 < s2 ? -1 : 1;
    }
    return r;
};

function get_aggregates_with_defaults(aggregate_attribute, schema, cols) {
    const found = {};
    const aggregates = aggregate_attribute
        .map(col => {
            const _type = schema[col.column];
            found[col.column] = true;
            if (_type) {
                if (col.op === "" || perspective.TYPE_AGGREGATES[_type].indexOf(col.op) === -1) {
                    col.op = perspective.AGGREGATE_DEFAULTS[_type];
                }
                return col;
            } else {
                console.warn(`No column "${col.column}" found (specified in aggregates attribute).`);
            }
        })
        .filter(x => x);

    // Add columns detected from dataset.
    for (const col of cols) {
        if (!found[col]) {
            aggregates.push({
                column: col,
                op: perspective.AGGREGATE_DEFAULTS[schema[col]]
            });
        }
    }

    return aggregates;
}

export class PerspectiveElement extends StateElement {
    async _check_recreate_computed_columns() {
        const computed_columns = JSON.parse(this.getAttribute("computed-columns"));
        if (computed_columns.length > 0) {
            for (let col of computed_columns) {
                await this._create_computed_column({
                    detail: {
                        column_name: col.name,
                        input_columns: col.inputs.map(x => ({name: x})),
                        computation: COMPUTATIONS[col.func]
                    }
                });
            }
            this._debounce_update({ignore_size_check: false});
            return true;
        }
        return false;
    }

    async _load_table(table, computed = false) {
        this.shadowRoot.querySelector("#app").classList.add("hide_message");
        this.setAttribute("updating", true);

        if (this._table && !computed) {
            this.removeAttribute("computed-columns");
        }

        this._clear_state();
        this._table = table;

        if (this.hasAttribute("computed-columns") && !computed) {
            if (await this._check_recreate_computed_columns()) {
                return;
            }
        }

        const [cols, schema, computed_schema] = await Promise.all([table.columns(), table.schema(), table.computed_schema()]);

        this._clear_columns();

        this._initial_col_order = cols.slice();
        if (!this.hasAttribute("columns")) {
            this.setAttribute("columns", JSON.stringify(this._initial_col_order));
        }

        cols.sort(column_sorter(schema));

        // Update aggregates
        const aggregates = get_aggregates_with_defaults(this.get_aggregate_attribute(), schema, cols);
        this.set_aggregate_attribute(aggregates);

        // strip computed columns from sorted columns & schema - place at end
        if (Object.keys(computed_schema).length > 0) {
            for (const cc of Object.values(computed_schema)) {
                if (cols.includes(cc)) {
                    cols.splice(cols.indexOf(cc), 1);
                }
                if (cc in schema) {
                    delete schema[cc];
                }
            }
        }

        // Update column rows
        let shown = this.hasAttribute("columns") ? JSON.parse(this.getAttribute("columns")).filter(x => cols.indexOf(x) > -1) : [];

        for (let x of cols) {
            let aggregate = aggregates.filter(a => a.column === x).map(a => a.op)[0];
            let row = this._new_row(x, schema[x], aggregate);
            this._inactive_columns.appendChild(row);
            if (shown.includes(x)) {
                row.classList.add("active");
            }
        }

        const computed_cols = _.pairs(computed_schema);

        // fixme better approach please
        for (let cc of computed_cols) {
            let cc_data = {
                column_name: cc[0],
                input_columns: cc[1].input_columns,
                input_type: cc[1].input_type,
                computation: cc[1].computation,
                type: cc[1].type
            };
            let aggregate = aggregates.filter(a => a.column === cc_data.column_name).map(a => a.op)[0];
            let row = this._new_row(cc_data.column_name, cc_data.type, aggregate, null, null, cc_data);
            this._inactive_columns.appendChild(row);
            if (shown.includes(cc)) {
                row.classList.add("active");
            }
        }

        if (!this.hasAttribute("columns") || shown.length === 0) {
            this._set_column_defaults();
            shown = JSON.parse(this.getAttribute("columns") || "[]").filter(x => cols.indexOf(x) > -1);
            for (let x in cols) {
                if (shown.indexOf(x) !== -1) {
                    this._inactive_columns.children[x].classList.add("active");
                }
            }
        } else {
            for (let x of shown) {
                let active_row = this._new_row(x, schema[x]);
                this._active_columns.appendChild(active_row);
            }
        }

        if (cols.length === shown.length) {
            this._inactive_columns.parentElement.classList.add("collapse");
        } else {
            this._inactive_columns.parentElement.classList.remove("collapse");
        }

        this._show_column_selectors();

        this.filters = this.getAttribute("filters");
        await this._debounce_update();
    }

    async _warn_render_size_exceeded() {
        if (this._show_warnings && typeof this._plugin.max_size !== "undefined") {
            const num_columns = await this._view.num_columns();
            const num_rows = await this._view.num_rows();
            const count = num_columns * num_rows;
            if (count >= this._plugin.max_size) {
                this._plugin_information.classList.remove("hidden");
                this.removeAttribute("updating");
                return true;
            } else {
                this._plugin_information.classList.add("hidden");
            }
        }
        return false;
    }

    _calculate_throttle_timeout() {
        let view_count = document.getElementsByTagName("perspective-viewer").length;
        let timeout = this.getAttribute("render_time") * view_count * 2;
        return Math.min(10000, Math.max(0, timeout));
    }

    _view_on_update() {
        if (!this._debounced) {
            this._debounced = setTimeout(async () => {
                this._debounced = undefined;
                const timer = this._render_time();
                if (this._task && !this._task.initial) {
                    this._task.cancel();
                }
                const task = (this._task = new CancelTask());
                let updater = this._plugin.update;
                if (!updater) {
                    updater = this._plugin.create;
                }
                try {
                    await updater.call(this, this._datavis, this._view, task);
                    timer();
                    task.cancel();
                } catch (err) {
                    console.error("Error rendering plugin.", err);
                } finally {
                    this.dispatchEvent(new Event("perspective-view-update"));
                }
            }, this._calculate_throttle_timeout());
        }
    }

    async _new_view(ignore_size_check = false) {
        if (!this._table) return;
        let row_pivots = this._get_view_row_pivots();
        let column_pivots = this._get_view_column_pivots();
        let filters = this._get_view_filters();
        let aggregates = this._get_view_aggregates();
        if (aggregates.length === 0) return;
        let sort = this._get_view_sorts();
        let hidden = this._get_view_hidden(aggregates, sort);
        for (let s of hidden) {
            let all = this._get_view_aggregates("#inactive_columns perspective-row");
            aggregates.push(all.reduce((obj, y) => (y.column === s ? y : obj)));
        }

        if (this._view) {
            this._view.delete();
            this._view = undefined;
        }
        this._view = this._table.view({
            filter: filters,
            row_pivot: row_pivots,
            column_pivot: column_pivots,
            aggregate: aggregates,
            sort: sort
        });

        if (!ignore_size_check) {
            if (await this._warn_render_size_exceeded()) {
                return;
            }
        }

        this._view.on_update(() => this._view_on_update());

        const timer = this._render_time();
        this._render_count = (this._render_count || 0) + 1;
        if (this._task) {
            this._task.cancel();
        }

        const task = (this._task = new CancelTask(() => this._render_count--, true));

        try {
            await this._plugin.create.call(this, this._datavis, this._view, task);
        } catch (err) {
            console.warn(err);
        } finally {
            if (!this.hasAttribute("render_time")) {
                this.dispatchEvent(new Event("perspective-view-update"));
            }
            timer();
            task.cancel();
            if (this._render_count === 0) {
                this.removeAttribute("updating");
            }
        }
    }

    _render_time() {
        const t = performance.now();
        return () => this.setAttribute("render_time", performance.now() - t);
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
        }
        if (this._table) {
            let table = this._table;
            this._table = undefined;
            if (table._owner_viewer && table._owner_viewer === this) {
                all.push(table.delete());
            }
        }
        return Promise.all(all);
    }

    // setup for update
    _register_debounce_instance() {
        const _update = _.debounce((resolve, ignore_size_check) => {
            this._new_view(ignore_size_check).then(resolve);
        }, 10);
        this._debounce_update = async ({ignore_size_check = false} = {}) => {
            this.setAttribute("updating", true);
            await new Promise(resolve => _update(resolve, ignore_size_check));
        };
    }

    _get_worker() {
        if (this._table) {
            return this._table._worker;
        }
        return WORKER_SINGLETON.getInstance();
    }
}
