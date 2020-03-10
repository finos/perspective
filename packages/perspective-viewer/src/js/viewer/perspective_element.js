/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import debounce from "lodash/debounce";
import isEqual from "lodash/isEqual";
import {html, render} from "lit-html";

import perspective from "@finos/perspective";
import {get_type_config} from "@finos/perspective/dist/esm/config";
import {CancelTask} from "./cancel_task.js";

import {StateElement} from "./state_element.js";

import {expression_to_computed_column_config} from "../computed_expressions/visitor";

/******************************************************************************
 *
 *  Helpers
 *
 */

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

let TYPE_ORDER = {integer: 2, string: 0, float: 3, boolean: 4, datetime: 1, date: 1};

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

function get_aggregate_defaults(schema, cols) {
    const aggregates = {};
    for (const col of cols) {
        aggregates[col] = get_type_config(schema[col]).aggregate;
    }
    return aggregates;
}

function get_aggregates_with_defaults(aggregate_attribute, schema, cols) {
    const found = new Set();
    const aggregates = [];
    for (const col of aggregate_attribute) {
        const type = schema[col.column];
        const type_config = get_type_config(type);
        found.add(col.column);
        if (type_config.type || type) {
            if (col.op === "" || perspective.TYPE_AGGREGATES[type_config.type || type].indexOf(col.op) === -1) {
                col.op = type_config.aggregate;
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
                op: get_type_config(schema[col]).aggregate
            });
        }
    }

    return aggregates;
}

const _total_template = args => {
    if (args) {
        const x = numberWithCommas(args[0]);
        const y = numberWithCommas(args[1]);
        const total = Math.floor((args[0] / args[1]) * 100);
        return html`
            <span title="${x} / ${y}" class="plugin_information--overflow-hint">&nbsp;<span class="plugin_information--overflow-hint-percent">${total}%</span>&nbsp;</span>
        `;
    }
};

const _nowrap_template = text => {
    if (text !== "") {
        return html`
            <span style="white-space:nowrap">${text}</span>
        `;
    }
};

/**
 * Render warning template tagged literal.
 * @param {*} strings
 * @param  {...[n, m]} args tuples of rationals to be formatted.
 */
const _warning = (strings, ...args) => strings.flatMap((str, idx) => [_nowrap_template(str), _total_template(args[idx])]).filter(x => x);

/******************************************************************************
 *
 * PerspectiveElement
 *
 */

export class PerspectiveElement extends StateElement {
    async _load_table(table, computed = false) {
        this.shadowRoot.querySelector("#app").classList.add("hide_message");
        const resolve = this._set_updating();

        if (this._table && !computed) {
            this.removeAttribute("computed-columns");
        }

        this._clear_state();
        this._table = table;

        let [cols, schema] = await Promise.all([table.columns(), table.schema(true)]);

        this._clear_columns();

        // Initial col order never contains computed columns
        this._initial_col_order = cols.slice();

        // If `computed-columns` and `parsed-computed-columns` are set on the
        // viewer, we need to make sure they contain valid columns that belong
        // to this table before applying them to the view.
        const parsed_computed_columns = JSON.parse(this.getAttribute("parsed-computed-columns")) || [];
        const parsed_computed_names = parsed_computed_columns.map(x => x.column);
        const valid_parsed_computed = [];

        // Make sure all computed columns are derived from valid columns.
        for (const computed of parsed_computed_columns) {
            let valid = true;
            for (const input of computed.inputs) {
                if (!cols.includes(input) && !parsed_computed_names.includes(input)) {
                    // A name is invalid, so don't include it
                    // TODO: this means we are no longer 1:1 with attribute API
                    valid = false;
                    break;
                }
            }
            if (valid) {
                valid_parsed_computed.push(computed.column);
            }
        }

        cols = cols.concat(valid_parsed_computed);

        if (!this.hasAttribute("columns")) {
            this.setAttribute("columns", JSON.stringify(this._initial_col_order));
        }

        cols.sort(column_sorter(schema));

        // Update aggregates
        const aggregate_attribute = this.get_aggregate_attribute();
        const aggregates = get_aggregates_with_defaults(aggregate_attribute, schema, cols);

        let shown = JSON.parse(this.getAttribute("columns")); //.filter(x => all_cols.indexOf(x) > -1);

        // At this point, cols contains both the table columns and the
        // validated computed columns, so this should only filter on columns
        // that don't exist in either.
        const shown_is_invalid = shown.filter(x => cols.indexOf(x) > -1).length === 0;

        if (shown_is_invalid) {
            shown = this._initial_col_order;
        }

        this._aggregate_defaults = get_aggregate_defaults(schema, cols);

        for (const name of cols) {
            let aggregate = aggregates.find(a => a.column === name).op;
            const computed = parsed_computed_names.includes(name) ? name : undefined;

            if (computed && !aggregate) {
                // FIXME: this is spinning out of control
                aggregate = "count";
            }
            const row = this._new_row(name, schema[name], aggregate, null, null, null, computed);
            this._inactive_columns.appendChild(row);
            if (shown.includes(name)) {
                row.classList.add("active");
            }
        }

        while (shown.length < this._plugin.initial?.names?.length) {
            shown.push(null);
        }

        // FIXME: maybe we need to break up this method - there's too many
        // links here that are fragile.
        for (const x of shown) {
            const computed = parsed_computed_names.includes(x) ? x : undefined;
            // Default to count again here
            const aggregate = computed ? "count" : undefined;

            // FIXME: there is no type here for computed columns in table
            // schema, nor is there sort order, aggregate, or anything else.
            // We need a new paradigm for this to work otherwise it'll
            // be broken in various places with hard-to-trace side effects.
            const active_row = this._new_row(x, schema[x], aggregate, undefined, undefined, computed);
            this._active_columns.appendChild(active_row);
        }

        if (cols.length === shown.filter(x => cols.indexOf(x) > -1).length) {
            this._inactive_columns.parentElement.classList.add("collapse");
        } else {
            this._inactive_columns.parentElement.classList.remove("collapse");
        }

        this._show_column_container();

        if ((await this._table.compute()) === true) {
            this._show_side_panel_actions();
        }

        // Filters need type information to populate e.g. the operator dropdown,
        // so reset them.
        if (this.hasAttribute("filters")) {
            this.filters = this.getAttribute("filters");
        }
        try {
            await this._debounce_update({force_update: true});
        } catch (e) {
            console.warn("Initial view failed, resetting UI state");
            await this.reset();
            throw e;
        }

        resolve();
    }

    async get_maxes() {
        let max_cols, max_rows;
        const [schema, num_columns] = await Promise.all([this._view.schema(), this._view.num_columns()]);
        const schema_columns = Object.keys(schema || {}).length || 1;

        if (typeof this._plugin.max_columns !== "undefined") {
            const column_group_diff = this._plugin.max_columns % schema_columns;
            const column_limit = this._plugin.max_columns + column_group_diff;
            max_cols = column_limit < num_columns ? column_limit : undefined;
        }

        if (typeof this._plugin.max_cells !== "undefined") {
            max_rows = Math.ceil(max_cols ? this._plugin.max_cells / max_cols : this._plugin.max_cells / (num_columns || 1));
        }

        return {max_cols, max_rows};
    }

    async _warn_render_size_exceeded(max_cols, max_rows) {
        if (this._show_warnings && (max_cols || max_rows)) {
            const num_columns = await this._view.num_columns();
            const num_rows = await this._view.num_rows();
            const count = num_columns * num_rows;
            const columns_are_truncated = max_cols && max_cols < num_columns;
            const rows_are_truncated = max_rows && max_rows < num_rows;
            if (columns_are_truncated && rows_are_truncated) {
                this._plugin_information.classList.remove("hidden");
                const warning = _warning`Rendering ${[max_cols, num_columns]} of columns and ${[num_columns * max_rows, count]} of points.`;
                render(warning, this._plugin_information_message);
                return true;
            } else if (columns_are_truncated) {
                this._plugin_information.classList.remove("hidden");
                const warning = _warning`Rendering ${[max_cols, num_columns]} of columns.`;
                render(warning, this._plugin_information_message);
                return true;
            } else if (rows_are_truncated) {
                this._plugin_information.classList.remove("hidden");
                const warning = _warning`Rendering ${[num_columns * max_rows, count]} of points.`;
                render(warning, this._plugin_information_message);
                return true;
            } else {
                this._plugin_information.classList.add("hidden");
            }
        }
        return false;
    }

    /**
     * Calculates the optimal timeout in milliseconds for render events,
     * calculated by 5 frame moving average of this component's render
     * framerate, or explicit override attribute `"throttle"`.
     *
     * @private
     * @returns
     * @memberof PerspectiveElement
     */
    _calculate_throttle_timeout() {
        let timeout;
        const throttle = this.getAttribute("throttle");
        if (throttle === undefined || throttle === "null" || !this.hasAttribute("throttle")) {
            if (!this.__render_times || this.__render_times.length < 5) {
                return 0;
            }
            timeout = this.__render_times.reduce((x, y) => x + y, 0) / this.__render_times.length;
            timeout = Math.min(5000, timeout);
        } else {
            timeout = parseInt(throttle);
            if (isNaN(timeout) || timeout < 0) {
                console.warn(`Bad throttle attribute value "${throttle}".  Can be (non-negative integer) milliseconds.`);
                this.removeAttribute("throttle");
                return 0;
            }
        }
        return Math.max(0, timeout);
    }

    _view_on_update(limit_points) {
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
                    if (limit_points) {
                        const {max_cols, max_rows} = await this.get_maxes();
                        if (!task.cancelled) {
                            await this._warn_render_size_exceeded(max_cols, max_rows);
                            await updater.call(this, this._datavis, this._view, task, max_cols, max_rows);
                        }
                    } else {
                        await updater.call(this, this._datavis, this._view, task);
                    }
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

    _is_config_changed(config) {
        const plugin_name = this.getAttribute("plugin");
        if (isEqual(config, this._previous_config) && plugin_name === this._previous_plugin_name) {
            return false;
        } else {
            this._previous_config = config;
            this._previous_plugin_name = plugin_name;
            return true;
        }
    }

    async _new_view({force_update = false, ignore_size_check = false, limit_points = true} = {}) {
        if (!this._table) return;
        this._check_responsive_layout();
        const row_pivots = this._get_view_row_pivots();
        const column_pivots = this._get_view_column_pivots();
        const filters = await this._validate_filters();
        const view_aggregates = this._get_view_aggregates();
        if (view_aggregates.length === 0) return;
        const sort = this._get_view_sorts();

        let columns = view_aggregates.map(x => x.column);
        let aggregates = {};
        for (const a of view_aggregates) {
            aggregates[a.column] = a.op;
        }

        for (const s of sort) {
            const name = s[0];
            if (columns.indexOf(name) === -1 && !(column_pivots.indexOf(s) > -1 || row_pivots.indexOf(s) > -1)) {
                const all = this.get_aggregate_attribute();
                const {column, op} = all.reduce((obj, y) => (y.column === name ? y : obj));
                aggregates[column] = op;
            }
        }

        const computed_columns = this._get_view_computed_columns() || [];
        let parsed_computed_columns = [];

        if (computed_columns.length > 0) {
            // For each computed column, parse the expression if it is a string.
            for (const expr of computed_columns) {
                if (typeof expr === "string") {
                    try {
                        parsed_computed_columns = parsed_computed_columns.concat(expression_to_computed_column_config(expr));
                    } catch (e) {
                        console.warn(`Could not parse computed expression ${expr}:`, e.message);
                        continue;
                    }
                } else {
                    parsed_computed_columns.push(expr);
                }
            }
        }

        const config = {
            filter: filters,
            row_pivots: row_pivots,
            column_pivots: column_pivots,
            aggregates: aggregates,
            columns: columns,
            sort: sort,
            computed_columns: parsed_computed_columns
        };

        if (this._view) {
            this._view.remove_update(this._view_updater);
            this._view.delete();
            this._view = undefined;
        }

        try {
            this._view = this._table.view(config);
            this._view_updater = () => this._view_on_update(limit_points);
            this._view.on_update(this._view_updater);
        } catch (e) {
            this._view.delete();
            throw e;
        }

        const timer = this._render_time();
        this._render_count = (this._render_count || 0) + 1;
        if (this._task) {
            this._task.cancel();
        }

        const task = (this._task = new CancelTask(() => this._render_count--, true));

        try {
            const {max_cols, max_rows} = await this.get_maxes();
            if (!ignore_size_check) {
                await this._warn_render_size_exceeded(max_cols, max_rows);
            }
            if (limit_points) {
                await this._plugin.create.call(this, this._datavis, this._view, task, max_cols, max_rows, force_update);
            } else {
                await this._plugin.create.call(this, this._datavis, this._view, task, undefined, undefined, force_update);
            }
        } catch (err) {
            console.warn(err);
        } finally {
            if (!this.__render_times) {
                this.__render_times = [];
                this.dispatchEvent(new Event("perspective-view-update"));
            }
            timer();
            task.cancel();
            if (this._render_count === 0) {
                this.removeAttribute("updating");
                this.dispatchEvent(new Event("perspective-update-complete"));
            }
        }
    }

    _check_loaded_table() {
        if (this._table) {
            const table = this._table;
            delete this._table;
            this._load_table(table);
        }
    }

    _render_time() {
        const t = performance.now();
        return () => {
            this.__render_times.unshift(performance.now() - t);
            this.__render_times = this.__render_times.slice(0, 5);
        };
    }

    _restyle_plugin() {
        if (this._plugin.styleElement) {
            const task = (this._task = new CancelTask());
            this._plugin.styleElement.call(this, this._datavis, this._view, task);
        }
    }

    _clear_state(clear_table = true) {
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
        if (this._table && clear_table) {
            const table = this._table;
            this._table = undefined;
            if (table._owner_viewer && table._owner_viewer === this) {
                all.push(table.delete());
            }
        }
        return Promise.all(all);
    }

    _set_updating() {
        this.toggleAttribute("updating", true);
        let resolve;
        this._updating_promise = new Promise(_resolve => {
            resolve = _resolve;
        });
        return resolve;
    }

    _register_debounce_instance() {
        const _update = debounce((resolve, ignore_size_check, force_update, limit_points) => {
            this._new_view({ignore_size_check, force_update, limit_points}).then(resolve);
        }, 0);

        this._debounce_update = async ({force_update = false, ignore_size_check = false, limit_points = true} = {}) => {
            if (this._table) {
                let resolve = this._set_updating();
                await new Promise(resolve => _update(resolve, ignore_size_check, force_update, limit_points));
                resolve();
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
