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
 *  Helpers
 *
 */

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

let TYPE_ORDER = {integer: 2, string: 0, float: 3, boolean: 4, datetime: 1};

const column_sorter = schema => (a, b) => {
    const s1 = TYPE_ORDER[schema[a]];
    const s2 = TYPE_ORDER[schema[b]];
    let r = 0;
    if (s1 == s2) {
        r = a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    } else {
        r = s1 < s2 ? -1 : 1;
    }
    return r;
};

function get_aggregates_with_defaults(aggregate_attribute, schema, cols) {
    const found = new Set();
    const aggregates = [];
    for (const col of aggregate_attribute) {
        const type = schema[col.column];
        found.add(col.column);
        if (type) {
            if (col.op === "" || perspective.TYPE_AGGREGATES[type].indexOf(col.op) === -1) {
                col.op = perspective.AGGREGATE_DEFAULTS[type];
            }
            aggregates.push(col);
        } else {
            console.warn(`No column "${col.column}" found (specified in aggregates attribute).`);
        }
    }

    // Add columns detected from dataset.
    for (const col of cols) {
        if (!found.has(col)) {
            aggregates.push({
                column: col,
                op: perspective.AGGREGATE_DEFAULTS[schema[col]]
            });
        }
    }

    return aggregates;
}

function calculate_throttle_timeout(render_time) {
    const view_count = document.getElementsByTagName("perspective-viewer").length;
    const timeout = render_time * view_count * 2;
    return Math.min(10000, Math.max(0, timeout));
}

/******************************************************************************
 *
 * PerspectiveElement
 *
 */

export class PerspectiveElement extends StateElement {
    async _check_recreate_computed_columns() {
        const computed_columns = JSON.parse(this.getAttribute("computed-columns"));
        if (computed_columns.length > 0) {
            for (const col of computed_columns) {
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

        const [cols, schema, computed_schema] = await Promise.all([table.columns(), table.schema(true), table.computed_schema()]);

        this._clear_columns();

        this._initial_col_order = cols.slice();
        if (!this.hasAttribute("columns")) {
            this.setAttribute("columns", JSON.stringify(this._initial_col_order));
        }

        cols.sort(column_sorter(schema));

        // Update aggregates
        const computed_aggregates = Object.entries(computed_schema).map(([column, op]) => ({
            column,
            op
        }));

        const all_cols = cols.concat(Object.keys(computed_schema));
        const aggregates = get_aggregates_with_defaults(this.get_aggregate_attribute().concat(computed_aggregates), schema, all_cols);

        let shown = JSON.parse(this.getAttribute("columns")).filter(x => all_cols.indexOf(x) > -1);
        if (shown.length === 0) {
            shown = this._initial_col_order;
        }

        this.set_aggregate_attribute(aggregates);

        for (const name of all_cols) {
            const aggregate = aggregates.find(a => a.column === name).op;
            const row = this._new_row(name, schema[name], aggregate, null, null, computed_schema[name]);
            this._inactive_columns.appendChild(row);
            if (shown.includes(name)) {
                row.classList.add("active");
            }
        }

        for (const x of shown) {
            const active_row = this._new_row(x, schema[x]);
            this._active_columns.appendChild(active_row);
        }

        if (all_cols.length === shown.length) {
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
                const over_per = Math.floor((count / this._plugin.max_size) * 100) - 100;
                const warning = `Rendering estimated ${numberWithCommas(count)} (+${numberWithCommas(over_per)}%) points.  `;
                this._plugin_information_message.innerText = warning;
                this.removeAttribute("updating");
                return true;
            } else {
                this._plugin_information.classList.add("hidden");
            }
        }
        return false;
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
                const updater = this._plugin.update || this._plugin.create;
                try {
                    await updater.call(this, this._datavis, this._view, task);
                    timer();
                    task.cancel();
                } catch (err) {
                    console.error("Error rendering plugin.", err);
                } finally {
                    this.dispatchEvent(new Event("perspective-view-update"));
                }
            }, calculate_throttle_timeout(this.getAttribute("render_time")));
        }
    }

    async _validate_filters() {
        const filters = [];
        for (const node of this._get_view_filter_nodes()) {
            const operandNode = node.shadowRoot.getElementById("filter_operand");
            const exclamation = node.shadowRoot.getElementById("row_exclamation");
            const {operator, operand} = JSON.parse(node.getAttribute("filter"));
            const filter = [node.getAttribute("name"), operator, operand];
            if (await this._table.is_valid_filter(filter)) {
                filters.push(filter);
                node.title = "";
                operandNode.style.borderColor = "";
                exclamation.hidden = true;
            } else {
                node.title = "Invalid Filter";
                operandNode.style.borderColor = "red";
                exclamation.hidden = false;
            }
        }

        return filters;
    }

    async _new_view(ignore_size_check = false) {
        if (!this._table) return;
        this._check_responsive_layout();
        const row_pivots = this._get_view_row_pivots();
        const column_pivots = this._get_view_column_pivots();
        const filters = await this._validate_filters();
        const aggregates = this._get_view_aggregates();
        if (aggregates.length === 0) return;
        const sort = this._get_view_sorts();
        const hidden = this._get_view_hidden(aggregates, sort);
        for (const s of hidden) {
            const all = this.get_aggregate_attribute();
            if (column_pivots.indexOf(s) > -1 || row_pivots.indexOf(s) > -1) {
                aggregates.push({column: s, op: "unique"});
            } else {
                aggregates.push(all.reduce((obj, y) => (y.column === s ? y : obj)));
            }
        }

        if (this._view) {
            this._view.delete();
            this._view.remove_update(this._view_updater);
            this._view.remove_delete();
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

        this._view_updater = () => this._view_on_update();
        this._view.on_update(this._view_updater);

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
        const all = [];
        if (this._view) {
            const view = this._view;
            this._view = undefined;
            all.push(view.delete());
            view.remove_update(this._view_updater);
            view.remove_delete();
        }
        if (this._table) {
            const table = this._table;
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
            if (this._table) {
                this.setAttribute("updating", true);
                await new Promise(resolve => _update(resolve, ignore_size_check));
            }
        };
    }

    _get_worker() {
        if (this._table) {
            return this._table._worker;
        }
        return perspective.shared_worker();
    }
}
