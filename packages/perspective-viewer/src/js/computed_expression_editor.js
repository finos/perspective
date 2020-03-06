/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {bindTemplate} from "./utils.js";

import template from "../html/computed_expression_editor.html";

import style from "../less/computed_expression_editor.less";

// Eslint complains here because we don't do anything, but actually we globally
// register this class as a CustomElement
@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class ComputedExpressionEditor extends HTMLElement {
    constructor() {
        super();

        this.expressions = [];
        this.column_names = [];
    }

    connectedCallback() {
        this._register_ids();
        this._register_callbacks();
        //this._register_inputs();
    }

    // Expression actions
    _validate_expression() {
        const expression = this._expression_input.value;
        if (!this.expressions.includes(expression)) {
            this._clear_error_messages();
            this._enable_save_button();
        } else {
            this._disable_save_button();
            this._set_error_message("Expression already exists", this._error);
        }
    }

    _remove_all_expressions() {
        const event = new CustomEvent("perspective-computed-expression-remove");
        this.dispatchEvent(event);
        this.expressions = [];
    }

    _save_expression() {
        const expression = this._expression_input.value;

        const event = new CustomEvent("perspective-computed-expression-save", {
            detail: {expression: expression}
        });
        this.dispatchEvent(event);

        this.expressions.push(expression);
    }

    // UI actions
    _clear_expression_input() {
        const input = this._expression_input;
        input.value = "";
    }

    _close_expression_editor() {
        this.style.display = "none";
        this._side_panel_actions.style.display = "flex";
        this._clear_error_messages();
        this._clear_expression_input();
    }

    // error message handlers
    _set_error_message(message, target) {
        if (target) {
            target.innerText = message;
            target.style.display = "block";
        }
    }

    _clear_error_messages() {
        this._error.innerText = "";
        this._error.style.display = "none";
    }

    // Save button handlers
    _disable_save_button() {
        this._save_button.toggleAttribute("disabled", true);
    }

    _enable_save_button() {
        this._save_button.removeAttribute("disabled");
    }

    // Remove button handlers
    _disable_remove_button() {
        this._remove_button.toggleAttribute("disabled", true);
    }

    _enable_remove_button() {
        this._remove_button.removeAttribute("disabled");
    }

    /**
     * Map DOM IDs to class properties.
     */
    _register_ids() {
        this._side_panel_actions = this.parentElement.querySelector("#side_panel__actions");
        this._close_button = this.shadowRoot.querySelector("#psp-expression-close");
        this._expression_input = this.shadowRoot.querySelector("#psp-expression-input");
        this._error = this.shadowRoot.querySelector("#psp-expression-error");
        this._save_button = this.shadowRoot.querySelector("#psp-expression-button-save");
        this._remove_button = this.shadowRoot.querySelector("#psp-expression-button-remove");
    }

    /**
     * Map callback functions to class properties.
     */
    _register_callbacks() {
        this._close_button.addEventListener("click", this._close_expression_editor.bind(this));
        this._expression_input.addEventListener("keyup", this._validate_expression.bind(this));
        this._remove_button.addEventListener("click", this._remove_all_expressions.bind(this));
        this._save_button.addEventListener("click", this._save_expression.bind(this));
    }
}
