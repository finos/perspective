/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {get_type_config} from "@finos/perspective/dist/esm/config";
import {dragend} from "./dragdrop.js";
import {renderers} from "./renderers.js";

import {PerspectiveElement} from "./perspective_element.js";
import {html, render} from "lit-html";

/**
 * Render `<option>` blocks
 * @param {*} names name objects
 */
const options = vals => {
    const opts = [];
    for (name in vals) {
        opts.push(html`
            <option value="${name}">${vals[name].name || name}</option>
        `);
    }
    return opts;
};

export class DomElement extends PerspectiveElement {
    _clear_columns() {
        this._inactive_columns.innerHTML = "";
        this._active_columns.innerHTML = "";
    }

    set_aggregate_attribute(aggs) {
        let is_set = false;
        let aggregates = aggs.reduce((obj, agg) => {
            if (this._aggregate_defaults[agg.column] !== agg.op) {
                obj[agg.column] = agg.op;
                is_set = true;
            }
            return obj;
        }, {});
        if (is_set) {
            this.setAttribute("aggregates", JSON.stringify(aggregates));
        } else {
            this.removeAttribute("aggregates");
        }
    }

    _get_type(name) {
        let all = this._get_view_inactive_columns();
        if (all.length > 0) {
            const type = all.find(x => x.getAttribute("name") === name);
            if (type) {
                return type.getAttribute("type");
            } else {
                return "integer";
            }
        } else {
            return "";
        }
    }

    _set_row_type(row) {
        const weights = this._get_view_inactive_columns()
            .filter(x => x.getAttribute("type") === "integer" || x.getAttribute("type") === "float")
            .map(x => x.getAttribute("name"));
        row.set_weights(weights);
        row.setAttribute("type", this._get_type(row.getAttribute("name")));
    }

    // Generates a new row in state + DOM
    _new_row(name, type, aggregate, filter, sort, computed) {
        let row = document.createElement("perspective-row");
        type = type || this._get_type(name);

        if (!aggregate) {
            let aggregates = this.get_aggregate_attribute();
            if (aggregates) {
                aggregate = aggregates.find(x => x.column === name);
                if (aggregate) {
                    aggregate = aggregate.op;
                } else {
                    aggregate = get_type_config(type).aggregate;
                }
            } else {
                aggregate = get_type_config(type).aggregate;
            }
        }

        if (filter) {
            row.setAttribute("filter", filter);

            if (type === "string" || type === "date" || type === "datetime") {
                // Get all unique values for the column - because all options
                // must be valid column names, recreate computed columns
                // if the filter column is a computed column.
                const computed_columns = this._get_view_parsed_computed_columns();
                const computed_names = computed_columns.map(x => x.column);

                // If `name` is in computed columns, recreate the current
                // viewer's computed columns.
                this._table
                    .view({
                        row_pivots: [name],
                        columns: [],
                        computed_columns: computed_names.includes(name) ? computed_columns : []
                    })
                    .then(async view => {
                        // set as a property so we can delete it after the
                        // autocomplete choices are set.
                        this._filter_view = view;
                        let nrows = await view.num_rows();

                        if (nrows < 100000) {
                            // Autocomplete
                            const json = await view.to_json({
                                end_row: 10
                            });
                            row.choices(this._autocomplete_choices(json, type));
                        } else {
                            console.warn(`perspective-viewer did not generate autocompletion results - ${nrows} is greater than limit of 100,000 rows.`);
                        }
                    })
                    .finally(() => {
                        // Clean up the View on the Emscripten heap.
                        this._filter_view?.delete();
                        delete this._filter_view;
                    });
            }
        }

        if (sort) {
            row.setAttribute("sort-order", sort);
        } else {
            if (this._get_view_column_pivots().indexOf(name) > -1) {
                row.setAttribute("sort-order", "col asc");
            } else {
                row.setAttribute("sort-order", "asc");
            }
        }

        const weights = this._get_view_inactive_columns()
            .filter(x => x.getAttribute("type") === "integer" || x.getAttribute("type") === "float")
            .map(x => x.getAttribute("name"));
        row.set_weights(weights);

        if (name === null) {
            row.classList.add("null-column");
        } else {
            row.setAttribute("type", type);
            row.setAttribute("name", name);
        }

        row.setAttribute("aggregate", Array.isArray(aggregate) ? JSON.stringify(aggregate) : aggregate);

        row.addEventListener("visibility-clicked", this._column_visibility_clicked.bind(this));
        row.addEventListener("aggregate-selected", this._column_aggregate_clicked.bind(this));
        row.addEventListener("filter-selected", this._column_filter_clicked.bind(this));
        row.addEventListener("close-clicked", event => dragend.call(this, event.detail));
        row.addEventListener("sort-order", this._sort_order_clicked.bind(this));

        row.addEventListener("row-drag", () => {
            this.classList.add("dragging");
            this._original_index = Array.prototype.slice.call(this._active_columns.children).findIndex(x => x.getAttribute("name") === name);
            if (this._original_index !== -1) {
                this._drop_target_hover = this._active_columns.children[this._original_index];
                setTimeout(() => row.setAttribute("drop-target", true));
            } else {
                this._drop_target_hover = this._new_row(name, type, aggregate);
            }
        });
        row.addEventListener("row-dragend", () => {
            this.classList.remove("dragging");
        });

        if (computed) {
            row.setAttribute("computed_column", JSON.stringify(computed));
            row.classList.add("computed");
        }

        return row;
    }

    /**
     * Using a computed schema generated in the attribute callback, add
     * computed columns to the inactive columns area if they're not specified
     * to be inserted anywhere else in the UI.
     */
    _update_computed_column_view(computed_schema) {
        const computed_columns = this._get_view_parsed_computed_columns();
        const columns = this._get_view_all_column_names();
        const active = this._get_view_active_column_names();

        if (Object.keys(computed_schema).length === 0 || computed_columns.length === 0) {
            return;
        }

        let added_count = 0;

        const attr = JSON.parse(this.getAttribute("columns")) || [];
        let reset_columns_attr = false;

        for (const cc of computed_columns) {
            const name = cc.column;

            // Check for whether the computed column is in the attribute but
            // NOT in the DOM - occurs when restore is called and a race
            // condition between `computed-columns` and `columns` occurs.
            const should_reset = !columns.includes(name) && attr.includes(name);

            if (should_reset) {
                reset_columns_attr = true;
            }

            // If the column already exists or is already in the active DOM,
            // don't add it to the inactive DOM
            const should_add = !columns.includes(name) && !active.includes(name);

            if (!should_add) {
                continue;
            }

            const row = this._new_row(name, computed_schema[name], null, null, null, name);
            this._inactive_columns.insertBefore(row, this._inactive_columns.childNodes[0] || null);
            added_count++;
        }

        if (reset_columns_attr) {
            this._update_column_view(attr, true);
        } else {
            // Remove collapse so that new inactive columns show up
            if (added_count > 0 && this._columns_container.classList.contains("collapse")) {
                this._columns_container.classList.remove("collapse");
            }
        }
    }

    /**
     * Given two sets of computed columns, remove columns that are present in
     * `old_computed_columns` but not `new_computed_columns`, and return a
     * list of computed column definitions to remove.
     *
     * @param {*} old_computed_columns
     * @param {*} new_computed_columns
     */
    _diff_computed_column_view(old_computed_columns, new_computed_columns) {
        const to_remove = [];
        const new_names = new_computed_columns.map(x => x.column);
        for (const column of old_computed_columns) {
            if (!new_names.includes(column.column)) {
                to_remove.push(column);
            }
        }
        return to_remove;
    }

    /**
     * When the `computed-columns` attribute is set to [], null, or undefined,
     * clear all previously created columns from the UI.
     */
    _reset_computed_column_view(computed_columns) {
        if (!computed_columns || computed_columns.length === 0) {
            return;
        }

        const computed_names = computed_columns.map(x => x.column);

        // Remove computed columns from all
        const filtered_active = this._get_view_active_column_names().filter(x => !computed_names.includes(x));

        const aggregates = this._get_view_aggregates().filter(x => !computed_names.includes(x.column));
        const rp = this._get_view_row_pivots().filter(x => !computed_names.includes(x));
        const cp = this._get_view_column_pivots().filter(x => !computed_names.includes(x));
        const sort = this._get_view_sorts().filter(x => !computed_names.includes(x[0]));
        const filters = this._get_view_filters().filter(x => !computed_names.includes(x[0]));

        // Aggregates as an array is from the attribute API
        this.set_aggregate_attribute(aggregates);

        this.setAttribute("columns", JSON.stringify(filtered_active));
        this.setAttribute("row-pivots", JSON.stringify(rp));
        this.setAttribute("column-pivots", JSON.stringify(cp));
        this.setAttribute("sort", JSON.stringify(sort));
        this.setAttribute("filters", JSON.stringify(filters));

        // Remove inactive computed columns
        const inactive_computed = this._get_view_all_columns().filter(x => x.classList.contains("computed"));

        for (const col of inactive_computed) {
            this._inactive_columns.removeChild(col);
        }

        // Re-check on whether to collapse inactive columns
        const pop_cols = this._get_view_active_columns().filter(x => typeof x !== "undefined" && x !== null);
        const lis = this._get_view_inactive_columns();

        if (pop_cols.length === lis.length) {
            this._columns_container.classList.add("collapse");
        } else {
            this._columns_container.classList.remove("collapse");
        }
    }

    _update_column_view(columns, reset = false) {
        if (!columns) {
            columns = this._get_view_active_column_names();
        }

        if (this._plugin.initial && this._plugin.initial.names) {
            while (columns.length < this._plugin.initial.names.length) {
                columns.push(null);
            }
        }

        // If columns were not passed in, this is needed to keep the attribute
        // API in sync with DOM state.
        this.setAttribute("columns", JSON.stringify(columns));

        const pop_cols = columns.filter(x => typeof x !== "undefined" && x !== null);
        const lis = this._get_view_inactive_columns();
        if (pop_cols.length === lis.length) {
            this._columns_container.classList.add("collapse");
        } else {
            this._columns_container.classList.remove("collapse");
        }
        lis.forEach(x => {
            const index = pop_cols.indexOf(x.getAttribute("name"));
            if (index === -1) {
                x.classList.remove("active");
            } else {
                x.classList.add("active");
            }
        });
        if (reset) {
            this._update_column_list(columns, this._active_columns, (name, computed_names) => {
                if (name === null) {
                    return this._new_row(null);
                } else {
                    const ref = lis.find(x => x.getAttribute("name") === name);
                    if (ref) {
                        const name = ref.getAttribute("name");
                        let computed;
                        if (computed_names.includes(name)) {
                            computed = name;
                        }
                        return this._new_row(name, ref.getAttribute("type"), undefined, undefined, undefined, computed);
                    }
                }
            });
        }
    }

    _update_column_list(columns, container, callback, accessor) {
        accessor = accessor || ((x, y) => y.getAttribute("name") === x);
        const active_columns = Array.prototype.slice.call(container.children);

        // Make sure that the `computed` attribute is set on computed columns
        const computed_columns = this._get_view_parsed_computed_columns();
        const computed_names = computed_columns.map(x => x.column);

        for (let i = 0, j = 0; i < active_columns.length || j < columns.length; i++, j++) {
            const name = columns[j];
            const col = active_columns[i];
            const next_col = active_columns[i + 1];
            if (!col) {
                const node = callback(name, computed_names);
                if (node) {
                    container.appendChild(node);
                }
            } else if (typeof name === "undefined") {
                container.removeChild(col);
            } else if (accessor(name, col)) {
                this._set_row_type(col);
            } else {
                if (col.classList.contains("null-column")) {
                    const node = callback(name, computed_names);
                    if (node) {
                        container.replaceChild(node, col);
                    }
                } else if (next_col && accessor(name, next_col)) {
                    container.removeChild(col);
                    i++;
                    //  j--;
                } else {
                    const node = callback(name, computed_names);
                    if (node) {
                        container.insertBefore(node, col);
                        i--;
                    }
                }
            }
        }
    }

    _set_row_styles() {
        let style = "";
        if (this._plugin.initial && this._plugin.initial.names) {
            for (const nidx in this._plugin.initial.names) {
                const name = this._plugin.initial.names[nidx];
                style += `#active_columns perspective-row:nth-child(${parseInt(nidx) + 1}){margin-top:23px;}`;
                style += `#active_columns perspective-row:nth-child(${parseInt(nidx) + 1}):before{content:"${name}";}`;
            }
        }
        this.shadowRoot.querySelector("#psp_styles").innerHTML = style;
    }

    _show_column_container() {
        this.shadowRoot.querySelector("#columns_container").style.visibility = "visible";
    }

    _show_side_panel_actions() {
        this.shadowRoot.querySelector("#side_panel__actions").style.visibility = "visible";
    }

    _remove_null_columns(since_index = 0) {
        const elems = this._get_view_active_columns();
        while (++since_index < elems.length) {
            const elem = elems[since_index];
            if (elem.classList.contains("null-column")) {
                this.shadowRoot.querySelector("#active_columns").removeChild(elem);
            }
        }
    }

    _set_column_defaults() {
        const cols = this._get_view_all_columns();
        const active_cols = this._get_view_active_valid_columns();
        const valid_active_cols = this._get_view_active_valid_column_names();
        if (cols.length > 0) {
            if (this._plugin.initial) {
                let pref = [];
                let count = this._plugin.initial.count || 2;
                this._fill_numeric(active_cols, pref);
                this._fill_numeric(cols, pref);
                this._fill_numeric(cols, pref, true);
                pref = pref.slice(0, count);
                const labels = this._plugin.initial.names;
                while (labels && pref.length < labels.length) {
                    pref.push(null);
                }
                this.setAttribute("columns", JSON.stringify(pref));
            } else if (this._plugin.selectMode === "select") {
                this.setAttribute("columns", JSON.stringify([cols[0].getAttribute("name")]));
            } else {
                this.setAttribute("columns", JSON.stringify(valid_active_cols));
                this._remove_null_columns();
            }
        }
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

    async _check_responsive_layout() {
        if (this.shadowRoot) {
            const app = this.shadowRoot.querySelector("#app");
            if (this.clientHeight < 500 && this.clientWidth > 600 && this._get_view_columns({active: false}).length > this._get_view_columns().length) {
                if (!app.classList.contains("columns_horizontal")) {
                    const old = this._persisted_side_panel_width;
                    this._persisted_side_panel_width = this._side_panel.style.width;
                    this._side_panel.style.width = old || "";
                    app.classList.add("columns_horizontal");
                }
            } else if (app.classList.contains("columns_horizontal")) {
                const panel = this.shadowRoot.querySelector("#pivot_chart_container");
                panel.clientWidth + this._side_panel.clientWidth;
                const width = this._persisted_side_panel_width || panel.clientWidth + this._side_panel.clientWidth / 2;
                const height = panel.clientHeight + 50;
                await this._pre_resize(width, height, () => {
                    const old = this._persisted_side_panel_width;
                    this._persisted_side_panel_width = this._side_panel.style.width;
                    this._side_panel.style.width = old || "";
                    app.classList.remove("columns_horizontal");
                });
                return true;
            } else if (this.clientWidth < 600) {
                if (!app.classList.contains("narrow")) {
                    app.classList.add("narrow");
                }
            } else if (app.classList.contains("narrow")) {
                app.classList.remove("narrow");
            }
            return false;
        }
        return false;
    }

    // setup functions
    _register_ids() {
        this._app = this.shadowRoot.querySelector("#app");
        this._aggregate_selector = this.shadowRoot.querySelector("#aggregate_selector");
        this._vis_selector = this.shadowRoot.querySelector("#vis_selector");
        this._filters = this.shadowRoot.querySelector("#filters");
        this._row_pivots = this.shadowRoot.querySelector("#row_pivots");
        this._column_pivots = this.shadowRoot.querySelector("#column_pivots");
        this._datavis = this.shadowRoot.querySelector("#pivot_chart");
        this._active_columns = this.shadowRoot.querySelector("#active_columns");
        this._inactive_columns = this.shadowRoot.querySelector("#inactive_columns");
        this._side_panel_actions = this.shadowRoot.querySelector("#side_panel__actions");
        this._add_computed_expression_button = this.shadowRoot.querySelector("#add-computed-expression");
        this._computed_expression_widget = this.shadowRoot.querySelector("perspective-computed-expression-widget");
        this._side_panel = this.shadowRoot.querySelector("#side_panel");
        this._top_panel = this.shadowRoot.querySelector("#top_panel");
        this._sort = this.shadowRoot.querySelector("#sort");
        this._transpose_button = this.shadowRoot.querySelector("#transpose_button");
        this._plugin_information = this.shadowRoot.querySelector(".plugin_information");
        this._plugin_information_action = this.shadowRoot.querySelector(".plugin_information__action");
        this._plugin_information_message = this.shadowRoot.querySelector("#plugin_information_count");
        this._columns_container = this.shadowRoot.querySelector("#columns_container");
        this._vieux = this.shadowRoot.querySelector("perspective-vieux");
    }

    // sets state, manipulates DOM
    _register_view_options() {
        let current_renderers = renderers.getInstance();
        render(options(current_renderers), this._vis_selector);
    }

    _autocomplete_choices(json, type) {
        const choices = [];
        const type_config = get_type_config(type);

        for (let i = 1; i < json.length; i++) {
            const row_path = json[i].__ROW_PATH__;
            if (Array.isArray(row_path) && row_path.length > 0 && row_path[0]) {
                let choice = row_path[0];

                if (type === "date" || type === "datetime") {
                    choice = new Date(choice);
                    choice = choice.toLocaleString("en-US", type_config.format);
                }

                choices.push(choice);
            }
        }
        return choices;
    }
}
