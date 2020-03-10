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
        let all = this._get_view_dom_columns("#inactive_columns perspective-row");
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
        const weights = this._get_view_dom_columns("#inactive_columns perspective-row")
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

            if (type === "string") {
                const view = this._table.view({row_pivots: [name], aggregates: {}});
                view.to_json().then(json => {
                    row.choices(this._autocomplete_choices(json));
                });
                view.delete();
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

        const weights = this._get_view_dom_columns("#inactive_columns perspective-row")
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
            this._active_columns.style.overflow = "hidden";
            this._original_index = Array.prototype.slice.call(this._active_columns.children).findIndex(x => x.getAttribute("name") === name);
            if (this._original_index !== -1) {
                this._drop_target_hover = this._active_columns.children[this._original_index];
                setTimeout(() => row.setAttribute("drop-target", true));
            } else {
                this._drop_target_hover = this._new_row(name, type, aggregate);
            }
        });
        row.addEventListener("row-dragend", () => {
            this._active_columns.style.overflow = "auto";
            this.classList.remove("dragging");
        });

        if (computed) {
            row.setAttribute("computed_column", JSON.stringify(computed));
            row.classList.add("computed");
        }

        return row;
    }

    /**
     * Using the view's schema and config, add all computed columns to the
     * inactive columns panel unless they are specified as shown.
     */
    async _update_computed_column_view() {
        // FIXME: bad bad not good
        if (!this._view) return;
        const [computed_schema, config] = await Promise.all([this._view.computed_schema(), this._view.get_config()]);
        const computed_columns = config.computed_columns;
        const columns = this._get_view_all_column_names();
        const active = this._get_view_active_column_names();
        const rp = this._get_view_row_pivots();
        const cp = this._get_view_column_pivots();
        const sort = this._get_view_sorts().map(x => x[0]);
        const filter = this._get_view_filters().map(x => x[0]);

        for (const cc of computed_columns) {
            const name = cc.column;
            // FIXME: so bad, so terrible
            const should_add = !columns.includes(name) && !active.includes(name) && !rp.includes(name) && !cp.includes(name) && !sort.includes(name) && !filter.includes(name);
            if (!should_add) continue;
            const row = this._new_row(name, computed_schema[name], null, null, null, name);
            // FIXME: this needs to follow the paradigm for adding columns to
            // the sidebar elsewhere, as it iscurrently broken if one `reset`s
            // the viewer and tries to pivot on the column.
            this._inactive_columns.appendChild(row);
        }
    }

    /**
     * When the `computed-columns` attribute is set to [], null, or undefined,
     * clear all previously created columns from the UI.
     */
    _reset_computed_column_view() {
        // FIXME: this needs to work properly
        const rows = this._inactive_columns.getElementsByClassName("computed");
        const names = [];

        for (const row of rows) {
            names.push(row.getAttribute("name"));
            this._inactive_columns.removeChild(row);
        }

        const active = this._get_view_active_column_names();
        const new_active = active.filter(x => !names.includes(x));

        if (new_active.length > 0) {
            this._update_column_view(new_active, true);
        } else {
            // FIXME: how do we reset to default state without using this
            this.reset();
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
        this.setAttribute("columns", JSON.stringify(columns));
        const pop_cols = columns.filter(x => typeof x !== "undefined" && x !== null);
        const lis = this._get_view_dom_columns("#inactive_columns perspective-row");
        if (pop_cols.length === lis.length) {
            this._inactive_columns.parentElement.classList.add("collapse");
        } else {
            this._inactive_columns.parentElement.classList.remove("collapse");
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
            this._update_column_list(columns, this._active_columns, name => {
                if (name === null) {
                    return this._new_row(null);
                } else {
                    const ref = lis.find(x => x.getAttribute("name") === name);
                    if (ref) {
                        return this._new_row(ref.getAttribute("name"), ref.getAttribute("type"));
                    }
                }
            });
        }
    }

    _update_column_list(columns, container, callback, accessor) {
        accessor = accessor || ((x, y) => y.getAttribute("name") === x);
        const active_columns = Array.prototype.slice.call(container.children);
        for (let i = 0, j = 0; i < active_columns.length || j < columns.length; i++, j++) {
            const name = columns[j];
            const col = active_columns[i];
            const next_col = active_columns[i + 1];
            if (!col) {
                const node = callback(name);
                if (node) {
                    container.appendChild(node);
                }
            } else if (typeof name === "undefined") {
                container.removeChild(col);
            } else if (accessor(name, col)) {
                this._set_row_type(col);
            } else {
                if (col.classList.contains("null-column")) {
                    const node = callback(name);
                    if (node) {
                        container.replaceChild(node, col);
                    }
                } else if (next_col && accessor(name, next_col)) {
                    container.removeChild(col);
                    i++;
                    //  j--;
                } else {
                    const node = callback(name);
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
                    return false;
                }
                return false;
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
            }
        }
        return false;
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
        this._add_computed_expression_button = this.shadowRoot.querySelector("#add-computed-expression");
        this._computed_expression_editor = this.shadowRoot.querySelector("perspective-computed-expression-editor");
        this._inner_drop_target = this.shadowRoot.querySelector("#drop_target_inner");
        this._drop_target = this.shadowRoot.querySelector("#drop_target");
        this._config_button = this.shadowRoot.querySelector("#config_button");
        this._reset_button = this.shadowRoot.querySelector("#reset_button");
        this._download_button = this.shadowRoot.querySelector("#download_button");
        this._copy_button = this.shadowRoot.querySelector("#copy_button");
        this._side_panel = this.shadowRoot.querySelector("#side_panel");
        this._top_panel = this.shadowRoot.querySelector("#top_panel");
        this._sort = this.shadowRoot.querySelector("#sort");
        this._transpose_button = this.shadowRoot.querySelector("#transpose_button");
        this._plugin_information = this.shadowRoot.querySelector(".plugin_information");
        this._plugin_information_action = this.shadowRoot.querySelector(".plugin_information__action");
        this._plugin_information_action_close = this.shadowRoot.querySelector(".plugin_information__action--close");
        this._plugin_information_message = this.shadowRoot.querySelector("#plugin_information_count");
        this._resize_bar = this.shadowRoot.querySelector("#resize_bar");
    }

    // sets state, manipulates DOM
    _register_view_options() {
        let current_renderers = renderers.getInstance();
        render(options(current_renderers), this._vis_selector);
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

    _autocomplete_choices(json) {
        return json
            .slice(1, json.length)
            .map(x => x.__ROW_PATH__)
            .filter(x => (Array.isArray(x) ? x.filter(v => !!v).length > 0 : !!x));
    }
}
