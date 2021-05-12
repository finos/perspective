/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import isEqual from "lodash/isEqual";
import {html, render} from "lit-html";

import {throttlePromise} from "../utils.js";
import * as perspective from "@finos/perspective/dist/esm/config/constants.js";
import {get_type_config} from "@finos/perspective/dist/esm/config";
import {CancelTask} from "./cancel_task.js";

import {StateElement} from "./state_element.js";
import {findExpressionByAlias, getExpressionAlias} from "../utils.js";

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

function get_aggregate_defaults(columns, schema, expression_schema) {
    const aggregates = {};
    for (const col of columns) {
        let type = schema[col];
        if (!type) {
            type = expression_schema[col];
        }
        aggregates[col] = get_type_config(type).aggregate;
    }
    return aggregates;
}

function get_aggregates_with_defaults(aggregate_attribute, columns, schema, expression_schema) {
    const found = new Set();
    const aggregates = [];
    for (const col of aggregate_attribute) {
        let type = schema[col.column];
        if (!type) {
            type = expression_schema[col.column];
        }
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
    for (const col of columns) {
        if (!found.has(col)) {
            let type = schema[col];
            if (!type) {
                type = expression_schema[col.column];
            }
            aggregates.push({
                column: col,
                op: get_type_config(type).aggregate
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
    /**
     * Given a {@link module:perspective~table}, load it into the
     * {@link module:perspective_viewer~PerspectiveViewer} and set the viewer's
     * state. If the `expressions` attribute is set on the viewer, this
     * method attempts to validate the expressions with the `Table` and
     * reconcile state.
     *
     * @param {*} table
     */
    async _load_table(table, resolve) {
        this.shadowRoot.querySelector("#app").classList.add("hide_message");

        this._clear_state();
        this._table = table;

        let [cols, schema] = await Promise.all([table.columns(), table.schema(true)]);

        // Initial col order never contains expressions
        this._initial_col_order = cols.slice();

        // Grab expressions from the viewer and validate them so that
        // expressions do not crash the viewer/table.
        const expressions = this._get_view_expressions();
        const valid_expressions = [];

        let expression_schema = {};

        if (expressions.length > 0) {
            const valid_expression_alias = [];
            const validate_results = await table.validate_expressions(expressions);
            expression_schema = validate_results.expression_schema;

            for (const expression of expressions) {
                const alias = getExpressionAlias(expression);

                if (alias === undefined) {
                    console.warn(`Not applying expression ${expression} as it does not have an alias set.`);
                    continue;
                }

                if (expression_schema[alias]) {
                    valid_expressions.push(expression);
                    valid_expression_alias.push(alias);
                } else {
                    console.error(`Could not validate expression "${alias}": ${validate_results.errors[alias]}`);
                }
            }

            cols = cols.concat(valid_expression_alias);
        }

        if (!this.hasAttribute("columns")) {
            this.setAttribute("columns", JSON.stringify(this._initial_col_order));
        }

        cols.sort(column_sorter(schema));

        // Update aggregates
        const aggregate_attribute = this.get_aggregate_attribute();
        const aggregates = get_aggregates_with_defaults(aggregate_attribute, cols, schema, expression_schema);

        let shown = JSON.parse(this.getAttribute("columns")); //.filter(x => all_cols.indexOf(x) > -1);

        // At this point, cols contains both the table columns and the
        // validated expressions, so this should only filter on columns
        // that don't exist in either.
        const shown_is_invalid = shown.filter(x => cols.indexOf(x) > -1).length === 0;

        if (shown_is_invalid) {
            shown = this._initial_col_order;
        }

        this._aggregate_defaults = get_aggregate_defaults(cols, schema, expression_schema);

        // Clear the columns in the DOM before adding new ones
        this._clear_columns();

        for (const name of cols) {
            let aggregate = aggregates.find(a => a.column === name).op;
            let type = schema[name];
            if (!type) {
                type = expression_schema[name];
            }
            const expression = findExpressionByAlias(name, valid_expressions);
            const row = this._new_row(name, type, aggregate, null, null, expression);
            this._inactive_columns.appendChild(row);
            if (shown.includes(name)) {
                row.classList.add("active");
            }
        }

        while (shown.length < this._plugin.initial?.names?.length) {
            shown.push(null);
        }

        for (const x of shown) {
            let type = schema[x];
            if (!type) {
                type = expression_schema[x];
            }
            const expression = findExpressionByAlias(x, valid_expressions);
            const active_row = this._new_row(x, type, undefined, undefined, undefined, expression);
            this._active_columns.appendChild(active_row);
        }

        if (cols.length === shown.filter(x => cols.indexOf(x) > -1).length) {
            this._columns_container.classList.add("collapse");
        } else {
            this._columns_container.classList.remove("collapse");
        }

        this._show_column_container();
        this._show_side_panel_actions();

        // Filters need type information to populate e.g. the operator dropdown,
        // so reset them.
        if (this.hasAttribute("filters")) {
            this.filters = this.getAttribute("filters");
        }

        // Get an edit port from the table, and set it on the viewer so that
        // all grid edits use the specified port.
        this._edit_port = await table.make_port();

        // Resolve the edit port lock, which allows for `get_edit_port` to be
        // called in arbitary order without ever returning a null value.
        this._edit_port_lock.resolve(this._edit_port);

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
        // If the plugin is set to not render a warning, i.e. after the user
        // selects "Render all points", then return null for max_cols/max_rows.
        if (typeof this._plugin.max_columns !== "undefined" && this._plugin.render_warning === false) {
            return {
                max_cols: null,
                max_rows: null
            };
        }

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
                operandNode.style.borderColor = "";
                exclamation.hidden = true;
            } else {
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

        const expressions = this._get_view_expressions();

        const config = {
            filter: filters,
            row_pivots: row_pivots,
            column_pivots: column_pivots,
            aggregates: aggregates,
            columns: columns,
            sort: sort,
            expressions: expressions
        };

        if (this._task) {
            this._task.cancel();
        }

        if (this._view) {
            this._view.remove_update(this._view_updater);
            this._vieux.delete_view();
            this._view.delete();
        }

        try {
            this._view = await this._table.view(config);
            this._view_updater = () => this._view_on_update(limit_points);
            this._view.on_update(this._view_updater);
        } catch (e) {
            // Delete the view handle only if it exists - if this._view is
            // undefined, calling delete will throw its own "cannot read
            // property of undefined" error and squash the original, more
            // informative error message on why the view could not be created.
            if (this._view) this._view.delete();
            throw e;
        }

        this._vieux.set_view(this._view);

        const timer = this._render_time();
        const task = (this._task = new CancelTask(() => {}, true));

        try {
            const {max_cols, max_rows} = await this.get_maxes();
            if (task.cancelled) {
                return;
            }
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
        }
    }

    _check_loaded_table() {
        if (this._table && this._table_resolver) {
            const table = this._table;
            const resolve = this._table_resolver;
            delete this._table;
            delete this._table_resolver;
            this._load_table(table, resolve);
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
        return Promise.all(all);
    }

    _set_updating() {
        this.toggleAttribute("updating", true);
        let resolve;
        this._updating_promise = new Promise(_resolve => {
            resolve = () => {
                _resolve();
            };
        });
        return resolve;
    }

    @throttlePromise(true)
    async _update(ignore_size_check, force_update, limit_points) {
        await new Promise(setTimeout);
        await this._new_view({ignore_size_check, force_update, limit_points});
    }

    async _debounce_update({force_update = false, ignore_size_check = false, limit_points = true} = {}) {
        if (this._table) {
            let resolve = this._set_updating();
            await this._update(ignore_size_check, force_update, limit_points);
            resolve();
        }
    }
}
