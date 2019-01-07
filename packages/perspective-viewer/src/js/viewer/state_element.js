/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {renderers} from "./renderers.js";

export class StateElement extends HTMLElement {
    get _plugin() {
        let current_renderers = renderers.getInstance();
        let view = this.getAttribute("view");
        if (!view) {
            view = Object.keys(current_renderers)[0];
        }
        this.setAttribute("view", view);
        return current_renderers[view] || current_renderers[Object.keys(current_renderers)[0]];
    }

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

    _get_view_filter_nodes() {
        return this._get_view_dom_columns("#filters perspective-row");
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

    get_aggregate_attribute() {
        const aggs = JSON.parse(this.getAttribute("aggregates")) || {};
        return Object.keys(aggs).map(col => ({column: col, op: aggs[col]}));
    }
}
