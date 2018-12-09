/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "@jpmorganchase/perspective";
import {undrag} from "./dragdrop.js";
import {renderers} from "./renderers.js";

import {PerspectiveElement} from "./perspective_element.js";

export class DomElement extends PerspectiveElement {
    _clear_columns() {
        this._inactive_columns.innerHTML = "";
        this._active_columns.innerHTML = "";
    }

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

    // Generates a new row in state + DOM
    _new_row(name, type, aggregate, filter, sort, computed) {
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
            if (this._get_view_column_pivots().indexOf(name) > -1) {
                row.setAttribute("sort-order", "col asc");
            } else {
                row.setAttribute("sort-order", "asc");
            }
        }

        row.setAttribute("type", type);
        row.setAttribute("name", name);
        row.setAttribute("aggregate", aggregate);

        row.addEventListener("visibility-clicked", this._column_visibility_clicked.bind(this));
        row.addEventListener("aggregate-selected", this._column_aggregate_clicked.bind(this));
        row.addEventListener("filter-selected", this._column_filter_clicked.bind(this));
        row.addEventListener("close-clicked", event => undrag.call(this, event.detail));
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
        row.addEventListener("row-dragend", () => this.classList.remove("dragging"));

        if (computed) {
            row.setAttribute("computed_column", JSON.stringify(computed));
            row.classList.add("computed");
        }

        return row;
    }

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
            this._update_column_list(columns, this._active_columns, name => {
                const ref = lis.find(x => x.getAttribute("name") === name);
                if (ref) {
                    return this._new_row(ref.getAttribute("name"), ref.getAttribute("type"));
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
            } else if (!accessor(name, col)) {
                if (next_col && accessor(name, next_col)) {
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

    _show_column_selectors() {
        this.shadowRoot.querySelector("#columns_container").style.visibility = "visible";
        this.shadowRoot.querySelector("#side_panel__actions").style.visibility = "visible";
    }

    // set viewer state
    _set_column_defaults() {
        let cols = this._get_view_dom_columns("#inactive_columns perspective-row");
        let active_cols = this._get_view_dom_columns();
        if (cols.length > 0) {
            if (this._plugin.initial) {
                let pref = [];
                let count = this._plugin.initial.count || 2;
                if (active_cols.length === count) {
                    pref = active_cols.map(x => x.getAttribute("name"));
                } else if (active_cols.length < count) {
                    pref = active_cols.map(x => x.getAttribute("name"));
                    this._fill_numeric(cols, pref);
                    if (pref.length < count) {
                        this._fill_numeric(cols, pref, true);
                    }
                } else {
                    if (this._plugin.initial.type === "number") {
                        this._fill_numeric(active_cols, pref);
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

    _fill_numeric(cols, pref, bypass = false) {
        for (let col of cols) {
            let type = col.getAttribute("type");
            let name = col.getAttribute("name");
            if (bypass || (["float", "integer"].indexOf(type) > -1 && pref.indexOf(name) === -1)) {
                pref.push(name);
            }
        }
    }

    _check_responsive_layout() {
        if (this.clientHeight < 500 && this._get_view_columns({active: false}).length > this._get_view_columns().length) {
            this.shadowRoot.querySelector("#app").classList.add("columns_horizontal");
        } else {
            this.shadowRoot.querySelector("#app").classList.remove("columns_horizontal");
        }
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
        this._reset_button = this.shadowRoot.querySelector("#reset_button");
        this._download_button = this.shadowRoot.querySelector("#download_button");
        this._copy_button = this.shadowRoot.querySelector("#copy_button");
        this._side_panel = this.shadowRoot.querySelector("#side_panel");
        this._top_panel = this.shadowRoot.querySelector("#top_panel");
        this._sort = this.shadowRoot.querySelector("#sort");
        this._transpose_button = this.shadowRoot.querySelector("#transpose_button");
        this._plugin_information = this.shadowRoot.querySelector(".plugin_information");
        this._plugin_information_action = this.shadowRoot.querySelector(".plugin_information__action");
        this._plugin_information_dismiss = this.shadowRoot.querySelector(".plugin_information__action--dismiss");
        this._plugin_information_message = this.shadowRoot.querySelector("#plugin_information_count");
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
}
