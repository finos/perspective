/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {bindTemplate} from "./utils.js";
import State from "./computed_column/state.js";
import {Computation, FORMATTER} from "./computed_column/computation.js";

import template from "../html/computed_column.html";

import style from "../less/computed_column.less";

import {dragleave} from "./viewer/dragdrop.js";
import {html, render} from "lit-html";

/**
 * Metadata for computed functions, used by the UI and when the
 * `computed-column` attribute is set manually.
 */
export const COMPUTATIONS = {
    hour_of_day: new Computation("Hour of Day", x => `hour_of_day(${x})`, "datetime", "integer", ["Time"]),
    day_of_week: new Computation("Day of Week", x => `day_of_week(${x})`, "datetime", "string", ["Time"]),
    month_of_year: new Computation("Month of Year", x => `month_of_year(${x})`, "datetime", "string", ["Time"]),
    second_bucket: new Computation("Bucket (s)", x => `second_bucket(${x})`, "datetime", "datetime", ["Time"]),
    minute_bucket: new Computation("Bucket (m)", x => `minute_bucket(${x})`, "datetime", "datetime", ["Time"]),
    hour_bucket: new Computation("Bucket (h)", x => `hour_bucket(${x})`, "datetime", "datetime", ["Time"]),
    day_bucket: new Computation("Bucket (D)", x => `day_bucket(${x})`, "datetime", "date", ["Time"]),
    week_bucket: new Computation("Bucket (W)", x => `week_bucket(${x})`, "datetime", "date", ["Time"]),
    month_bucket: new Computation("Bucket (M)", x => `month_bucket(${x})`, "datetime", "date", ["Time"]),
    year_bucket: new Computation("Bucket (Y)", x => `year_bucket(${x})`, "datetime", "date", ["Time"]),
    "10_bucket": new Computation("Bucket (10)", x => `bin10(${x})`, "float", "float", ["Math"]),
    "100_bucket": new Computation("Bucket (100)", x => `bin100(${x})`, "float", "float", ["Math"]),
    "1000_bucket": new Computation("Bucket (1000)", x => `bin1000(${x})`, "float", "float", ["Math"]),
    "0.1_bucket": new Computation("Bucket (1/10)", x => `bin10th(${x})`, "float", "float", ["Math"]),
    "0.01_bucket": new Computation("Bucket (1/100)", x => `bin100th(${x})`, "float", "float", ["Math"]),
    "0.001_bucket": new Computation("Bucket (1/1000)", x => `bin1000th(${x})`, "float", "float", ["Math"]),
    add: new Computation("+", (x, y) => `(${x} + ${y})`, "float", "float", ["Math"], 2),
    subtract: new Computation("-", (x, y) => `(${x} - ${y})`, "float", "float", ["Math"], 2),
    multiply: new Computation("*", (x, y) => `(${x} * ${y})`, "float", "float", ["Math"], 2),
    divide: new Computation("/", (x, y) => `(${x} / ${y})`, "float", "float", ["Math"], 2),
    invert: new Computation("1/x", x => `(1 / ${x})`, "float", "float", ["Math"], 1),
    pow: new Computation("x^2", x => `(${x} ^ 2)`, "float", "float", ["Math"], 1),
    sqrt: new Computation("sqrt", x => `sqrt(${x})`, "float", "float", ["Math"], 1),
    abs: new Computation("abs", x => `abs(${x})`, "float", "float", ["Math"], 1),
    percent_a_of_b: new Computation("%", (x, y) => `(${x} %% ${y})`, "float", "float", ["Math"], 2),
    uppercase: new Computation("Uppercase", x => `uppercase(${x})`, "string", "string", ["Text"]),
    lowercase: new Computation("Lowercase", x => `lowercase(${x})`, "string", "string", ["Text"]),
    length: new Computation("length", x => `length(${x})`, "string", "integer", ["Text"]),
    concat_space: new Computation("concat_space", x => `concat_space(${x})`, "string", "string", ["Text"], 2),
    concat_comma: new Computation("concat_comma", x => `concat_comma(${x})`, "string", "string", ["Text"], 2)
};

function _insert_tree(name, elem, tree) {
    let pointer = tree;
    const path = elem.category;
    for (const category of path) {
        pointer = pointer[category] = pointer[category] || {};
    }
    pointer[name] = elem;
}

function _get_tree() {
    const tree = {};
    for (const comp in COMPUTATIONS) {
        _insert_tree(comp, COMPUTATIONS[comp], tree);
    }
    return tree;
}

let TREE = _get_tree();

// Eslint complains here because we don't do anything, but actually we globally
// register this class as a CustomElement
@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class ComputedColumn extends HTMLElement {
    constructor() {
        super();

        this.state = new State();
        this.column_names = [];

        this.type_markers = {
            float: "123",
            integer: "123",
            string: "abc",
            boolean: "t/f",
            datetime: "mdy",
            date: "mdy"
        };
    }

    get computations() {
        return COMPUTATIONS;
    }

    connectedCallback() {
        this._register_ids();
        render(Array.from(this._selector_template()), this._computation_selector);
        this._register_callbacks();
        this._update_computation(null);
        this._register_inputs();
    }

    _register_computations() {
        TREE = _get_tree();
        render(Array.from(this._selector_template()), this._computation_selector);
    }

    *_selector_template(tree = TREE) {
        for (const [category, comp] of Object.entries(tree)) {
            if (comp.computed_function_name) {
                yield html`
                    <option value=${category}>${comp.computed_function_name}</option>
                `;
            } else {
                yield html`
                    <optgroup label=${category}>${Array.from(this._selector_template(comp))}</optgroup>
                `;
            }
        }
    }

    // Generate input column holders, reset input column state
    _register_inputs() {
        this._clear_error_messages();
        this._disable_save_button();
        this._input_columns.innerHTML = "";
        const computation = this.state.computation;
        const input_type = computation.input_type;

        this.state.input_columns = [];
        this.state.swap_target = false;

        for (let i = 0; i < computation.num_params; i++) {
            this._input_columns.innerHTML += `<div class="psp-cc-computation__input-column"
                      data-index="${i}"
                      drop-target>
                      <span class="psp-label__requiredType ${input_type}"></span>
                      <span class="psp-label__placeholder">Param ${i + 1}</span>
                      <div class="psp-cc-computation__drop-target-hover"></div>
                </div>`;
        }

        for (let column of this._input_columns.children) {
            column.addEventListener("drop", this._drop_column.bind(this));
            column.addEventListener("dragstart", this._drag_column.bind(this));
            column.addEventListener("dragend", this._remove_column.bind(this));
            column.addEventListener("dragover", this._hover_column.bind(this));
            column.addEventListener("dragleave", this._pass_column.bind(this));
        }

        this._clear_column_name();
    }

    // Drag & Drop
    _parse_data_transfer(data) {
        const column_data = JSON.parse(data);
        if (!column_data) return;

        return {
            column_name: column_data[0],
            column_type: column_data[3]
        };
    }

    _drag_column(event) {
        // called when columns are dragged from inside the UI
        if (this.state.computation.num_params > 1) {
            // if there is a chance of a swap happening, cache the swap target
            this.state.swap_target = event.currentTarget;
        }
    }

    _hover_column(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";

        const drop_target = event.currentTarget;
        const drop_target_hover = drop_target.querySelector(".psp-cc-computation__drop-target-hover");
        if (drop_target.className !== "dropping") {
            //event.currentTarget.classList.remove('dropped');
            drop_target.classList.add("dropping");
        }
        if (drop_target_hover && !drop_target_hover.hasAttribute("drop-target")) {
            drop_target_hover.toggleAttribute("drop-target", "true");
        }

        if (drop_target.children.length === 2) {
            // drop_target_hover is the blue box
            drop_target.parentNode.insertBefore(drop_target_hover, drop_target.nextSibling);
        }
    }

    _drop_column(event) {
        const target = event.currentTarget;
        event.preventDefault();

        target.classList.remove("dropping");

        const is_swap = this.state.swap_target !== undefined && target.innerHTML.indexOf("perspective-row") > -1;

        // column must match return type of computation
        const data = this._parse_data_transfer(event.dataTransfer.getData("text"));
        if (!data) return;

        if (is_swap) {
            const current_column = target.children[0];
            const current_column_name = current_column.getAttribute("name");
            const current_column_type = current_column.getAttribute("type");
            event.swapTarget = this.state.swap_target;

            // take the column at the drop target, and set it to the column
            // being swapped
            this._set_input_column(event, current_column_name, current_column_type);

            // reset swap_target and currentTarget
            this.state.swap_target = false;
            delete event.swapTarget;
        }

        this._set_input_column(event, data.column_name, data.column_type);
    }

    deselect_column(name) {
        this.state.input_columns = this.state.input_columns.map(x => (x && x.name === name ? undefined : x));
        this._apply_state(this.state.input_columns, this.state.computation);
    }

    // Called when a column is dragged out of the computed column UI
    _remove_column(event) {
        event.currentTarget.classList.remove("dropping");
    }

    // Called when the column passes over and then leaves the drop target
    _pass_column(event) {
        const src = event.currentTarget;
        // are we inside the column? if we are, prevent further calls which
        // cause flickering
        const bounds = src.getBoundingClientRect();
        const inside_x = event.pageX >= bounds.left && event.pageX <= bounds.right - 2;
        const inside_y = event.pageY >= bounds.top && event.pageY <= bounds.bottom - 2;
        if (inside_x && inside_y) {
            return;
        }
        if (src !== null && src.nodeName !== "SPAN") {
            src.classList.remove("dropping");
            const drop_target_hover = src.querySelector(".psp-cc-computation__drop-target-hover");
            if (drop_target_hover) drop_target_hover.removeAttribute("drop-target");
        }
    }

    // When state changes are made manually, apply them to the UI
    _apply_state(columns, computation, name) {
        this._update_computation(null, this.state.computed_function_name);
        this.state["input_columns"] = columns;
        const inputs = this._input_columns.children;

        for (let i = 0; i < this.state["input_columns"].length; i++) {
            if (this.state["input_columns"][i] !== undefined) {
                this._set_input_column({currentTarget: inputs[i]}, this.state["input_columns"][i].name, this.state["input_columns"][i].type);
            }
        }

        this._column_name_input.innerText = name || "";
        this._set_column_name();
        this.state["name_edited"] = name !== undefined;

        if (this.state.is_valid()) {
            this._enable_save_button();
        }
    }

    // column_name
    _set_column_name() {
        const input = this._column_name_input;
        let name = input.innerText;
        if (name.length == 0) {
            this.state["column_name"] = undefined;
            this._disable_save_button();
            return;
        }
        this.state["column_name"] = name;

        if (this.state.is_valid()) {
            this._enable_save_button();
        }
    }

    _auto_column_name() {
        if (this.state.name_edited) {
            return;
        }
        if (this.state.input_columns.length > 0) {
            let names = [];
            for (let column of this.state.input_columns) names.push(column.name);
            if (this.state.computation[FORMATTER]) {
                this._column_name_input.innerText = this.state.computation[FORMATTER].apply(undefined, names);
            } else {
                this._column_name_input.innerText = `${this.state.computation.computed_function_name}(${names.join(", ")})`;
            }
        } else {
            this._column_name_input.innerText = "";
        }
        this._set_column_name();
    }

    _clear_column_name() {
        const input = this._column_name_input;
        input.innerText = "";
        this.state["name_edited"] = false;
        this._set_column_name();
    }

    // input column
    _set_input_column(event, name, type) {
        const computation = this.state.computation;
        const computation_type = computation.input_type;
        const inputs = this.state.input_columns;

        let target;
        if (event.swapTarget) {
            target = event.swapTarget;
        } else {
            target = event.currentTarget;
        }

        const index = Number.parseInt(target.getAttribute("data-index"));

        if (
            (computation_type !== "float" && computation_type !== "datetime" && type !== computation_type) ||
            (computation_type === "float" && type !== "float" && type !== "integer") ||
            (computation_type === "datetime" && type !== "datetime" && type !== "date")
        ) {
            this._register_inputs();
            target.classList.remove("dropped");
            return;
        }

        target.classList.add("dropped");

        const drop_target_hover = target.querySelector(".psp-cc-computation__drop-target-hover");
        if (drop_target_hover) drop_target_hover.removeAttribute("drop-target");

        target.innerHTML = "";

        const column = {
            name: name,
            type: type
        };

        inputs[index] = column;

        this.state["input_columns"] = inputs;
        if (inputs.filter(x => x).length === computation.num_params) {
            this._auto_column_name();
        }

        this.dispatchEvent(
            new CustomEvent("perspective-computed-column-update", {
                detail: {
                    target,
                    column
                }
            })
        );

        if (this.state.is_valid()) {
            this._enable_save_button();
        }
    }

    // computation
    _update_computation(event, computation_name) {
        const select = this._computation_selector;

        if (!computation_name) {
            computation_name = select[select.selectedIndex].value;
        } else if (event === null || event === undefined) {
            select.value = computation_name;
        }

        const computation = Object.assign({}, COMPUTATIONS[computation_name]);

        if (computation === undefined) {
            throw "Undefined computation could not be set.";
        }

        const num_params = computation.num_params;
        const input_type = computation.input_type;
        const return_type = computation.return_type;
        let reset_inputs = true;

        if (this.state["computation"]) {
            // do we need to reset the input? if types/num_params differ then
            // yes
            reset_inputs = input_type !== this.state["computation"].input_type || num_params !== this.state["computation"].num_params;
        }

        this._computation_type.innerHTML = `<span class="${return_type}">${this.type_markers[return_type]}</span>`;

        this.state["computation"] = computation;
        this.state.computed_function_name = computation_name;

        if (reset_inputs || event === null) {
            this._register_inputs();
            this._clear_column_name();
        } else {
            this._auto_column_name();
        }
    }

    // error message handlers
    _set_error_message(message, target) {
        if (target) {
            target.innerText = message;
            target.style.display = "block";
        }
    }

    _clear_error_messages() {
        this._column_name_error.innerText = "";
        this._column_name_error.style.display = "none";
    }

    // save button handlers
    _disable_save_button() {
        this._save_button.toggleAttribute("disabled", true);
    }

    _enable_save_button() {
        this._save_button.removeAttribute("disabled");
    }

    // save
    _save_computed_column() {
        if (this.state.is_valid()) {
            const computed_column = this.state;

            if (this.column_names.includes(this.state.column_name)) {
                this._set_error_message("Column names must be unique.", this._column_name_error);
                return;
            }

            this._clear_error_messages();

            const event = new CustomEvent("perspective-computed-column-save", {
                detail: {
                    name: computed_column.column_name,
                    inputs: computed_column.input_columns.map(x => x.name),
                    computed_function_name: computed_column.computed_function_name
                }
            });
            this.dispatchEvent(event);

            this.column_names.push(computed_column.column_name);
        }
    }

    // close
    _close_computed_column() {
        this.style.display = "none";
        this._side_panel_actions.style.display = "flex";

        this.classList.remove("edit");
        this._column_name_input.innerText = "";
        this._input_columns.innerHTML = "";

        for (let child of this._input_columns.children) child.classList.remove("dropped");

        this.state = new State();
        this._update_computation();
    }

    _register_ids() {
        this._side_panel_actions = this.parentElement.querySelector("#side_panel__actions");
        this._close_button = this.shadowRoot.querySelector("#psp-cc__close");
        this._column_name_input = this.shadowRoot.querySelector("#psp-cc-name");
        this._column_name_error = this.shadowRoot.querySelector("#psp-cc__error--name");
        this._computation_selector = this.shadowRoot.querySelector("#psp-cc-computation__select");
        this._computation_type = this.shadowRoot.querySelector("#psp-cc-computation__type");
        this._input_columns = this.shadowRoot.querySelector("#psp-cc-computation-inputs");
        //this._delete_button =
        //this.shadowRoot.querySelector('#psp-cc-button-delete');
        this._save_button = this.shadowRoot.querySelector("#psp-cc-button-save");
    }

    _register_callbacks() {
        this._close_button.addEventListener("click", this._close_computed_column.bind(this));
        this._computation_selector.addEventListener("change", this._update_computation.bind(this));
        this._column_name_input.addEventListener("dragover", dragleave.bind(this));
        this._column_name_input.addEventListener("keyup", event => {
            this.state["name_edited"] = this._column_name_input.innerText && this._column_name_input.innerText.length > 0;
            this._set_column_name(event);
        });
        //this._delete_button.addEventListener('click',
        //this._delete_computed_column.bind(this));
        this._save_button.addEventListener("click", this._save_computed_column.bind(this));
    }
}
