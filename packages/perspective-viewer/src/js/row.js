/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import _ from "underscore";

import {bindTemplate} from "./utils.js";

import perspective from "@jpmorganchase/perspective";
import template from "../html/row.html";

import "../less/row.less";

/******************************************************************************
 *
 * Drag & Drop Utils
 *
 */

global.dragEnter = function dragEnter(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    ev.currentTarget.classList.add('dropping');
}

global.allowDrop = function allowDrop(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    ev.currentTarget.classList.add('dropping'); 
    ev.dataTransfer.dropEffect = 'move';
    
}

global.disallowDrop = function disallowDrop(ev) {
    if (ev.currentTarget == ev.target){
        ev.stopPropagation();
        ev.preventDefault();
        ev.currentTarget.classList.remove('dropping');
    }
}

function get_text_width(text, max = 0) {
    let span = document.createElement('span');
    // FIXME get these values form the stylesheet
    span.style.visibility = 'hidden';
    span.style.fontFamily = 'monospace';
    span.style.fontSize = '12px';
    span.innerHTML = text;
    document.body.appendChild(span);
    let width = `${Math.max(max, span.offsetWidth) + 20}px`;
    document.body.removeChild(span);
    return width;
}

const ICONS = {
    "asc": "&#x2191;",
    "desc": "&#x2193;",
    "none": "-",
    "asc abs": "&#x2B06;",
    "desc abs": "&#x2B07;"
};

@bindTemplate(template)
class Row extends HTMLElement {

    set name(n) {
        let elem = this.querySelector('#name');
        elem.innerHTML = this.getAttribute('name');
    }

    set type(t) {
        let elem = this.querySelector('#name');
        let type = this.getAttribute('type');
        if (!type) return;
        elem.classList.add(type);
        let agg_dropdown = this.querySelector('#column_aggregate');
        let filter_dropdown = this.querySelector('#filter_operator');
        switch (type) {
            case "float":
            case "integer":
                agg_dropdown.innerHTML = perspective.TYPE_AGGREGATES.float.map(agg => 
                    `<option value="${agg}">${agg}</option>`
                ).join('');
                filter_dropdown.innerHTML = perspective.TYPE_FILTERS.float.map(agg => 
                    `<option value="${agg}">${agg}</option>`
                ).join('');
                break;
            case "boolean":
                agg_dropdown.innerHTML = perspective.TYPE_AGGREGATES.boolean.map(agg => 
                    `<option value="${agg}">${agg}</option>`
                ).join('');
                filter_dropdown.innerHTML = perspective.TYPE_FILTERS.boolean.map(agg => 
                    `<option value="${agg}">${agg}</option>`
                ).join('');
                break;
            case 'date':
                agg_dropdown.innerHTML = perspective.TYPE_AGGREGATES.date.map(agg => 
                    `<option value="${agg}">${agg}</option>`
                ).join('');
                filter_dropdown.innerHTML = perspective.TYPE_FILTERS.date.map(agg => 
                    `<option value="${agg}">${agg}</option>`
                ).join('');
                break;
            case "string":
                agg_dropdown.innerHTML = perspective.TYPE_AGGREGATES.string.map(agg => 
                    `<option value="${agg}">${agg}</option>`
                ).join('');
                filter_dropdown.innerHTML = perspective.TYPE_FILTERS.string.map(agg => 
                    `<option value="${agg}">${agg}</option>`
                ).join('');
            default:
        }
        if (!this.hasAttribute('aggregate')) {
            this.setAttribute('aggregate', perspective.AGGREGATE_DEFAULTS[type]);
        }
        let filter_operand = this.querySelector('#filter_operand');
        this._callback = event => this._update_filter(event);
        filter_operand.addEventListener('keyup', event => {
            if (filter_operand.value !== 'in') {
                this._callback(event);
            }
        });
    }

    choices(choices) {
        let filter_operand = this.querySelector('#filter_operand');
        let filter_operator = this.querySelector('#filter_operator');
        new Awesomplete(filter_operand, {
            label: this.getAttribute('name'),
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
                if (filter_operator.value === 'in') {            
                    this.input.value = before + text + ", ";
                } else {
                    this.input.value = before + text;
                }
            }
        });
        filter_operand.addEventListener('awesomplete-selectcomplete', this._callback);
    }

    set filter(f) {
        const filter_dropdown = this.querySelector('#filter_operator');
        const filter = JSON.parse(this.getAttribute('filter'));
        if (filter_dropdown.value !== filter.operator) {
            filter_dropdown.value = filter.operator || perspective.FILTER_DEFAULTS[this.getAttribute('type')];
        }
        filter_dropdown.style.width = get_text_width(filter_dropdown.value);
        const filter_input = this.querySelector('#filter_operand');
        const operand = filter.operand ? filter.operand.toString() : "";
        if (!this._initialized) {
            filter_input.value = operand;
        }
        filter_input.style.width = get_text_width(operand, 30);
    }

    set aggregate(a) {
        let agg_dropdown = this.querySelector('#column_aggregate');
        let aggregate = this.getAttribute('aggregate');
        if (agg_dropdown.value !== aggregate) {
            agg_dropdown.value = aggregate || perspective.AGGREGATE_DEFAULTS[type];
        }
    }

    set 'sort-order'(sort_dir) {
        const icon = ICONS[sort_dir];
        this.querySelector('#sort_order').innerHTML = icon;
    }

    set 'computed_column' (c) {
        const data = this._get_computed_data();
        const computed_input_column = this.querySelector('#computed_input_column');
        const computation_name = this.querySelector('#computation_name');
        computation_name.textContent = data.computation.name;
        computed_input_column.textContent = data.input_column;
    }

    _update_filter(event) {
        let filter_operand = this.querySelector('#filter_operand');
        let filter_operator = this.querySelector('#filter_operator');
        let val = filter_operand.value;
        let type = this.getAttribute('type');
        switch (type) {
            case "float":
                val = parseFloat(val);
                break;
            case "integer":
                val = parseInt(val);
                break;
            case "boolean":
                val = val.toLowerCase().indexOf('true') > -1;
                break;
            case "string":
            default:
        }
        if (filter_operator.value === "in") {
            val = val.split(',').map(x => x.trim());
        }
        this.setAttribute('filter', JSON.stringify({operator: filter_operator.value, operand: val}));
        this.dispatchEvent(new CustomEvent('filter-selected', {detail: event}));   
    }

    _get_computed_data() {
        const data = JSON.parse(this.getAttribute('computed_column'));
        return {
            column_name: data.column_name,
            input_column: data.input_column,
            input_type: data.input_type,
            computation: data.computation,
            type: data.type,
        };
    }

    connectedCallback() {
        let li = this.querySelector('.row_draggable');
        li.addEventListener('dragstart', ev => {
            if (this.hasAttribute('filter')) {
                let {operator, operand} = JSON.parse(this.getAttribute('filter'));
                ev.dataTransfer.setData("text",
                    JSON.stringify([this.getAttribute('name'), operator, operand, this.getAttribute('type'), this.getAttribute('aggregate')]));
            } else {
                ev.dataTransfer.setData("text",
                    JSON.stringify([this.getAttribute('name'), perspective.FILTER_DEFAULTS[this.getAttribute('type')], undefined, this.getAttribute('type'), this.getAttribute('aggregate')]));
            }
            this.dispatchEvent(new CustomEvent('row-drag'));
        });
        li.addEventListener('dragend', ev => {
            this.dispatchEvent(new CustomEvent('row-dragend'));
        });
        let visible = this.querySelector('.is_visible');
        visible.addEventListener('mousedown', event => this.dispatchEvent(new CustomEvent('visibility-clicked', {detail: event})));
        this.querySelector('#row_close').addEventListener('mousedown', event => this.dispatchEvent(new CustomEvent('close-clicked', {detail: event})));

        let agg_dropdown = this.querySelector('#column_aggregate');
        agg_dropdown.addEventListener('change', event => {
            this.setAttribute('aggregate', agg_dropdown.value);
            this.dispatchEvent(new CustomEvent('aggregate-selected', {detail: event}));
        });

        let sort_order = this.querySelector('#sort_order');
        sort_order.addEventListener('click', event => {
            const current = this.getAttribute('sort-order');
            const order = (perspective.SORT_ORDERS.indexOf(current) + 1) % 5;
            this.setAttribute('sort-order', perspective.SORT_ORDERS[order]);
            this.dispatchEvent(new CustomEvent('sort-order', {detail: event}));
        });

        let filter_operand = this.querySelector('#filter_operand');
        let filter_operator = this.querySelector('#filter_operator');
        let debounced_filter = _.debounce(event => this._update_filter(event), 50);
        filter_operator.addEventListener('change', event => {
            filter_operator.style.width = get_text_width(filter_operator.value);
            const filter_input = this.querySelector('#filter_operand');
            filter_input.style.width = get_text_width("" + filter_operand.value, 30);    
            debounced_filter();
        });

        const edit_computed_column_button = this.querySelector('#row_edit');
        edit_computed_column_button.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('perspective-computed-column-edit', {
                bubbles: true,
                detail: this._get_computed_data()
            }));
        })
    }
};


