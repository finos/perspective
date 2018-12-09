/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import _ from "underscore";

import Awesomplete from "awesomplete";
import awesomplete_style from "!!css-loader!awesomplete/awesomplete.css";

import {bindTemplate} from "./utils.js";

import perspective from "@jpmorganchase/perspective";
import template from "../html/row.html";

import style from "../less/row.less";

function get_text_width(text, max = 0) {
    let span = document.createElement("span");
    // FIXME get these values form the stylesheet
    span.style.visibility = "hidden";
    span.style.fontFamily = "monospace";
    span.style.fontSize = "12px";
    span.style.position = "absolute";
    span.innerHTML = text;
    document.body.appendChild(span);
    let width = `${Math.max(max, span.offsetWidth) + 20}px`;
    document.body.removeChild(span);
    return width;
}

// Eslint complains here because we don't do anything, but actually we globally
// register this class as a CustomElement
@bindTemplate(template, {toString: () => style + "\n" + awesomplete_style}) // eslint-disable-next-line no-unused-vars
class Row extends HTMLElement {
    set name(n) {
        let elem = this.shadowRoot.querySelector("#name");
        elem.innerHTML = this.getAttribute("name");
    }

    set type(t) {
        let elem = this.shadowRoot.querySelector("#name");
        let type = this.getAttribute("type");
        if (!type) return;
        elem.classList.add(type);
        let agg_dropdown = this.shadowRoot.querySelector("#column_aggregate");
        let filter_dropdown = this.shadowRoot.querySelector("#filter_operator");
        switch (type) {
            case "float":
            case "integer":
                agg_dropdown.innerHTML = perspective.TYPE_AGGREGATES.float.map(agg => `<option value="${agg}">${agg}</option>`).join("");
                filter_dropdown.innerHTML = perspective.TYPE_FILTERS.float.map(agg => `<option value="${agg}">${agg}</option>`).join("");
                break;
            case "boolean":
                agg_dropdown.innerHTML = perspective.TYPE_AGGREGATES.boolean.map(agg => `<option value="${agg}">${agg}</option>`).join("");
                filter_dropdown.innerHTML = perspective.TYPE_FILTERS.boolean.map(agg => `<option value="${agg}">${agg}</option>`).join("");
                break;
            case "date":
                agg_dropdown.innerHTML = perspective.TYPE_AGGREGATES.datetime.map(agg => `<option value="${agg}">${agg}</option>`).join("");
                filter_dropdown.innerHTML = perspective.TYPE_FILTERS.datetime.map(agg => `<option value="${agg}">${agg}</option>`).join("");
                break;
            case "datetime":
                agg_dropdown.innerHTML = perspective.TYPE_AGGREGATES.datetime.map(agg => `<option value="${agg}">${agg}</option>`).join("");
                filter_dropdown.innerHTML = perspective.TYPE_FILTERS.datetime.map(agg => `<option value="${agg}">${agg}</option>`).join("");
                break;
            case "string":
                agg_dropdown.innerHTML = perspective.TYPE_AGGREGATES.string.map(agg => `<option value="${agg}">${agg}</option>`).join("");
                filter_dropdown.innerHTML = perspective.TYPE_FILTERS.string.map(agg => `<option value="${agg}">${agg}</option>`).join("");
            default:
        }
        if (!this.hasAttribute("aggregate")) {
            this.setAttribute("aggregate", perspective.AGGREGATE_DEFAULTS[type]);
        }
        let filter_operand = this.shadowRoot.querySelector("#filter_operand");
        this._callback = event => this._update_filter(event);
        filter_operand.addEventListener("keyup", event => {
            if (filter_operand.value !== "in") {
                this._callback(event);
            }
        });
    }

    choices(choices) {
        let filter_operand = this.shadowRoot.querySelector("#filter_operand");
        let filter_operator = this.shadowRoot.querySelector("#filter_operator");
        new Awesomplete(filter_operand, {
            label: this.getAttribute("name"),
            list: choices,
            minChars: 0,
            filter: function(text, input) {
                return Awesomplete.FILTER_CONTAINS(text, input.match(/[^,]*$/)[0]);
            },
            item: function(text, input) {
                return Awesomplete.ITEM(text, input.match(/[^,]*$/)[0]);
            },
            replace: function(text) {
                let before = this.input.value.match(/^.+,\s*|/)[0];
                if (filter_operator.value === "in") {
                    this.input.value = before + text + ", ";
                } else {
                    this.input.value = before + text;
                }
            }
        });
        filter_operand.addEventListener("awesomplete-selectcomplete", this._callback);
    }

    set filter(f) {
        const filter_dropdown = this.shadowRoot.querySelector("#filter_operator");
        const filter = JSON.parse(this.getAttribute("filter"));
        if (filter_dropdown.value !== filter.operator) {
            filter_dropdown.value = filter.operator || perspective.FILTER_DEFAULTS[this.getAttribute("type")];
        }
        filter_dropdown.style.width = get_text_width(filter_dropdown.value);
        const filter_input = this.shadowRoot.querySelector("#filter_operand");
        const operand = filter.operand ? filter.operand.toString() : "";
        if (!this._initialized) {
            filter_input.value = operand;
        }
        filter_input.style.width = get_text_width(operand, 30);
    }

    set aggregate(a) {
        let agg_dropdown = this.shadowRoot.querySelector("#column_aggregate");
        let aggregate = this.getAttribute("aggregate");
        if (agg_dropdown.value !== aggregate && this.hasAttribute("type")) {
            let type = this.getAttribute("type");
            agg_dropdown.value = aggregate || perspective.AGGREGATE_DEFAULTS[type];
        }
    }

    set computed_column(c) {
        // const data = this._get_computed_data();
        // const computed_input_column = this.shadowRoot.querySelector('#computed_input_column');
        // const computation_name = this.shadowRoot.querySelector('#computation_name');
        // computation_name.textContent = data.computation.name;
        // computed_input_column.textContent = data.input_column;
    }

    _get_computed_data() {
        const data = JSON.parse(this.getAttribute("computed_column"));
        return {
            column_name: data.column_name,
            input_columns: data.input_columns,
            input_type: data.input_type,
            computation: data.computation,
            type: data.type
        };
    }

    _update_filter(event) {
        let filter_operand = this.shadowRoot.querySelector("#filter_operand");
        let filter_operator = this.shadowRoot.querySelector("#filter_operator");
        let val = filter_operand.value;
        let type = this.getAttribute("type");
        switch (type) {
            case "float":
                val = parseFloat(val);
                break;
            case "integer":
                val = parseInt(val);
                break;
            case "boolean":
                val = val.toLowerCase().indexOf("true") > -1;
                break;
            case "string":
            default:
        }
        if (filter_operator.value === "in") {
            val = val.split(",").map(x => x.trim());
        }
        this.setAttribute("filter", JSON.stringify({operator: filter_operator.value, operand: val}));
        this.dispatchEvent(new CustomEvent("filter-selected", {detail: event}));
    }

    _increment_sort_order(column_sorting, abs_sorting) {
        const current = this.getAttribute("sort-order");
        let sort_orders = ["asc", "desc"];
        if (column_sorting) {
            sort_orders.push("col asc", "col desc");
        }
        if (abs_sorting && this.getAttribute("type") !== "string") {
            sort_orders = sort_orders.map(x => `${x} abs`);
        }
        sort_orders.unshift("none");
        const order = (sort_orders.indexOf(current) + 1) % sort_orders.length;
        this.setAttribute("sort-order", sort_orders[order]);
    }

    _set_data_transfer(event) {
        if (this.hasAttribute("filter")) {
            let {operator, operand} = JSON.parse(this.getAttribute("filter"));
            event.dataTransfer.setData("text", JSON.stringify([this.getAttribute("name"), operator, operand, this.getAttribute("type"), this.getAttribute("aggregate")]));
        } else {
            event.dataTransfer.setData(
                "text",
                JSON.stringify([this.getAttribute("name"), perspective.FILTER_DEFAULTS[this.getAttribute("type")], undefined, this.getAttribute("type"), this.getAttribute("aggregate")])
            );
        }
        this.dispatchEvent(new CustomEvent("row-drag"));
    }

    _register_ids() {
        this._li = this.shadowRoot.querySelector(".row_draggable");
        this._visible = this.shadowRoot.querySelector(".is_visible");
        this._row_close = this.shadowRoot.querySelector("#row_close");
        this._agg_dropdown = this.shadowRoot.querySelector("#column_aggregate");
        this._sort_order = this.shadowRoot.querySelector("#sort_order");
        this._filter_operand = this.shadowRoot.querySelector("#filter_operand");
        this._filter_operator = this.shadowRoot.querySelector("#filter_operator");
        this._edit_computed_column_button = this.shadowRoot.querySelector("#row_edit");
    }

    _register_callbacks() {
        this._li.addEventListener("dragstart", this._set_data_transfer.bind(this));
        this._li.addEventListener("dragend", () => {
            this.dispatchEvent(new CustomEvent("row-dragend"));
        });
        this._visible.addEventListener("mousedown", event => this.dispatchEvent(new CustomEvent("visibility-clicked", {detail: event})));
        this._row_close.addEventListener("mousedown", event => this.dispatchEvent(new CustomEvent("close-clicked", {detail: event})));
        this._agg_dropdown.addEventListener("change", event => {
            this.setAttribute("aggregate", this._agg_dropdown.value);
            this.dispatchEvent(new CustomEvent("aggregate-selected", {detail: event}));
        });
        this._sort_order.addEventListener("click", event => {
            this.dispatchEvent(new CustomEvent("sort-order", {detail: event}));
        });

        const debounced_filter = _.debounce(event => this._update_filter(event), 50);
        this._filter_operator.addEventListener("change", () => {
            this._filter_operator.style.width = get_text_width(this._filter_operator.value);
            const filter_input = this.shadowRoot.querySelector("#filter_operand");
            filter_input.style.width = get_text_width("" + this._filter_operand.value, 30);
            debounced_filter();
        });
        this._edit_computed_column_button.addEventListener("click", () => {
            this.dispatchEvent(
                new CustomEvent("perspective-computed-column-edit", {
                    bubbles: true,
                    detail: this._get_computed_data()
                })
            );
        });
    }

    connectedCallback() {
        this._register_ids();
        this._register_callbacks();
    }
}
