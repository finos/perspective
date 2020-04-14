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
        /**
         * TODO: remove awesomeplete temporarily and replace with a lit-html
         * template function that takes [tokens...] from chevrotain lexer and
         * returns <div><span>...</div> containing class-tagged, highlighted,
         * styled markup containing input.
         *
         * Requires ability to incrementally highlight, i.e. "Sales" + " should
         * have the first two tokens highlighted, and the third partial should
         * not be highlighted. Ultimately requires the ability to auto-suggest
         * column names, function names, operators, etc. Might be easier to
         * roll our own minimal autocomplete that is completely inline and
         * attaches to a `.psp-expression__partial` class span:
         *
         * "Sa|
         *  -------------
         *  | Sales     |
         *  | Saline    |
         *  | Santorini |
         *  -------------
         *
         * Best way to implement would be to write a single token-to-span
         * renderer - because syntax highlighting of an entire expression is
         * on a token-by-token basis, i.e. highlighting does not depend on the
         * relation of one token to another but is rather entirely
         * based on category of token, all we need to do is highlight a word
         * when it has been successfully parsed as a token, and unhighlight it
         * if it's been turned back into a partial token:
         *
         * +, -, sqrt() etc. are highlighted, but ab, sq, concat_ are not
         * highlighted. Similarly, sqrt -> sqr will become unhighlighted as
         * `sqr` is no longer a complete token.
         *
         * So:
         *
         * - Remove all autocomplete/validation functionality for now,
         * with an eye towards rewriting validation and autocomplete to be more
         * helpful in terms of messages and appearance.
         *
         * - Make sure the editor is as bare-bones as possible; provide good,
         * clean APIs to get, set, and append content as text (an array of
         * strings that contain the textContent of each individual span, joined
         * with? or without spaces, as long as `array.join()` can be parsed by
         * the parser) and as HTML, i.e. provide `HTMLElement` returning and
         * consuming methods that elide the difficulty of manipulating the
         * *complex* tree that is inside the editable div.
         *
         * - Implement all computed-column specific functionality in this
         * file, or another file that is imported into this one. Do NOT
         * implement column-specific functionality (like validation, type
         * checking, etc.) in the editor itself - the editor is supposed to be
         * abstract and not tied to a specific language or syntax.
         *
         * - Implement more robust state management inside this class - we are
         * only concerned with the expression in the editor at the moment, which
         * simplifies down the problem somewhat. We should be able to have a
         * this._tokens = [] which tracks each chevrotain token present in the
         * expression, and (for now) simply submits all tokens to be generated
         * into HTML - token_to_markup(tokens) => render(markup, this._editor)
         *
         * - Re-implement some sort of token autocompletion using Chevrotain
         * syntax suggestions - we need to make the suggestion method a little
         * more robust and fault-tolerant, as well as perform some sort of
         * markup on each token: add metadata to each token, perhaps? And then
         * custom generate HTML for the actual dropdown box to enable a question
         * mark icon that provides more detailed help tooltips?
         *
         */
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
            console.log(token);
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

    _keydown(ev) {
        if (ev.detail.key === "Enter") {
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
        this._expression_editor.addEventListener("perspective-expression-editor-keydown", this._keydown.bind(this));
        this._save_button.addEventListener("click", this._save_expression.bind(this));
    }
}
