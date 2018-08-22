/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { values } from 'underscore';
import {polyfill} from "mobile-drag-drop";

import {bindTemplate} from './utils.js';
import State from './computed_column/State.js';
import Computation from './computed_column/Computation.js';

import template from '../html/computed_column.html';

import '../less/computed_column.less';

polyfill({});

/******************************************************************************
 *
 * Drag & Drop Utils
 *
 */


// Computations
const hour_of_day = function (val) {
    return new Date(val).getHours();
};

const day_of_week = function (val) {
    return ['1 Sunday', '2 Monday', '3 Tuesday', '4 Wednesday', '5 Thursday', '6 Friday', '7 Saturday'][new Date(val).getDay()];
};

const month_of_year = function (val) {
    return ['01 January', '02 February', '03 March', '04 April', '05 May', '06 June', '07 July', '08 August', '09 September', '10 October', '11 November', '12 December'][new Date(val).getMonth()];
};

const hour_bucket = function (val) {
    let date = new Date(val);
    date.setMinutes(0);
    date.setSeconds(0);
    return +date;
}

const day_bucket = function (val) {
    let date = new Date(val);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    return +date;
}

@bindTemplate(template)
class ComputedColumn extends HTMLElement {
    constructor() {
        super();

        this.state = new State();

        this.computations = {
            'hour_of_day': new Computation('hour_of_day', 'date', 'integer', hour_of_day),
            'day_of_week': new Computation('day_of_week', 'date', 'string', day_of_week),
            'month_of_year': new Computation('month_of_year', 'date', 'string', month_of_year),
            'hour_bucket': new Computation('hour_bucket', 'date', 'date', hour_bucket),
            'day_bucket': new Computation('day_bucket', 'date', 'date', day_bucket),
            'uppercase': new Computation('uppercase', 'string', 'string', x => x.toUpperCase()),
            'lowercase': new Computation('lowercase', 'string', 'string', x => x.toLowerCase()),
            'length': new Computation('length', 'string', 'integer', x => x.length),
            'add': new Computation('add', 'integer', 'integer', (a, b) => a + b, 2),
            'multiply': new Computation('multiply', 'integer', 'integer', (a, b) => a * b, 2),
        };

        this.type_markers = {
            float: '123',
            integer: '123',
            string: 'abc',
            boolean: 't/f',
            date: 'mdy'
        };
    }

    connectedCallback() {
        this._register_ids();
        this._register_computations();
        this._register_callbacks();
        this._update_computation(null);
        this._register_inputs();
    }

    _register_computations() {
        this._computation_selector.innerHTML = "";
        let iterate = true;
        for (let comp of Object.keys(this.computations)) {
            this._computation_selector.innerHTML += `<option value="${comp}"${iterate ? ' selected="selected"' : ""}>${comp.replace(/_/g, ' ')}</option>`;
            iterate = false;
        }
    }

    _register_inputs() {
        this._input_columns.innerHTML = '';
        const computation = this.state.computation;
        const input_type = computation.input_type;

        this.state.input_column = [];

        for (let i = 0; i < computation.num_params; i++) {
            this._input_columns.innerHTML +=
                `<div class="psp-cc-computation__input-column" 
                      data-index="${i}" 
                      drop-target 
                      ondragenter="dragEnter(event)">
                      <span class="psp-label__requiredType ${input_type}"></span>
                      <span class="psp-label__placeholder">Param ${i+1}</span>
                      <div class="psp-cc-computation__drop-target-hover"></div>
                </div>`;
        }

        for (let column of this._input_columns.children) {
            column.addEventListener('drop', this.column_drop.bind(this));
            column.addEventListener('dragend', this.column_undrag.bind(this));
            column.addEventListener('dragover', this.column_dragover.bind(this));
            column.addEventListener('dragleave', this.column_dragleave.bind(this));
        }

        this._clear_column_name();
    }

    // Drag & Drop

    // Called on end of drag operation by releasing the mouse
    column_undrag(event) {
        event.currentTarget.remove('dropping');
        const refresh = this._input_columns.children.length < this.state.computation.num_params;
        if (refresh)
            this._register_inputs();
    }

    // Called when the column leaves the target
    column_dragleave(event) {
        const src = event.currentTarget;
        if (src !== null && src.nodeName !== 'SPAN') {
            const drop_target_hover = src.querySelector('.psp-cc-computation__drop-target-hover');
            src.classList.remove('dropping');
            if(drop_target_hover)
                drop_target_hover.removeAttribute('drop-target');
        }
    }

    // Called when column is held over the target
    column_dragover(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        const input_column = event.currentTarget;
        const drop_target_hover = input_column.querySelector('.psp-cc-computation__drop-target-hover');

        this._clear_error_messages();

        if (input_column.className !== 'dropping') {
            //event.currentTarget.classList.remove('dropped');
            input_column.classList.add('dropping');
        }
        if (drop_target_hover && !drop_target_hover.hasAttribute('drop-target')) {
            drop_target_hover.setAttribute('drop-target', true);
        }

        if(input_column.children.length === 2) {
            // drop_target_hover is the blue box
            input_column.parentNode.insertBefore(drop_target_hover, input_column.nextSibling);
        }
    }

    // Called when the column is dropped on the target
     column_drop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dropping');

        // column must match return type of computation
        const data = JSON.parse(event.dataTransfer.getData('text'));
        if (!data) return;

        const column_name = data[0];
        const column_type = data[3];

        this._set_input_column(event, column_name, column_type);
    }

    /* _apply_state() {
        this._update_computation(null, this.state.computation.name);
        this._set_input_column(null, this.state.input_column.name, this.state.input_column.type);
        this._column_name_input.innerText = this.state.column_name;
    } */

    // State validation
    _is_valid_state() {
        const vals = values(this.state);
        return !vals.includes(null) && !vals.includes(undefined) && !vals.includes('');
    }

    // error handling
    _set_error_message(message, target) {
        target.innerText = message;
    }

    _clear_error_messages() {
        this._input_column_error_message.innerText = '';
        this._save_error_message.innerText = '';
    }

    // column_name
    _set_column_name() {
        const input = this._column_name_input;
        this.state['column_name'] = input.innerText;
        this._clear_error_messages();
    }

    _auto_name() {
        if (this.state.name_edited) {
            return;
        }
        if (this.state.input_column.length > 0) {
            let names = [];
            for (let column of this.state.input_column)
                names.push(column.name);
            this._column_name_input.innerText = `${this.state.computation.name}(${names.join(', ')})`;
        } else {
            this._column_name_input.innerText = '';
        }
        this._set_column_name();
    }

    _clear_column_name() {
        // TODO: clean up data flow
        const input = this._column_name_input;
        input.innerText = '';
        this.state['name_edited'] = false;
        this._set_column_name();
    }

    _set_input_column(event, name, type) {
        const computation = this.state.computation;
        const computation_type = computation.input_type;
        const inputs = this.state.input_column;

        const target = event.currentTarget;
        const index = Number.parseInt(target.getAttribute('data-index'));

        if (type !== computation_type) {
            this._register_inputs();
            this._set_error_message(
                `Input column type (${type}) must match computation input type (${computation_type}).`,
                this._input_column_error_message);
            target.classList.remove('dropped');
            return;
        }

        target.classList.add('dropped');

        const drop_target_hover = target.querySelector('.psp-cc-computation__drop-target-hover');
        if (drop_target_hover)
            drop_target_hover.removeAttribute('drop-target');

        target.innerHTML = '';

        const input_column = {
            name: name,
            type: type,
        };

        if (inputs[index]) {
            inputs[index] = input_column;
        } else {
            inputs.push(input_column);
        }

        this.state['input_column'] = inputs;
        this._auto_name();

        this.dispatchEvent(new CustomEvent('perspective-computed-column-update', {
            detail: {
                target,
                input_column
            }
        }));
    }

    // computation
    _update_computation(event, computation_name) {
        const select = this._computation_selector;

        if (!computation_name) {
            computation_name = select[select.selectedIndex].value;
        } else if (event === null || event === undefined) {
            select.value = computation_name;
        }

        const computation = Object.assign({}, this.computations[computation_name]);

        if (computation === undefined) {
            throw 'Undefined computation could not be set.';
        }

        const return_type = computation.return_type;

        this._computation_type.innerHTML = `<span class="${return_type}">${this.type_markers[return_type]}</span>`;

        this.state['computation'] = computation;
        this._clear_column_name();

        this._register_inputs();

        this._clear_error_messages();
    }

    /* edit
    _edit_computed_column(data) {
        this.state['computation'] = data.computation.name)
        this.state('column_name', data.column_name);
        this.state['input_column'] = {
            name: data.input_column,
            type: data.input_type
        };
        this.state['edit'] = true;
        this.state['name_edited'] = data.column_name !== `${data.computation.name}(${data.input_column})`;
        this._apply_state();
        //this.classList.add('edit');
    }

     delete - cannot be used without corresponding engine API
    _delete_computed_column() {
        const state = this._get_state();
        if (!state.edit) return;

        const computed_column = this._get_state();

        const event = new CustomEvent('perspective-computed-column-delete', {
            detail: computed_column
        });

        this.dispatchEvent(event);
        this._clear_state();
    } */

    // save
    _save_computed_column() {
        if(!this._is_valid_state()) {
            this._set_error_message('Missing parameters for computed column.', this._save_error_message);
            return;
        }

        const computed_column = this.state;

        const event = new CustomEvent('perspective-computed-column-save', {
            detail: computed_column
        });

        this.dispatchEvent(event);
    }

    // close
    _close_computed_column() {
        this.style.display = 'none';
        this._side_panel_actions.style.display = 'flex';

        this.classList.remove('edit');
        this._column_name_input.innerText = '';
        this._input_columns.innerHTML = '';

        for (let child of this._input_columns.children)
            child.classList.remove('dropped');

        this.state = new State();

        this._update_computation();
        this._clear_error_messages();
    }

    _register_ids() {
        this._side_panel_actions = document.querySelector('#side_panel__actions');
        this._close_button = this.querySelector('#psp-cc__close');
        this._column_name_input = this.querySelector('#psp-cc-name');
        this._computation_selector = this.querySelector('#psp-cc-computation__select');
        this._computation_type = this.querySelector('#psp-cc-computation__type');
        this._input_columns = this.querySelector('#psp-cc-computation-inputs');
        //this._delete_button = this.querySelector('#psp-cc-button-delete');
        this._save_button = this.querySelector('#psp-cc-button-save');
        this._input_column_error_message = this.querySelector('#psp-cc__error--input');
        this._save_error_message = this.querySelector('#psp-cc__error--save')
    }

    _register_callbacks() {
        this._close_button.addEventListener('click', this._close_computed_column.bind(this));
        this._computation_selector.addEventListener('change', this._update_computation.bind(this));
        this._column_name_input.addEventListener('keyup', event => {
            this.state['name_edited'] = this._column_name_input.innerText && this._column_name_input.innerText.length > 0;
            this._set_column_name(event);
        });
        //this._delete_button.addEventListener('click', this._delete_computed_column.bind(this));
        this._save_button.addEventListener('click', this._save_computed_column.bind(this));
    }
}