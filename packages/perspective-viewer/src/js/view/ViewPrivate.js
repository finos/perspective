/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "@webcomponents/webcomponentsjs";
import "@webcomponents/shadycss/custom-style-interface.min.js";

import _ from "underscore";

import perspective from "@jpmorganchase/perspective/src/js/perspective.parallel.js";
import {undrag, column_undrag, column_dragleave, column_dragover, column_drop, drop, drag_enter, allow_drop, disallow_drop} from "../dragdrop.js";
import {column_visibility_clicked, column_aggregate_clicked, column_filter_clicked, sort_order_clicked} from "./actions.js";
import {renderers} from "./renderers.js";
import {COMPUTATIONS} from "../computed_column.js";

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

export class ViewPrivate extends HTMLElement {
    // load a new table into perspective-viewer
    async load_table(table, computed = false) {
        this.shadowRoot.querySelector("#app").classList.add("hide_message");
        this.setAttribute("updating", true);

        if (this._table && !computed) {
            this.removeAttribute("computed-columns");
        }
        this._clear_state();

        this._table = table;

        if (this.hasAttribute("computed-columns") && !computed) {
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
                return;
            }
        }

        let [cols, schema, computed_schema] = await Promise.all([table.columns(), table.schema(), table.computed_schema()]);

        // TODO: separate DOM into helper methods?
        this._inactive_columns.innerHTML = "";
        this._active_columns.innerHTML = "";

        this._initial_col_order = cols.slice();
        if (!this.hasAttribute("columns")) {
            this.setAttribute("columns", JSON.stringify(this._initial_col_order));
        }

        let type_order = {integer: 2, string: 0, float: 3, boolean: 4, datetime: 1};

        // Sort columns by type and then name
        cols.sort((a, b) => {
            let s1 = type_order[schema[a]],
                s2 = type_order[schema[b]];
            let r = 0;
            if (s1 == s2) {
                let a1 = a.toLowerCase(),
                    b1 = b.toLowerCase();
                r = a1 < b1 ? -1 : 1;
            } else {
                r = s1 < s2 ? -1 : 1;
            }
            return r;
        });

        // Update Aggregates.
        let aggregates = [];
        const found = {};

        if (this.hasAttribute("aggregates")) {
            // Double check that the persisted aggregates actually match the
            // expected types.
            aggregates = this.get_aggregate_attribute()
                .map(col => {
                    let _type = schema[col.column];
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

        this.set_aggregate_attribute(aggregates);

        // Update column rows.
        let shown = JSON.parse(this.getAttribute("columns") || "[]").filter(x => cols.indexOf(x) > -1);

        // strip computed columns from sorted columns & schema - place at end
        if (!_.isEmpty(computed_schema)) {
            const computed_columns = _.keys(computed_schema);
            for (let i = 0; i < computed_columns.length; i++) {
                const cc = computed_columns[i];
                if (cols.includes(cc)) {
                    cols.splice(cols.indexOf(cc), 1);
                }
                if (_.has(schema, cc)) {
                    delete schema[cc];
                }
            }
        }

        const computed_cols = _.pairs(computed_schema);

        if (!this.hasAttribute("columns") || shown.length === 0) {
            for (let x of cols) {
                let aggregate = aggregates.filter(a => a.column === x).map(a => a.op)[0];
                let row = this.new_row(x, schema[x], aggregate);
                this._inactive_columns.appendChild(row);
            }

            // fixme better approach please
            for (let cc of computed_cols) {
                let cc_data = this._format_computed_data(cc);
                let aggregate = aggregates.filter(a => a.column === cc_data.column_name).map(a => a.op)[0];
                let row = this.new_row(cc_data.column_name, cc_data.type, aggregate, null, null, cc_data);
                this._inactive_columns.appendChild(row);
            }

            this._set_column_defaults();
            shown = JSON.parse(this.getAttribute("columns") || "[]").filter(x => cols.indexOf(x) > -1);
            for (let x in cols) {
                if (shown.indexOf(x) !== -1) {
                    this._inactive_columns.children[x].classList.add("active");
                }
            }
        } else {
            for (let x of cols) {
                let aggregate = aggregates.filter(a => a.column === x).map(a => a.op)[0];
                let row = this.new_row(x, schema[x], aggregate);
                this._inactive_columns.appendChild(row);
                if (shown.includes(x)) {
                    row.classList.add("active");
                }
            }

            // fixme better approach please
            for (let cc of computed_cols) {
                let cc_data = this._format_computed_data(cc);
                let aggregate = aggregates.filter(a => a.column === cc_data.column_name).map(a => a.op)[0];
                let row = this.new_row(cc_data.column_name, cc_data.type, aggregate, null, null, cc_data);
                this._inactive_columns.appendChild(row);
                if (shown.includes(cc)) {
                    row.classList.add("active");
                }
            }

            for (let x of shown) {
                let active_row = this.new_row(x, schema[x]);
                this._active_columns.appendChild(active_row);
            }
        }

        if (cols.length === shown.length) {
            this._inactive_columns.parentElement.classList.add("collapse");
        } else {
            this._inactive_columns.parentElement.classList.remove("collapse");
        }

        this.shadowRoot.querySelector("#columns_container").style.visibility = "visible";
        this.shadowRoot.querySelector("#side_panel__actions").style.visibility = "visible";

        this.filters = this.getAttribute("filters");
        await this._debounce_update();
    }

    new_row(name, type, aggregate, filter, sort, computed) {
        let row = document.createElement("perspective-row");

        if (!type) {
            let all = this._get_view_dom_columns("#inactive_columns perspective-row");
            if (all.length > 0) {
                type = all.find(x => x.getAttribute("name") === name);
                if (type) {
                    type = type.getAttribute("type");
                } else {
                    type = "integer";
                }
            } else {
                type = "";
            }
        }

        if (!aggregate) {
            let aggregates = this.get_aggregate_attribute();
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
            row.setAttribute("filter", filter);
            if (type === "string") {
                const v = this._table.view({row_pivot: [name], aggregate: []});
                v.to_json().then(json => {
                    row.choices(json.slice(1, json.length).map(x => x.__ROW_PATH__));
                    v.delete();
                });
            }
        }

        if (sort) {
            row.setAttribute("sort-order", sort);
        } else {
            row.setAttribute("sort-order", "asc");
        }

        row.setAttribute("type", type);
        row.setAttribute("name", name);
        row.setAttribute("aggregate", aggregate);

        row.addEventListener("visibility-clicked", column_visibility_clicked.bind(this));
        row.addEventListener("aggregate-selected", column_aggregate_clicked.bind(this));
        row.addEventListener("filter-selected", column_filter_clicked.bind(this));
        row.addEventListener("close-clicked", event => undrag.call(this, event.detail));
        row.addEventListener("row-drag", () => {
            this.classList.add("dragging");
            this._original_index = Array.prototype.slice.call(this._active_columns.children).findIndex(x => x.getAttribute("name") === name);
            if (this._original_index !== -1) {
                this._drop_target_hover = this._active_columns.children[this._original_index];
                setTimeout(() => row.setAttribute("drop-target", true));
            } else {
                this._drop_target_hover = this.new_row(name, type, aggregate);
            }
        });
        row.addEventListener("sort-order", sort_order_clicked.bind(this));
        row.addEventListener("row-dragend", () => this.classList.remove("dragging"));

        if (computed) {
            row.setAttribute("computed_column", JSON.stringify(computed));
            row.classList.add("computed");
        }

        return row;
    }

    async _viewer_update(ignore_size_check = false) {
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

        if (ignore_size_check === false && this._show_warnings === true && this._plugin.max_size !== undefined) {
            // validate that the render does not slow down the browser
            const num_columns = await this._view.num_columns();
            const num_rows = await this._view.num_rows();
            const count = num_columns * num_rows;
            if (count >= this._plugin.max_size) {
                this._plugin_information.classList.remove("hidden");
                this.removeAttribute("updating");
                return;
            }
        }

        this._view.on_update(() => {
            if (!this._debounced) {
                let view_count = document.getElementsByTagName("perspective-viewer").length;
                let timeout = this.getAttribute("render_time") * view_count * 2;
                timeout = Math.min(10000, Math.max(0, timeout));
                this._debounced = setTimeout(() => {
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
                    updater
                        .call(this, this._datavis, this._view, task)
                        .then(() => {
                            timer();
                            task.cancel();
                        })
                        .catch(err => {
                            console.error("Error rendering plugin.", err);
                        })
                        .finally(() => this.dispatchEvent(new Event("perspective-view-update")));
                }, timeout || 0);
            }
        });

        const timer = this._render_time();
        this._render_count = (this._render_count || 0) + 1;
        if (this._task) {
            this._task.cancel();
        }
        const task = (this._task = new CancelTask(() => {
            this._render_count--;
        }));
        task.initial = true;

        await this._plugin.create
            .call(this, this._datavis, this._view, task)
            .catch(err => {
                console.warn(err);
            })
            .finally(() => {
                if (!this.hasAttribute("render_time")) {
                    this.dispatchEvent(new Event("perspective-view-update"));
                }
                timer();
                task.cancel();
                if (this._render_count === 0) {
                    this.removeAttribute("updating");
                }
            });
    }

    _fill_numeric(cols, pref, bypass = false) {
        for (let col of cols) {
            let type = col.getAttribute("type");
            let name = col.getAttribute("name");
            if (bypass || (["float", "integer"].indexOf(type) > -1 && pref.indexOf(name) === -1)) {
                pref.push(name);
            }
        }
    }

    _render_time() {
        const t = performance.now();
        return () => this.setAttribute("render_time", performance.now() - t);
    }

    get _plugin() {
        let current_renderers = renderers.getInstance();
        let view = this.getAttribute("view");
        if (!view) {
            view = Object.keys(current_renderers)[0];
        }
        this.setAttribute("view", view);
        return current_renderers[view] || current_renderers[Object.keys(current_renderers)[0]];
    }

    _set_column_defaults() {
        let cols = this._get_view_dom_columns("#inactive_columns perspective-row");
        let current_cols = this._get_view_dom_columns();
        if (cols.length > 0) {
            if (this._plugin.initial) {
                let pref = [];
                let count = this._plugin.initial.count || 2;
                if (current_cols.length === count) {
                    pref = current_cols.map(x => x.getAttribute("name"));
                } else if (current_cols.length < count) {
                    pref = current_cols.map(x => x.getAttribute("name"));
                    this._fill_numeric(cols, pref);
                    if (pref.length < count) {
                        this._fill_numeric(cols, pref, true);
                    }
                } else {
                    if (this._plugin.initial.type === "number") {
                        this._fill_numeric(current_cols, pref);
                        if (pref.length < count) {
                            this._fill_numeric(cols, pref);
                        }
                        if (pref.length < count) {
                            this._fill_numeric(cols, pref, true);
                        }
                    }
                }
                this.setAttribute("columns", JSON.stringify(pref.slice(0, count)));
            } else if (this._plugin.selectMode === "select") {
                this.setAttribute("columns", JSON.stringify([cols[0].getAttribute("name")]));
            }
        }
    }

    // UI action
    _toggle_config() {
        if (this._show_config) {
            this._side_panel.style.display = "none";
            this._top_panel.style.display = "none";
            this.removeAttribute("settings");
        } else {
            this._side_panel.style.display = "flex";
            this._top_panel.style.display = "flex";
            this.setAttribute("settings", true);
        }
        this._show_config = !this._show_config;
        this._plugin.resize.call(this, true);
        this.dispatchEvent(new CustomEvent("perspective-toggle-settings", {detail: this._show_config}));
    }

    // get viewer state
    _get_view_dom_columns(selector, callback) {
        selector = selector || "#active_columns perspective-row";
        let columns = Array.prototype.slice.call(this.shadowRoot.querySelectorAll(selector));
        if (!callback) {
            return columns;
        }
        return columns.map(callback);
    }

    _get_view_columns({active = true} = {}) {
        let selector;
        if (active) {
            selector = "#active_columns perspective-row";
        } else {
            selector = "#inactive_columns perspective-row";
        }
        return this._get_view_dom_columns(selector, col => {
            return col.getAttribute("name");
        });
    }

    _get_view_aggregates(selector) {
        selector = selector || "#active_columns perspective-row";
        return this._get_view_dom_columns(selector, s => {
            return {
                op: s.getAttribute("aggregate"),
                column: s.getAttribute("name")
            };
        });
    }

    _get_view_row_pivots() {
        return this._get_view_dom_columns("#row_pivots perspective-row", col => {
            return col.getAttribute("name");
        });
    }

    _get_view_column_pivots() {
        return this._get_view_dom_columns("#column_pivots perspective-row", col => {
            return col.getAttribute("name");
        });
    }

    _get_view_filters() {
        return this._get_view_dom_columns("#filters perspective-row", col => {
            let {operator, operand} = JSON.parse(col.getAttribute("filter"));
            return [col.getAttribute("name"), operator, operand];
        });
    }

    _get_view_sorts() {
        return this._get_view_dom_columns("#sort perspective-row", col => {
            let order = col.getAttribute("sort-order") || "asc";
            return [col.getAttribute("name"), order];
        });
    }

    _get_view_hidden(aggregates, sort) {
        aggregates = aggregates || this._get_view_aggregates();
        let hidden = [];
        sort = sort || this._get_view_sorts();
        for (let s of sort) {
            if (aggregates.map(agg => agg.column).indexOf(s[0]) === -1) {
                hidden.push(s[0]);
            }
        }
        return hidden;
    }

    _get_visible_column_count() {
        return this._get_view_dom_columns().length;
    }

    // FIXME: move to state_read
    get_aggregate_attribute() {
        const aggs = JSON.parse(this.getAttribute("aggregates")) || {};
        return Object.keys(aggs).map(col => ({column: col, op: aggs[col]}));
    }

    // FIXME: move to state_apply
    set_aggregate_attribute(aggs) {
        this.setAttribute(
            "aggregates",
            JSON.stringify(
                aggs.reduce((obj, agg) => {
                    obj[agg.column] = agg.op;
                    return obj;
                }, {})
            )
        );
    }

    // clears view state - state-related action
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

    // edits state
    _update_column_view(columns, reset = false) {
        if (!columns) {
            columns = this._get_view_columns();
        }
        this.setAttribute("columns", JSON.stringify(columns));
        const lis = this._get_view_dom_columns("#inactive_columns perspective-row");
        if (columns.length === lis.length) {
            this._inactive_columns.parentElement.classList.add("collapse");
        } else {
            this._inactive_columns.parentElement.classList.remove("collapse");
        }
        lis.forEach(x => {
            const index = columns.indexOf(x.getAttribute("name"));
            if (index === -1) {
                x.classList.remove("active");
            } else {
                x.classList.add("active");
            }
        });
        if (reset) {
            this._active_columns.innerHTML = "";
            columns.map(y => {
                let ref = lis.find(x => x.getAttribute("name") === y);
                if (ref) {
                    this._active_columns.appendChild(this.new_row(ref.getAttribute("name"), ref.getAttribute("type")));
                }
            });
        }
    }

    // Computed Columns
    _format_computed_data(cc) {
        return {
            column_name: cc[0],
            input_columns: cc[1].input_columns,
            input_type: cc[1].input_type,
            computation: cc[1].computation,
            type: cc[1].type
        };
    }

    // UI action
    _open_computed_column(event) {
        //const data = event.detail;
        event.stopImmediatePropagation();
        /*if (event.type === 'perspective-computed-column-edit') {
            this._computed_column._edit_computed_column(data);
        }*/
        this._computed_column.style.display = "flex";
        this._side_panel_actions.style.display = "none";
    }

    // edits state
    _set_computed_column_input(event) {
        event.detail.target.appendChild(this.new_row(event.detail.column.name, event.detail.column.type));
        this._update_column_view();
    }

    // edits state
    _validate_computed_column(event) {
        const new_column = event.detail;
        let computed_columns = JSON.parse(this.getAttribute("computed-columns"));
        if (computed_columns === null) {
            computed_columns = [];
        }
        // names cannot be duplicates
        for (let col of computed_columns) {
            if (new_column.name === col.name) {
                return;
            }
        }
        computed_columns.push(new_column);
        this.setAttribute("computed-columns", JSON.stringify(computed_columns));
    }

    // edits state, calls reload
    async _create_computed_column(event) {
        const data = event.detail;
        let computed_column_name = data.column_name;

        const cols = await this._table.columns();
        // edit overwrites last column, otherwise avoid name collision
        if (cols.includes(computed_column_name)) {
            console.log(computed_column_name);
            computed_column_name += ` ${Math.round(Math.random() * 100)}`;
        }

        const params = [
            {
                computation: data.computation,
                column: computed_column_name,
                func: data.computation.func,
                inputs: data.input_columns.map(col => col.name),
                input_type: data.computation.input_type,
                type: data.computation.return_type
            }
        ];

        const table = this._table.add_computed(params);
        await this.load_table(table, true);
        this._update_column_view();
    }

    // edits state
    _transpose() {
        let row_pivots = this.getAttribute("row-pivots");
        this.setAttribute("row-pivots", this.getAttribute("column-pivots"));
        this.setAttribute("column-pivots", row_pivots);
    }

    // setup functions
    _register_ids() {
        this._aggregate_selector = this.shadowRoot.querySelector("#aggregate_selector");
        this._vis_selector = this.shadowRoot.querySelector("#vis_selector");
        this._filters = this.shadowRoot.querySelector("#filters");
        this._row_pivots = this.shadowRoot.querySelector("#row_pivots");
        this._column_pivots = this.shadowRoot.querySelector("#column_pivots");
        this._datavis = this.shadowRoot.querySelector("#pivot_chart");
        this._active_columns = this.shadowRoot.querySelector("#active_columns");
        this._inactive_columns = this.shadowRoot.querySelector("#inactive_columns");
        this._side_panel_actions = this.shadowRoot.querySelector("#side_panel__actions");
        this._add_computed_column = this.shadowRoot.querySelector("#add-computed-column");
        this._computed_column = this.shadowRoot.querySelector("perspective-computed-column");
        this._computed_column_inputs = this._computed_column.querySelector("#psp-cc-computation-inputs");
        this._inner_drop_target = this.shadowRoot.querySelector("#drop_target_inner");
        this._drop_target = this.shadowRoot.querySelector("#drop_target");
        this._config_button = this.shadowRoot.querySelector("#config_button");
        this._side_panel = this.shadowRoot.querySelector("#side_panel");
        this._top_panel = this.shadowRoot.querySelector("#top_panel");
        this._sort = this.shadowRoot.querySelector("#sort");
        this._transpose_button = this.shadowRoot.querySelector("#transpose_button");
        this._plugin_information = this.shadowRoot.querySelector(".plugin_information");
        this._plugin_information_action = this.shadowRoot.querySelector(".plugin_information__action");
        this._plugin_information_dismiss = this.shadowRoot.querySelector(".plugin_information__action--dismiss");
    }

    // most of these are drag and drop handlers - how to clean up?
    _register_callbacks() {
        this._sort.addEventListener("drop", drop.bind(this));
        this._sort.addEventListener("dragend", undrag.bind(this));
        this._sort.addEventListener("dragenter", drag_enter.bind(this));
        this._sort.addEventListener("dragover", allow_drop.bind(this));
        this._sort.addEventListener("dragleave", disallow_drop.bind(this));
        this._row_pivots.addEventListener("drop", drop.bind(this));
        this._row_pivots.addEventListener("dragend", undrag.bind(this));
        this._row_pivots.addEventListener("dragenter", drag_enter.bind(this));
        this._row_pivots.addEventListener("dragover", allow_drop.bind(this));
        this._row_pivots.addEventListener("dragleave", disallow_drop.bind(this));
        this._column_pivots.addEventListener("drop", drop.bind(this));
        this._column_pivots.addEventListener("dragend", undrag.bind(this));
        this._column_pivots.addEventListener("dragenter", drag_enter.bind(this));
        this._column_pivots.addEventListener("dragover", allow_drop.bind(this));
        this._column_pivots.addEventListener("dragleave", disallow_drop.bind(this));
        this._filters.addEventListener("drop", drop.bind(this));
        this._filters.addEventListener("dragend", undrag.bind(this));
        this._filters.addEventListener("dragenter", drag_enter.bind(this));
        this._filters.addEventListener("dragover", allow_drop.bind(this));
        this._filters.addEventListener("dragleave", disallow_drop.bind(this));
        this._active_columns.addEventListener("drop", column_drop.bind(this));
        this._active_columns.addEventListener("dragenter", drag_enter.bind(this));
        this._active_columns.addEventListener("dragend", column_undrag.bind(this));
        this._active_columns.addEventListener("dragover", column_dragover.bind(this));
        this._active_columns.addEventListener("dragleave", column_dragleave.bind(this));
        this._add_computed_column.addEventListener("click", this._open_computed_column.bind(this));
        this._computed_column.addEventListener("perspective-computed-column-save", this._validate_computed_column.bind(this));
        this._computed_column.addEventListener("perspective-computed-column-update", this._set_computed_column_input.bind(this));
        //this._side_panel.addEventListener('perspective-computed-column-edit', this._open_computed_column.bind(this));
        this._config_button.addEventListener("click", this._toggle_config.bind(this));
        this._transpose_button.addEventListener("click", this._transpose.bind(this));
        this._drop_target.addEventListener("dragover", allow_drop.bind(this));

        this._vis_selector.addEventListener("change", () => {
            this.setAttribute("view", this._vis_selector.value);
            this._debounce_update();
        });

        this._plugin_information_action.addEventListener("click", () => {
            this._debounce_update({ignore_size_check: true});
            this._plugin_information.classList.add("hidden");
        });
        this._plugin_information_dismiss.addEventListener("click", () => {
            this._debounce_update({ignore_size_check: true});
            this._plugin_information.classList.add("hidden");
            this._show_warnings = false;
        });
    }

    // sets state, manipulates DOM
    _register_view_options() {
        let current_renderers = renderers.getInstance();
        for (let name in current_renderers) {
            const display_name = current_renderers[name].name || name;
            const opt = `<option value="${name}">${display_name}</option>`;
            this._vis_selector.innerHTML += opt;
        }
    }

    // sets state
    _register_data_attribute() {
        // TODO this feature needs to become a real attribute.
        if (this.getAttribute("data")) {
            let data = this.getAttribute("data");
            try {
                data = JSON.parse(data);
            } catch (e) {}
            this.load(data);
        }
    }

    // setup for update
    _register_debounce_instance() {
        const _update = _.debounce((resolve, ignore_size_check) => {
            this._viewer_update(ignore_size_check).then(resolve);
        }, 10);
        this._debounce_update = async ({ignore_size_check = false} = {}) => {
            this.setAttribute("updating", true);
            await new Promise(resolve => _update(resolve, ignore_size_check));
        };
    }
}
