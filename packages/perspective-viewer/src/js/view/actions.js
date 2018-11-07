/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export function column_visibility_clicked(ev) {
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
        let row = this.new_row(parent.getAttribute("name"), parent.getAttribute("type"));
        this._active_columns.appendChild(row);
    }
    let cols = this._get_view_columns();
    this._update_column_view(cols);
}

export function column_aggregate_clicked() {
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

export function column_filter_clicked() {
    let new_filters = this._get_view_filters();
    this._updating_filter = true;
    this.setAttribute("filters", JSON.stringify(new_filters));
    this._updating_filter = false;
    this._debounce_update();
}

export function sort_order_clicked() {
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