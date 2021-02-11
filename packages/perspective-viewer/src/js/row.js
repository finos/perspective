/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import debounce from "lodash/debounce";

import Awesomplete from "awesomplete";
import awesomplete_style from "awesomplete/awesomplete.css";

import {bindTemplate} from "./utils.js";

import * as perspective from "@finos/perspective/dist/esm/config/constants.js";
import {get_type_config} from "@finos/perspective/dist/esm/config";
import template from "../html/row.html";

import style from "../less/row.less";
import {html, render, nothing} from "lit-html";

const SPAN = document.createElement("span");
SPAN.style.visibility = "hidden";
SPAN.style.fontFamily = "monospace";
SPAN.style.fontSize = "12px";
SPAN.style.position = "absolute";

function get_text_width(text, max = 0) {
    // FIXME get these values form the stylesheet
    SPAN.innerHTML = text;
    document.body.appendChild(SPAN);
    const width = `${Math.max(max, SPAN.offsetWidth) + 20}px`;
    document.body.removeChild(SPAN);
    return width;
}

// Eslint complains here because we don't do anything, but actually we globally
// register this class as a CustomElement
@bindTemplate(template, {toString: () => style + "\n" + awesomplete_style}) // eslint-disable-next-line no-unused-vars
class Row extends HTMLElement {
    set name(n) {
        const elem = this.shadowRoot.querySelector("#name");
        elem.innerHTML = this.getAttribute("name");
    }

    _option_template(agg, name) {
        return html`
            <option value="${agg}" data-desc="${name}">${name || agg}</option>
        `;
    }

    _select_template(category, type) {
        const items = perspective[category][type] || [];
        const weighted_options = html`
            <optgroup label="weighted mean">
                ${this._weights.map(x => this._option_template(JSON.stringify(["weighted mean", x]), x))}
            </optgroup>
        `;
        const has_weighted_mean = category === "TYPE_AGGREGATES" && (type === "integer" || type === "float");
        return html`
            ${items.map(x => this._option_template(x))} ${has_weighted_mean ? weighted_options : nothing}
        `;
    }

    set_weights(xs) {
        this._weights = xs;
    }

    set type(t) {
        const elem = this.shadowRoot.querySelector("#name");
        const type = this.getAttribute("type");
        if (!type) return;
        const type_config = get_type_config(type);
        if (type_config.type) {
            elem.classList.add(type_config.type);
        }
        elem.classList.add(type);
        const agg_dropdown = this.shadowRoot.querySelector("#column_aggregate");
        const filter_dropdown = this.shadowRoot.querySelector("#filter_operator");

        render(this._select_template("TYPE_AGGREGATES", type_config.type || type), agg_dropdown);
        render(this._select_template("TYPE_FILTERS", type_config.type || type), filter_dropdown);

        if (!this.hasAttribute("aggregate")) {
            this.aggregate = type_config.aggregate;
        } else {
            this.aggregate = this.getAttribute("aggregate");
        }
        if (this.hasAttribute("filter")) {
            this.filter = this.getAttribute("filter");
        }

        const filter_operand = this.shadowRoot.querySelector("#filter_operand");
        this._callback = event => this._update_filter(event);
        filter_operand.addEventListener("keyup", this._callback.bind(this));
    }

    choices(choices) {
        const filter_operand = this.shadowRoot.querySelector("#filter_operand");
        const filter_operator = this.shadowRoot.querySelector("#filter_operator");
        const selector = new Awesomplete(filter_operand, {
            label: this.getAttribute("name"),
            list: choices,
            minChars: 0,
            autoFirst: true,
            filter: function(text, input) {
                return Awesomplete.FILTER_CONTAINS(text, input.match(/[^,]*$/)[0]);
            },
            item: function(text, input) {
                return Awesomplete.ITEM(text, input.match(/[^,]*$/)[0]);
            },
            replace: function(text) {
                const before = this.input.value.match(/^.+,\s*|/)[0];
                if (filter_operator.value === "in" || filter_operator.value === "not in") {
                    this.input.value = before + text + ", ";
                } else {
                    this.input.value = before + text;
                }
            }
        });
        if (filter_operand.value === "") {
            selector.evaluate();
        }
        filter_operand.focus();
        this._filter_operand.addEventListener("focus", () => {
            if (filter_operand.value.trim().length === 0) {
                selector.evaluate();
            }
        });
        filter_operand.addEventListener("awesomplete-selectcomplete", this._callback);
    }

    set filter(f) {
        const filter_dropdown = this.shadowRoot.querySelector("#filter_operator");
        const filter = JSON.parse(this.getAttribute("filter"));
        if (filter_dropdown.value !== filter.operator) {
            filter_dropdown.value = filter.operator || get_type_config(this.getAttribute("type")).filter_operator;
        }
        filter_dropdown.style.width = get_text_width(filter_dropdown.value);
        const filter_input = this.shadowRoot.querySelector("#filter_operand");
        const operand = filter.operand ? filter.operand.toString() : "";
        if (!this._initialized) {
            filter_input.value = operand;
        }
        if (filter_dropdown.value === perspective.FILTER_OPERATORS.isNull || filter_dropdown.value === perspective.FILTER_OPERATORS.isNotNull) {
            filter_input.style.display = "none";
        } else {
            filter_input.style.display = "inline-block";
            filter_input.style.width = get_text_width(operand, 30);
        }
    }

    set aggregate(a) {
        const agg_dropdown = this.shadowRoot.querySelector("#column_aggregate");
        const aggregate = this.getAttribute("aggregate");
        if (agg_dropdown.value !== aggregate && this.hasAttribute("type")) {
            const type = this.getAttribute("type");
            agg_dropdown.value = aggregate || get_type_config(type).aggregate;
        }
        this._blur_agg_dropdown();
    }

    set computed_column(c) {
        // const data = this._get_computed_data();
        // const computed_input_column =
        //    this.shadowRoot.querySelector('#computed_input_column');
        // const computation_name =
        //    this.shadowRoot.querySelector('#computation_name');
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
        const filter_operand = this.shadowRoot.querySelector("#filter_operand");
        const filter_operator = this.shadowRoot.querySelector("#filter_operator");
        let val = filter_operand.value;
        const type = this.getAttribute("type");
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
        if (filter_operator.value === perspective.FILTER_OPERATORS.isIn || filter_operator.value === perspective.FILTER_OPERATORS.isNotIn) {
            val = val.split(",").map(x => x.trim());
        }
        this.setAttribute("filter", JSON.stringify({operator: filter_operator.value, operand: val}));
        this.dispatchEvent(new CustomEvent("filter-selected", {detail: event}));
    }

    _set_data_transfer(event) {
        if (this.hasAttribute("filter")) {
            const {operator, operand} = JSON.parse(this.getAttribute("filter"));
            event.dataTransfer.setData("text/plain", JSON.stringify([this.getAttribute("name"), operator, operand, this.getAttribute("type"), this.getAttribute("aggregate")]));
        } else {
            event.dataTransfer.setData(
                "text/plain",
                JSON.stringify([this.getAttribute("name"), get_type_config(this.getAttribute("type")).filter_operator, undefined, this.getAttribute("type"), this.getAttribute("aggregate")])
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
        this._column_aggregate_category = this.shadowRoot.querySelector("#column_aggregate_category");
    }

    _blur_agg_dropdown() {
        this._agg_dropdown.blur();
        if (this._agg_dropdown.value[0] === "[") {
            for (const option of this._agg_dropdown.querySelectorAll("optgroup option")) {
                const name = option.getAttribute("data-desc");
                option.innerHTML = `mean by ${name}`;
            }
        }
    }

    _focus_agg_dropdown() {
        for (const option of this._agg_dropdown.querySelectorAll("optgroup option")) {
            const name = option.getAttribute("data-desc");
            option.innerHTML = `by ${name}`;
        }
    }

    _register_callbacks() {
        this._li.addEventListener("dragstart", this._set_data_transfer.bind(this));
        this._li.addEventListener("dragend", () => {
            this.dispatchEvent(new CustomEvent("row-dragend"));
        });
        this._visible.addEventListener("mousedown", event => this.dispatchEvent(new CustomEvent("visibility-clicked", {detail: event})));
        this._row_close.addEventListener("mousedown", event => this.dispatchEvent(new CustomEvent("close-clicked", {detail: event})));
        this._agg_dropdown.addEventListener("focus", this._focus_agg_dropdown.bind(this));

        this._agg_dropdown.addEventListener("change", event => {
            this._blur_agg_dropdown();
            const value = this._agg_dropdown.value;
            this.setAttribute("aggregate", value);
            this.dispatchEvent(new CustomEvent("aggregate-selected", {detail: event}));
        });
        this._sort_order.addEventListener("click", event => {
            this.dispatchEvent(new CustomEvent("sort-order", {detail: event}));
        });

        const debounced_filter = debounce(event => this._update_filter(event), 50);
        this._filter_operator.addEventListener("change", () => {
            this._filter_operand.focus();
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
