/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {bindTemplate, throttlePromise} from "../utils.js";

import template from "../../html/computed_expression_widget.html";

import style from "../../less/computed_expression_widget.less";

import {ComputedExpressionColumnLexer, ColumnNameTokenType, FunctionTokenType, OperatorTokenType} from "./lexer";

import {expression_to_computed_column_config} from "./visitor";

import {tokenMatcher} from "chevrotain";

// Eslint complains here because we don't do anything, but actually we globally
// register this class as a CustomElement
@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class ComputedExpressionWidget extends HTMLElement {
    constructor() {
        super();

        this._parsed_expression = undefined;
        this.expressions = [];
        this._valid = false;
    }

    connectedCallback() {
        this._register_ids();
        this._register_callbacks();
        this._expression_editor.set_renderer(this.render_expression.bind(this));
        this._editor_observer = new MutationObserver(this._resize_editor.bind(this));
    }

    /**
     * Observe the editor when the widget is opened.
     */
    _observe_editor() {
        this._editor_observer.observe(this._expression_editor, {
            attributes: true,
            attributeFilter: ["style"]
        });
    }

    /**
     * Dispatch an event on editor resize to notify the side panel, and
     * disconnect the observer.
     */
    _resize_editor() {
        const event = new CustomEvent("perspective-computed-expression-resize");
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

    render_expression(expression) {
        if (expression.length === 0) {
            this._clear_error();
            return "";
        }

        const lex_result = ComputedExpressionColumnLexer.tokenize(expression);

        if (lex_result.errors.length > 0) {
            const message = lex_result.errors.map(e => (e.message ? e.message : JSON.stringify(e))).join("\n");
            return this.render_error(expression, message);
        }

        const output = [];
        const names = this._get_view_all_column_names();

        for (const token of lex_result.tokens) {
            let class_name = "fragment";
            let content = token.image;
            if (tokenMatcher(token, FunctionTokenType)) {
                class_name = "function";
            } else if (tokenMatcher(token, OperatorTokenType)) {
                class_name = "operator";
            } else if (tokenMatcher(token, ColumnNameTokenType)) {
                const column_name = token.payload;
                const exists = names.includes(column_name);

                if (!exists) {
                    class_name = "errored";
                } else {
                    class_name = `column_name ${this._get_type(column_name)}`;
                }
            }
            output.push(`<span class="psp-expression__${class_name}">${content}</span>`);
        }

        return output.join("");
    }

    render_error(expression, error) {
        this._set_error(error, this._error);
        return `<span class="psp-expression__errored">${expression}</span>`;
    }

    // Expression actions
    @throttlePromise
    async _validate_expression(ev) {
        const expression = ev.detail.text;

        if (expression.length === 0) {
            this._clear_error();
            return;
        }

        try {
            // Use this just for validation. On anything short of a massive
            // expression, this should have no performance impact as we
            // share an instance of the parser throughout the viewer.
            this._parsed_expression = expression_to_computed_column_config(expression);
        } catch (e) {
            const message = e.message ? e.message : JSON.stringify(e);
            this._set_error(message, this._error);
            return;
        }

        // Take the parsed expression and type check it on the viewer,
        // which will call `_type_check_expression()` with a computed_schema.
        const event = new CustomEvent("perspective-computed-expression-type-check", {
            detail: {
                parsed_expression: this._parsed_expression
            }
        });

        this.dispatchEvent(event);

        return;
    }

    @throttlePromise
    async _type_check_expression(computed_schema, expected_types) {
        const parsed = this._parsed_expression || [];
        const invalid = [];

        for (const column of parsed) {
            if (!computed_schema[column.column]) {
                invalid.push(column.column);
            }
        }

        if (invalid.length > 0) {
            let message = "TypeError:\n";
            for (const col of invalid) {
                message += `- \`${col}\` expected input column types ${expected_types[col].join("/")}\n`;
            }
            this._set_error(message, this._error);
        } else {
            this._clear_error();
            this._enable_save_button();
        }
    }

    _save_expression() {
        if (!this._valid || this._save_button.getAttribute("disabled")) {
            return;
        }
        const expression = this._expression_editor.get_text();
        const parsed_expression = this._parsed_expression || [];

        const event = new CustomEvent("perspective-computed-expression-save", {
            detail: {
                expression: expression,
                parsed_expression: parsed_expression
            }
        });

        this.dispatchEvent(event);

        this.expressions.push(expression);
    }

    // UI actions
    _clear_expression_editor() {
        this._expression_editor.clear_content();
    }

    _close_expression_widget() {
        this.style.display = "none";
        this._side_panel_actions.style.display = "flex";
        this._clear_error();
        this._disable_save_button();
        this._clear_expression_editor();
        // Disconnect the observer.
        this._editor_observer.disconnect();
    }

    /**
     * Given an error message, display it in the DOM and disable the
     * save button.
     *
     * @param {String} error An error message to be displayed.
     * @param {HTMLElement} target an `HTMLElement` that displays the `error`
     * message.
     */
    _set_error(error, target) {
        if (target) {
            target.innerText = error;
            target.style.display = "block";
            this._disable_save_button();
        }
    }

    _clear_error() {
        this._error.innerText = "";
        this._error.style.display = "none";
    }

    _disable_save_button() {
        this._save_button.setAttribute("disabled", true);
        this._valid = false;
    }

    _enable_save_button() {
        this._save_button.removeAttribute("disabled");
        this._valid = true;
    }

    _editor_keydown(ev) {
        if (ev.detail.key === "Enter") {
            // Save the expression when enter is typed.
            ev.detail.preventDefault();
            ev.detail.stopPropagation();
            this._save_expression();
        }
    }

    /**
     * Map DOM IDs to class properties.
     */
    _register_ids() {
        this._side_panel_actions = this.parentElement.querySelector("#side_panel__actions");
        this._close_button = this.shadowRoot.querySelector("#psp-computed-expression-widget-close");
        this._expression_editor = this.shadowRoot.querySelector("perspective-expression-editor");
        this._error = this.shadowRoot.querySelector("#psp-computed-expression-widget-error");
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
