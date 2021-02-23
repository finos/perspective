/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {bindTemplate, throttlePromise} from "../utils.js";
import template from "../../html/expression_widget.html";
import style from "../../less/xpression_widget.less";

// Eslint complains here because we don't do anything, but actually we globally
// register this class as a CustomElement
@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class ExpressionWidget extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this._register_ids();
        this._register_callbacks();
        this._expression_editor.set_renderer(this.render_expression.bind(this));
        this._editor_observer = new MutationObserver(this._resize_editor.bind(this));

        // Implement the `reposition` method, and bind it to the autocomplete
        // instance instead of the widget instance.
        this._enable_save_button();
    }

    /**
     * Observe the editor when the widget is opened.
     */
    _observe_editor() {
        this._editor_observer.observe(this._expression_editor, {
            attributes: true,
            attributeFilter: ["style"]
        });

        // Focus on the editor immediately
        this._expression_editor.focus();
    }

    /**
     * Dispatch an event on editor resize to notify the side panel, and
     * disconnect the observer.
     */
    _resize_editor() {
        const event = new CustomEvent("perspective-expression-editor-resize");
        this.dispatchEvent(event);
        this._editor_observer.disconnect();
    }

    /**
     * A stub for the widget to have access to `perspective-viewer`'s _get_type
     * method. Replaced by a reference to the proper method when the widget is
     * opened inside `perspective-viewer`.
     *
     * @param {String} name a column name
     */
    _get_type(name) {
        throw new Error(`Cannot get column type for "${name}".`);
    }

    /**
     * Given an expression string, render it into markup. Called only when the
     * expression is not an empty string.
     *
     * @param {String} expression
     */
    render_expression(expression) {
        return `<span class="psp-expression__">${expression}</span>`;
    }

    /**
     * Validate the expression after the
     * `perspective-expression-editor-rendered` has been fired. Fires on every
     * event, even when the expression is an empty string.
     * @param {*} ev
     */
    @throttlePromise
    async _validate_expression(ev) {
        const expression = ev.detail.text;

        if (expression.length === 0) {
            this._disable_save_button();
            return;
        }

        // Store the expression temporarily so we can access it in
        // `_type_check_expression()`.
        this._temp_expression = expression;

        // Take the parsed expression and type check it on the viewer,
        // which will call `_type_check_expression()` with an expression schema.
        const event = new CustomEvent("perspective-expression-editor-type-check", {
            detail: {
                expression: this._temp_expression
            }
        });

        this.dispatchEvent(event);

        return;
    }

    /**
     * Given an expression schema from the viewer, assert that the expression
     * outputs a column with a valid type, and enable/disable the save button.
     *
     * @param {*} expression_schema
     */
    @throttlePromise
    async _type_check_expression(expression_schema) {
        const expression = this._temp_expression;
        expression_schema[expression] ? this._enable_save_button() : this._disable_save_button();
    }

    _save_expression() {
        if (this._save_button.getAttribute("disabled")) {
            return;
        }
        const expression = this._expression_editor.get_text();
        const parsed_expression = this._parsed_expression || [];

        const event = new CustomEvent("perspective-expression-editor-save", {
            detail: {
                expression: expression,
                parsed_expression: parsed_expression
            }
        });

        this.dispatchEvent(event);
    }

    // UI actions
    _clear_expression_editor() {
        this._expression_editor.clear_content();
    }

    _close_expression_widget() {
        this.style.display = "none";
        this._side_panel_actions.style.display = "flex";
        this._disable_save_button();
        this._clear_expression_editor();
        // Disconnect the observer.
        this._editor_observer.disconnect();
    }

    _disable_save_button() {
        this._save_button.setAttribute("disabled", true);
    }

    _enable_save_button() {
        this._save_button.removeAttribute("disabled");
    }

    _editor_keydown(ev) {
        // All operations need to be done on `ev.detail`, not `ev`, as the event
        // is passed through from the editor.
        switch (ev.detail.key) {
            case "z": {
                // prevent Ctrl/Command-z for undo, as it has no effect
                // inside the editor but will fire keypress events and mess
                // up the flow.
                if (ev.detail.metaKey === true || ev.detail.ctrlKey === true) {
                    ev.detail.preventDefault();
                    ev.detail.stopPropagation();
                }
            }
            default:
                break;
        }
    }

    /**
     * Map DOM IDs to class properties.
     */
    _register_ids() {
        this._side_panel_actions = this.parentElement.querySelector("#side_panel__actions");
        this._close_button = this.shadowRoot.querySelector("#psp-computed-expression-widget-close");
        this._expression_editor = this.shadowRoot.querySelector("perspective-expression-editor");
        this._save_button = this.shadowRoot.querySelector("#psp-computed-expression-widget-button-save");
    }

    /**
     * Map callback functions to class properties.
     */
    _register_callbacks() {
        this._close_button.addEventListener("click", this._close_expression_widget.bind(this));
        this._expression_editor.addEventListener("perspective-expression-editor-rendered", this._validate_expression.bind(this));
        this._expression_editor.addEventListener("perspective-expression-editor-keydown", this._editor_keydown.bind(this));
        this._save_button.addEventListener("click", this._save_expression.bind(this));
    }
}
