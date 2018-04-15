/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import _ from "underscore";

import {registerElement, importTemplate} from "@jpmorganchase/perspective-common";

import perspective from "@jpmorganchase/perspective";
import template from "../html/row.html";

import "../less/row.less";

/******************************************************************************
 *
 * Drag & Drop Utils
 *
 */

global.dragEnter = function dragEnter(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('dropping');
}

global.allowDrop = function allowDrop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('dropping');
    ev.dataTransfer.dropEffect = 'move';
}

global.disallowDrop = function disallowDrop(ev) {
    ev.currentTarget.classList.remove('dropping');
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

registerElement(template, {

    name: {
        set: function () {
            let elem = this.querySelector('#name');
            elem.innerHTML = this.getAttribute('name');
        }
    },

    type: {
        set: function () {
            let elem = this.querySelector('#name');
            let type = this.getAttribute('type');
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
        }
    },

    filter: {
        set: function () {
            const filter_dropdown = this.querySelector('#filter_operator');
            const filter = JSON.parse(this.getAttribute('filter'));
            if (filter_dropdown.value !== filter.operator) {
                filter_dropdown.value = filter.operator || perspective.FILTER_DEFAULTS[this.getAttribute('type')];
            }
            filter_dropdown.style.width = get_text_width(filter_dropdown.value);
            const filter_input = this.querySelector('#filter_operand');
            const operand = filter.operand.toString();
            if (!this._initialized) {
                filter_input.value = operand;
            }
            filter_input.style.width = get_text_width(operand, 30);
        }
    },

    aggregate: {
        set: function () {
            let agg_dropdown = this.querySelector('#column_aggregate');
            let aggregate = this.getAttribute('aggregate');
            if (agg_dropdown.value !== aggregate) {
                agg_dropdown.value = aggregate || perspective.AGGREGATE_DEFAULTS[type];
            }
        }
    },

    _update_filter: {
        value: function () {
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
                    val = val.toLowerCase().indexOf('true') > -1; //FIXME
                    break;
                case 'date':
                    val = ''
                    break;
                case "string":
                default:
            }
            this.setAttribute('filter', JSON.stringify({operator: filter_operator.value, operand: val}));
            this.dispatchEvent(new CustomEvent('filter-selected', {detail: event}));   
        }
    },

    attachedCallback: {
        value: function () {
            let li = this.querySelector('.row_draggable');
            li.addEventListener('dragstart', ev => {
                if (this.hasAttribute('filter')) {
                    let {operator, operand} = JSON.parse(this.getAttribute('filter'));
                    ev.dataTransfer.setData("text", JSON.stringify([this.getAttribute('name'), operator, operand]));
                } else {
                    ev.dataTransfer.setData("text", JSON.stringify([this.getAttribute('name'), perspective.FILTER_DEFAULTS[this.getAttribute('type')], undefined]));
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

            let filter_operand = this.querySelector('#filter_operand');
            let filter_operator = this.querySelector('#filter_operator');
            let debounced_filter = _.debounce(event => this._update_filter(event), 50);
            filter_operator.addEventListener('change', event => {
                filter_operator.style.width = get_text_width(filter_operator.value);
                debounced_filter();
            });
            filter_operand.addEventListener('keyup', event => this._update_filter(event));
        }
    }

});
