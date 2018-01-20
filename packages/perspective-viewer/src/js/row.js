/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

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
    ev.dataTransfer.dropEffect = 'all';
    ev.currentTarget.classList.add('dropping');
}

global.disallowDrop = function disallowDrop(ev) {
    ev.currentTarget.classList.remove('dropping');
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
            switch (type) {
                case "float":
                case "integer":
                    agg_dropdown.innerHTML = perspective.TYPE_AGGREGATES.float.map(agg => 
                        `<option value="${agg}">${agg}</option>`
                    ).join('');
                    break;
                case "boolean":
                    agg_dropdown.innerHTML = perspective.TYPE_AGGREGATES.boolean.map(agg => 
                        `<option value="${agg}">${agg}</option>`
                    ).join('');
                    break;
                case 'date':
                case "string":
                    agg_dropdown.innerHTML = perspective.TYPE_AGGREGATES.string.map(agg => 
                        `<option value="${agg}">${agg}</option>`
                    ).join('');
                default:
            }
            if (!this.hasAttribute('aggregate')) {
                this.setAttribute('aggregate', perspective.AGGREGATE_DEFAULTS[type]);
            }
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

    attachedCallback: {
        value: function () {
            let li = this.querySelector('.row_draggable');
            li.addEventListener('dragstart', ev => {
                ev.dataTransfer.setData("text", this.getAttribute('name'));
                this.dispatchEvent(new CustomEvent('row-drag'));
            });
            li.addEventListener('dragend', ev => {
                this.dispatchEvent(new CustomEvent('row-dragend'));
            });
            let visible = this.querySelector('.is_visible');
            visible.addEventListener('mousedown', event => this.dispatchEvent(new CustomEvent('visibility-clicked', {detail: event})));
            let agg_dropdown = this.querySelector('#column_aggregate');
            agg_dropdown.addEventListener('change', event => {
                let agg_dropdown = this.querySelector('#column_aggregate');
                this.setAttribute('aggregate', agg_dropdown.value);
                this.dispatchEvent(new CustomEvent('aggregate-selected', {detail: event}));
            });
        }
    }

});
