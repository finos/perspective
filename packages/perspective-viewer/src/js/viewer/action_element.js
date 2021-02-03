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
    async _toggle_config(event) {
        if (!event || event.button !== 2) {
            this._show_config = !this._show_config;
            const panel = this.shadowRoot.querySelector("#pivot_chart_container");
            if (!this._show_config) {
                await this._pre_resize(
                    panel.clientWidth + this._side_panel.clientWidth,
                    panel.clientHeight + this._top_panel.clientHeight,
                    () => {
                        this._app.classList.remove("settings-open");
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
                        this._app.classList.add("settings-open");
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

    /**
     * Display the computed expressions panel.
     *
     * @param {*} event
     */
    _open_computed_expression_widget(event) {
        event.stopImmediatePropagation();
        // FIXME: we need a better way to pass down types, metadata, etc.
        // from the parent viewer to child web components.
        this._computed_expression_widget._computed_expression_parser = this._computed_expression_parser;

        // Bind `get_type` so the expression editor can render the correct
        // types for each column.
        this._computed_expression_widget._get_type = this._get_type.bind(this);

        // Pass down a way to get the column names from the viewer.
        this._computed_expression_widget._get_view_all_column_names = this._get_view_all_column_names.bind(this);
        this._computed_expression_widget._get_view_column_names_by_types = this._get_view_column_names_by_types.bind(this);

        this._computed_expression_widget.style.display = "flex";
        this._side_panel_actions.style.display = "none";
        this._computed_expression_widget._observe_editor();
    }

    /**
     * Given an expression (in the `detail` property of the
     * `perspective-computed-expression-save` event), retrieve the viewer's
     * `computed-columns` array and append the new expression to be parsed.
     *
     * @param {*} event
     */
    _save_computed_expression(event) {
        let expression = event.detail.expression;

        // // `computed-columns` stores the raw expression typed by the user.
        // let computed_columns = this._get_view_computed_columns();

        // if (computed_columns.includes(expression)) {
        //     console.warn(`"${expression}" was not applied because it already exists.`);
        //     return;
        // }

        // computed_columns.push(expression);

        // this.setAttribute("computed-columns", JSON.stringify(computed_columns));

        let expressions = this._get_view_expressions();

        if (expressions.includes(expression)) {
            console.warn(`"${expression}" was not applied because it already exists.`);
            return;
        }

        if (expression.includes("$''")) {
            throw new Error("Expression cannot reference empty column $''!");
        }

        expressions.push(expression);

        console.log(expressions);

        this.setAttribute("expressions", JSON.stringify(expressions));
    }

    async _type_check_computed_expression(event) {
        // const parsed = event.detail.parsed_expression || [];
        // if (parsed.length === 0) {
        //     this._computed_expression_widget._type_check_expression({});
        //     return;
        // }
        // const functions = {};
        // for (const col of parsed) {
        //     functions[col.column] = col.computed_function_name;
        // }
        // const schema = await this._table.computed_schema(parsed);
        // // Look at the failing values, and get their expected types
        // const expected_types = {};
        // for (const key in functions) {
        //     if (!schema[key]) {
        //         expected_types[key] = await this._table.get_computation_input_types(functions[key]);
        //     }
        // }

        // this._computed_expression_widget._type_check_expression(schema, expected_types);
    }

    /**
     * Remove all computed expressions from the DOM.
     */
    _clear_all_computed_expressions() {
        this.setAttribute("computed-columns", JSON.stringify([]));
    }

    _set_computed_expression(event) {
        return event;
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
        this._add_computed_expression_button.addEventListener("click", this._open_computed_expression_widget.bind(this));
        this._computed_expression_widget.addEventListener("perspective-computed-expression-save", this._save_computed_expression.bind(this));

        // TODO WIP
        // this._computed_expression_widget.addEventListener(
        //     "perspective-computed-expression-resize",
        //     this._reset_sidepanel.bind(this)
        // );

        this._computed_expression_widget.addEventListener("perspective-computed-expression-type-check", this._type_check_computed_expression.bind(this));
        this._computed_expression_widget.addEventListener("perspective-computed-expression-remove", this._clear_all_computed_expressions.bind(this));
        this._computed_expression_widget.addEventListener("perspective-computed-expression-update", this._set_computed_expression.bind(this));
        this._transpose_button.addEventListener("click", this._transpose.bind(this));
        this._vis_selector.addEventListener("change", this._vis_selector_changed.bind(this));
        this._vieux.addEventListener("perspective-vieux-reset", () => this.reset());
        this._vieux.addEventListener("perspective-vieux-resize", () => this._plugin.resize.call(this));

        this._plugin_information_action.addEventListener("click", () => {
            this._debounce_update({ignore_size_check: true, limit_points: false});
            this._plugin_information.classList.add("hidden");
            this._plugin.render_warning = false;
        });
    }
}
