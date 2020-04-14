/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import Awesomplete from "awesomplete";

import {bindTemplate, throttlePromise} from "./utils.js";

import template from "../html/computed_expression_widget.html";

import style from "../less/computed_expression_widget.less";

import {function_tokens, operator_tokens} from "./computed_expressions/lexer";

import {expression_to_computed_column_config} from "./computed_expressions/visitor";

import {extract_partial_function, get_autocomplete_suggestions} from "./computed_expressions/autocomplete";

// Eslint complains here because we don't do anything, but actually we globally
// register this class as a CustomElement
@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class ComputedExpressionWidget extends HTMLElement {
    constructor() {
        super();

        this._parsed_expression = undefined;
        this.expressions = [];
    }

    connectedCallback() {
        this._register_ids();
        this._register_callbacks();
        this._textarea_observer = new MutationObserver(this._resize_textarea.bind(this));
        this._awesomplete_exceptions = ["(", ")", ","];
        this._awesomplete = new Awesomplete(this._expression_input, {
            autoFirst: true,
            minChars: 0,
            maxItems: 30,
            sort: false,
            filter: (suggestion, input) => {
                if (input.length === 0) {
                    return true;
                }

                if (input && this._awesomplete_exceptions.includes(suggestion.value) && !this._awesomplete_exceptions.includes(input[input.length - 1])) {
                    return true;
                }

                const partial = extract_partial_function(input);

                if (operator_tokens.includes(suggestion.value)) {
                    return true;
                }

                if (!partial || partial.length === 0 || partial.indexOf('"') !== -1) {
                    return false;
                }

                return suggestion.value.indexOf(partial) !== -1;
            },
            replace: text => {
                if (text.value === ")") {
                    this._expression_input.value += text.value;
                    return;
                }

                const last_input = extract_partial_function(this._expression_input.value);
                const add_parenthesis = function_tokens.includes(text.value);

                if (!last_input) {
                    const space = this._expression_input.value.length > 0 ? " " : "";
                    this._expression_input.value += `${space}${text}`;
                } else {
                    const old_value = this._expression_input.value;
                    const new_value = old_value.substring(0, old_value.length - last_input.length) + text;
                    this._expression_input.value = new_value;
                }

                if (add_parenthesis) {
                    this._expression_input.value += "(";
                }

                // Clicking on a partial can never complete the expression,
                // as there is no column name autocompletion
                this._disable_save_button();
            }
        });
        this._awesomplete.close();
    }

    /**
     * Observe the textarea when the widget is opened.
     */
    _observe_textarea() {
        this._awesomplete.close();
        this._textarea_observer.observe(this._expression_input, {
            attributes: true,
            attributeFilter: ["style"]
        });
    }

    /**
     * Dispatch an event on textarea resize to notify the side panel, and
     * disconnect the observer.
     */
    _resize_textarea() {
        const event = new CustomEvent("perspective-computed-expression-resize");
        this.dispatchEvent(event);
        this._textarea_observer.disconnect();
    }

    /**
     * When a column/text is dragged and dropped into the textbox, read it
     * properly.
     *
     * @param {*} event
     */
    _capture_drop_data(event) {
        const data = event.dataTransfer.getData("text");
        if (data !== "") {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed) && parsed.length > 4) {
                    event.preventDefault();
                    this._expression_input.value += `"${parsed[0]}"`;
                }
            } catch (e) {
                // regular text, don't do anything as browser will handle
            } finally {
                this._validate_expression();
            }
        }
    }

    // Expression actions
    @throttlePromise
    async _validate_expression() {
        const expression = this._expression_input.value;

        this._clear_autocomplete_suggestions();

        if (expression.length === 0) {
            // Show all suggestions
            const suggestions = get_autocomplete_suggestions(expression);
            this._set_autocomplete_suggestions(suggestions);
            this._clear_error_messages();
            this._enable_save_button();
            return;
        }

        try {
            // Use this just for validation. On anything short of a massive
            // expression, this should have no performance impact as we
            // share an instance of the parser throughout the viewer.
            this._parsed_expression = expression_to_computed_column_config(expression);
        } catch (e) {
            this._disable_save_button();
            // If input is invalid, try to get suggestions
            const suggestions = get_autocomplete_suggestions(expression);

            if (suggestions && suggestions.length > 0) {
                this._set_autocomplete_suggestions(suggestions);
                this._clear_error_messages();
                return;
            } else {
                this._clear_autocomplete_suggestions();
                const message = e.message ? e.message : JSON.stringify(e);
                this._set_error_message(message, this._error);
                return;
            }
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
            this._disable_save_button();
            this._set_error_message(message, this._error);
        } else {
            this._clear_error_messages();
            this._enable_save_button();
        }
    }

    /**
     * DEPRECATED: Clears all expressions from the viewer.
     */
    _remove_all_expressions() {
        const event = new CustomEvent("perspective-computed-expression-remove");
        this.dispatchEvent(event);
        this.expressions = [];
    }

    _save_expression() {
        const expression = this._expression_input.value;
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
    _clear_expression_input() {
        const input = this._expression_input;
        input.value = "";
    }

    _close_expression_widget() {
        this.style.display = "none";
        this._side_panel_actions.style.display = "flex";
        this._clear_error_messages();
        this._clear_expression_input();
        // Disconnect the observer.
        this._textarea_observer.disconnect();
    }

    _set_autocomplete_suggestions(suggestions) {
        this._awesomplete.list = suggestions;
        this._awesomplete.evaluate();
    }

    _clear_autocomplete_suggestions() {
        this._awesomplete.list = [];
        this._awesomplete.close();
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

    /**
     * Map DOM IDs to class properties.
     */
    _register_ids() {
        this._side_panel_actions = this.parentElement.querySelector("#side_panel__actions");
        this._close_button = this.shadowRoot.querySelector("#psp-computed-expression-widget-close");
        this._expression_input = this.shadowRoot.querySelector("#psp-computed-expression-widget-input");
        this._error = this.shadowRoot.querySelector("#psp-computed-expression-widget-error");
        this._save_button = this.shadowRoot.querySelector("#psp-computed-expression-widget-button-save");
    }

    /**
     * Map callback functions to class properties.
     */
    _register_callbacks() {
        this._close_button.addEventListener("click", this._close_expression_widget.bind(this));
        this._expression_input.addEventListener("focus", this._validate_expression.bind(this));
        this._expression_input.addEventListener("keyup", this._validate_expression.bind(this));
        this._expression_input.addEventListener("drop", this._capture_drop_data.bind(this));
        this._save_button.addEventListener("click", this._save_expression.bind(this));
    }
}
