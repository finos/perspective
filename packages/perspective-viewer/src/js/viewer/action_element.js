/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {undrag, column_undrag, column_dragleave, column_dragover, column_drop, drop, drag_enter, allow_drop, disallow_drop} from "./dragdrop.js";

import {DomElement} from "./dom_element.js";

export class ActionElement extends DomElement {
    _show_context_menu(event) {
        this.shadowRoot.querySelector("#app").classList.toggle("show_menu");
        event.stopPropagation();
        event.preventDefault();
        return false;
    }

    _hide_context_menu() {
        this.shadowRoot.querySelector("#app").classList.remove("show_menu");
    }

    _toggle_config(event) {
        if (!event || event.button !== 2) {
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
            this._hide_context_menu();
            this.dispatchEvent(new CustomEvent("perspective-toggle-settings", {detail: this._show_config}));
        }
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
        event.detail.target.appendChild(this._new_row(event.detail.column.name, event.detail.column.type));
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
        await this._load_table(table, true);
        this._update_column_view();
    }

    _column_visibility_clicked(ev) {
        let parent = ev.currentTarget;
        let is_active = parent.parentElement.getAttribute("id") === "active_columns";
        if (is_active) {
            if (this._get_visible_column_count() === 1) {
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
            // check if we're manipulating computed column input
            if (ev.path && ev.path[1].classList.contains("psp-cc-computation__input-column")) {
                //  this._computed_column._register_inputs();
                this._computed_column.deselect_column(ev.currentTarget.getAttribute("name"));
                this._update_column_view();
                return;
            }
            if ((ev.detail.shiftKey && this._plugin.selectMode === "toggle") || (!ev.detail.shiftKey && this._plugin.selectMode === "select")) {
                for (let child of Array.prototype.slice.call(this._active_columns.children)) {
                    this._active_columns.removeChild(child);
                }
            }
            let row = this._new_row(parent.getAttribute("name"), parent.getAttribute("type"));
            this._active_columns.appendChild(row);
        }
        this._check_responsive_layout();
        let cols = this._get_view_columns();
        this._update_column_view(cols);
    }

    _column_aggregate_clicked() {
        let aggregates = this.get_aggregate_attribute();
        let new_aggregates = this._get_view_aggregates();
        for (let aggregate of aggregates) {
            let updated_agg = new_aggregates.find(x => x.column === aggregate.column);
            if (updated_agg) {
                aggregate.op = updated_agg.op;
            }
        }
        this.set_aggregate_attribute(aggregates);
        this._update_column_view();
        this._debounce_update();
    }

    _column_filter_clicked() {
        let new_filters = this._get_view_filters();
        this._updating_filter = true;
        this.setAttribute("filters", JSON.stringify(new_filters));
        this._updating_filter = false;
        this._debounce_update();
    }

    _sort_order_clicked(event) {
        event.target._increment_sort_order(this._get_view_column_pivots().length > 0, event.detail.shiftKey);
        let sort = JSON.parse(this.getAttribute("sort"));
        let new_sort = this._get_view_sorts();
        for (let s of sort) {
            let updated_sort = new_sort.find(x => x[0] === s[0]);
            if (updated_sort) {
                s[1] = updated_sort[1];
            }
        }
        this.setAttribute("sort", JSON.stringify(sort));
    }

    // edits state
    _transpose() {
        let row_pivots = this.getAttribute("row-pivots");
        this.setAttribute("row-pivots", this.getAttribute("column-pivots"));
        this.setAttribute("column-pivots", row_pivots);
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
        this._config_button.addEventListener("mousedown", this._toggle_config.bind(this));
        this._config_button.addEventListener("contextmenu", this._show_context_menu.bind(this));
        this._reset_button.addEventListener("click", this.reset.bind(this));
        this._copy_button.addEventListener("click", event => this.copy(event.shiftKey));
        this._download_button.addEventListener("click", event => this.download(event.shiftKey));
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
}
