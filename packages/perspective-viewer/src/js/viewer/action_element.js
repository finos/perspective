/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {dragend, column_dragend, column_dragleave, column_dragover, column_drop, drop, dragenter, dragover, dragleave} from "./dragdrop.js";

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

    async _toggle_config(event) {
        if (!event || event.button !== 2) {
            this._show_config = !this._show_config;
            this._hide_context_menu();
            const panel = this.shadowRoot.querySelector("#pivot_chart_container");
            if (!this._show_config) {
                await this._pre_resize(
                    panel.clientWidth + this._side_panel.clientWidth,
                    panel.clientHeight + this._top_panel.clientHeight,
                    () => {
                        this._side_panel.style.display = "none";
                        this._top_panel.style.display = "none";
                        this.removeAttribute("settings");
                    },
                    () => this.dispatchEvent(new CustomEvent("perspective-toggle-settings", {detail: this._show_config}))
                );
            } else {
                await this._post_resize(
                    () => {
                        this.toggleAttribute("settings", true);
                    },
                    () => {
                        this._side_panel.style.display = "flex";
                        this._top_panel.style.display = "flex";
                        this.dispatchEvent(new CustomEvent("perspective-toggle-settings", {detail: this._show_config}));
                    }
                );
            }
        }
    }

    /**
     * Given a targe `width` and `height`, pre-size the plugin before modifying
     * the HTML to reduce visual tearing.
     *
     * @private
     * @param {*} width
     * @param {*} height
     * @param {*} post Function to run once action is complete
     * @param {*} [pre=undefined] Function to run once visual effects have been
     * applied.  This may be before `post`, as pre-sizing will be delayed when
     * the target size is a sub-window of the current view.
     * @memberof ActionElement
     */
    async _pre_resize(width, height, post, pre = undefined) {
        this._datavis.style.width = `${width}px`;
        this._datavis.style.height = `${height}px`;
        try {
            if (!document.hidden && this.offsetParent) {
                await this._plugin.resize.call(this);
            }
        } finally {
            pre?.();
            this._datavis.style.width = "100%";
            this._datavis.style.height = "100%";
            post();
        }
    }

    async _post_resize(post, pre) {
        pre?.();
        try {
            if (!document.hidden && this.offsetParent) {
                await this._plugin.resize.call(this);
            }
        } finally {
            post();
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
            computed_column_name += ` ${Math.round(Math.random() * 100)}`;
        }

        const params = [
            {
                computation: data.computation,
                column: computed_column_name,
                computed_function_name: data.computation.computed_function_name,
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
        const parent = ev.currentTarget;
        const is_active = parent.parentElement.getAttribute("id") === "active_columns";
        if (is_active) {
            const min_columns = this._plugin.initial?.count || 1;
            if (this._get_view_active_valid_column_count() === min_columns) {
                return;
            }
            if (ev.detail.shiftKey) {
                for (let child of Array.prototype.slice.call(this._active_columns.children)) {
                    if (child !== parent) {
                        this._active_columns.removeChild(child);
                    }
                }
            } else {
                const index = Array.prototype.slice.call(this._active_columns.children).indexOf(parent);
                if (index < this._plugin.initial?.count) {
                    return;
                } else if (index < this._plugin.initial?.names?.length - 1) {
                    this._active_columns.insertBefore(this._new_row(null), parent);
                }
                this._active_columns.removeChild(parent);
            }
        } else {
            // check if we're manipulating computed column input
            if (ev.path[1]?.classList.contains("psp-cc-computation__input-column")) {
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
            const cols = this._get_view_active_columns();
            let i = cols.length - 1;
            if (!cols[i] || !cols[i]?.classList.contains("null-column")) {
                this._active_columns.appendChild(row);
            } else
                while (i-- > 0) {
                    if (!cols[i].classList.contains("null-column")) {
                        this._active_columns.replaceChild(row, cols[i + 1]);
                        break;
                    }
                }
        }
        this._check_responsive_layout();
        this._update_column_view();
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

    _increment_sort(sort, column_sorting, abs_sorting) {
        let sort_orders = ["asc", "desc"];
        if (column_sorting) {
            sort_orders.push("col asc", "col desc");
        }
        if (abs_sorting) {
            sort_orders = sort_orders.map(x => `${x} abs`);
        }
        sort_orders.push("none");
        return sort_orders[(sort_orders.indexOf(sort) + 1) % sort_orders.length];
    }

    _sort_order_clicked(event) {
        const row = event.target;
        const abs_sorting = event.detail.shiftKey && row.getAttribute("type") !== "string";
        const new_sort_order = this._increment_sort(row.getAttribute("sort-order"), this._get_view_column_pivots().length > 0, abs_sorting);
        row.setAttribute("sort-order", new_sort_order);

        const sort = this._get_view_sorts();
        this.setAttribute("sort", JSON.stringify(sort));
    }

    // edits state
    _transpose() {
        const has_row = this.hasAttribute("row-pivots");
        const has_col = this.hasAttribute("column-pivots");
        if (has_row && has_col) {
            let row_pivots = this.getAttribute("row-pivots");
            this.setAttribute("row-pivots", this.getAttribute("column-pivots"));
            this.setAttribute("column-pivots", row_pivots);
        } else if (has_row) {
            let row_pivots = this.getAttribute("row-pivots");
            this.removeAttribute("row-pivots");
            this.setAttribute("column-pivots", row_pivots);
        } else if (has_col) {
            let column_pivots = this.getAttribute("column-pivots");
            this.removeAttribute("column-pivots");
            this.setAttribute("row-pivots", column_pivots);
        } else {
            this.removeAttribute("column-pivots");
            this.removeAttribute("row-pivots");
        }
    }

    _reset_sidepanel() {
        this._side_panel.style.width = "";
    }

    _resize_sidepanel(event) {
        const initial = document.body.style.cursor;
        document.body.style.cursor = "col-resize";
        const start = event.clientX;
        const width = this._side_panel.offsetWidth;
        const resize = event => {
            const new_width = Math.max(0, Math.min(width + (event.clientX - start), this.offsetWidth - 10));
            this._side_panel.style.width = `${new_width}px`;
            if (this._plugin) {
                this.notifyResize();
            }
        };
        const stop = () => {
            document.body.style.cursor = initial;
            document.removeEventListener("mousemove", resize);
            document.removeEventListener("mouseup", stop);
        };
        document.addEventListener("mousemove", resize);
        document.addEventListener("mouseup", stop);
    }

    _vis_selector_changed() {
        this._plugin_information.classList.add("hidden");
        this.setAttribute("plugin", this._vis_selector.value);
        this._active_columns.classList.remove("one_lock", "two_lock");
        const classname = ["one_lock", "two_lock"][this._plugin.initial?.count - 1];
        if (classname) {
            this._active_columns.classList.add(classname);
        }
        this._debounce_update();
    }

    // most of these are drag and drop handlers - how to clean up?
    _register_callbacks() {
        this._sort.addEventListener("drop", drop.bind(this));
        this._sort.addEventListener("dragend", dragend.bind(this));
        this._sort.addEventListener("dragenter", dragenter.bind(this));
        this._sort.addEventListener("dragover", dragover.bind(this));
        this._sort.addEventListener("dragleave", dragleave.bind(this));
        this._row_pivots.addEventListener("drop", drop.bind(this));
        this._row_pivots.addEventListener("dragend", dragend.bind(this));
        this._row_pivots.addEventListener("dragenter", dragenter.bind(this));
        this._row_pivots.addEventListener("dragover", dragover.bind(this));
        this._row_pivots.addEventListener("dragleave", dragleave.bind(this));
        this._column_pivots.addEventListener("drop", drop.bind(this));
        this._column_pivots.addEventListener("dragend", dragend.bind(this));
        this._column_pivots.addEventListener("dragenter", dragenter.bind(this));
        this._column_pivots.addEventListener("dragover", dragover.bind(this));
        this._column_pivots.addEventListener("dragleave", dragleave.bind(this));
        this._filters.addEventListener("drop", drop.bind(this));
        this._filters.addEventListener("dragend", dragend.bind(this));
        this._filters.addEventListener("dragenter", dragenter.bind(this));
        this._filters.addEventListener("dragover", dragover.bind(this));
        this._filters.addEventListener("dragleave", dragleave.bind(this));
        this._active_columns.addEventListener("drop", column_drop.bind(this));
        this._active_columns.addEventListener("dragenter", dragenter.bind(this));
        this._active_columns.addEventListener("dragend", column_dragend.bind(this));
        this._active_columns.addEventListener("dragover", column_dragover.bind(this));
        this._active_columns.addEventListener("dragleave", column_dragleave.bind(this));
        this._add_computed_column.addEventListener("click", this._open_computed_column.bind(this));
        this._computed_column.addEventListener("perspective-computed-column-save", this._validate_computed_column.bind(this));
        this._computed_column.addEventListener("perspective-computed-column-update", this._set_computed_column_input.bind(this));
        // this._side_panel.addEventListener('
        //     perspective-computed-column-edit',
        //     this._open_computed_column.bind(this)
        // );
        this._config_button.addEventListener("mousedown", this._toggle_config.bind(this));
        this._config_button.addEventListener("contextmenu", this._show_context_menu.bind(this));
        this._reset_button.addEventListener("click", this.reset.bind(this));
        this._copy_button.addEventListener("click", event => this.copy(event.shiftKey));
        this._download_button.addEventListener("click", event => this.download(event.shiftKey));
        this._transpose_button.addEventListener("click", this._transpose.bind(this));
        this._drop_target.addEventListener("dragover", dragover.bind(this));
        this._resize_bar.addEventListener("mousedown", this._resize_sidepanel.bind(this));
        this._resize_bar.addEventListener("dblclick", this._reset_sidepanel.bind(this));

        this._vis_selector.addEventListener("change", this._vis_selector_changed.bind(this));

        this._plugin_information_action.addEventListener("click", () => {
            this._debounce_update({ignore_size_check: true, limit_points: false});
            this._plugin_information.classList.add("hidden");
        });

        this._plugin_information_action_close.addEventListener("click", () => {
            this._plugin_information.classList.add("hidden");
        });
    }
}
