/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {bindTemplate, throttlePromise} from "./utils.js";

import template from "../html/expression_editor.html";
import style from "../less/expression_editor.less";

// Eslint complains here because we don't do anything, but actually we globally
// register this class as a CustomElement
@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class PerspectiveExpressionEditor extends HTMLElement {
    constructor() {
        super();
        this._value = "";
        this._ignored_nodes = ["BR", "DIV"];
    }

    connectedCallback() {
        this._register_ids();
        this._register_callbacks();
        this._editor_observer = new MutationObserver(this._resize_editor.bind(this));
        this._disable_save_button();
    }

    /**
     * Observe the editor when it is opened.
     */
    observe() {
        this._editor_observer.observe(this._edit_area, {
            attributes: true,
            attributeFilter: ["style"]
        });

        // Focus on the edit area immediately
        this._focus();
    }

    /**
     * Close the expressions editor.
     */
    close() {
        this.style.display = "none";
        this._side_panel_actions.style.display = "flex";
        this._disable_save_button();
        this._clear();
        // Disconnect the observer.
        this._editor_observer.disconnect();
    }

    /**
     * Given an expression schema from the viewer, assert that the expression
     * outputs a column with a valid type, and enable/disable the save button.
     *
     * @param {*} expression_schema
     */
    @throttlePromise
    async type_check_expression(expression_schema) {
        const expression = this._temp_expression;
        expression_schema[expression] ? this._enable_save_button() : this._disable_save_button();
    }

    /**
     * Validate the expression even when empty.
     *
     * @param {*} ev
     */
    @throttlePromise
    async _validate_expression(expression) {
        if (expression.length === 0) {
            this._disable_save_button();
            return;
        }

        // Store the expression temporarily so we can access it in
        // `type_check_expression()`.
        this._temp_expression = expression;

        // Take the parsed expression and type check it on the viewer,
        // which will call `type_check_expression()` with an expression schema.
        const event = new CustomEvent("perspective-expression-editor-type-check", {
            detail: {
                expression: this._temp_expression
            }
        });

        this.dispatchEvent(event);

        return;
    }

    /**
     * Given an expression string, render it into markup. Called only when the
     * expression is not an empty string.
     *
     * @param {String} expression
     */
    _render_expression(expression) {
        return `<span class="psp-expression__">${expression}</span>`;
    }

    /**
     * When the Save button is clicked, pass the expression to the viewer.
     *
     * @private
     */
    _save_expression() {
        if (this._save_button.getAttribute("disabled")) {
            return;
        }

        const expression = this._get_text();
        const parsed_expression = this._parsed_expression || [];

        const event = new CustomEvent("perspective-expression-editor-save", {
            detail: {
                expression: expression,
                parsed_expression: parsed_expression
            }
        });

        this.dispatchEvent(event);
    }

    /**
     * Dispatch an event on editor resize to notify the side panel, and
     * disconnect the observer.
     *
     * @private
     */
    _resize_editor() {
        const event = new CustomEvent("perspective-expression-editor-resize");
        this.dispatchEvent(event);
        this._editor_observer.disconnect();
    }

    _disable_save_button() {
        this._save_button.setAttribute("disabled", true);
    }

    _enable_save_button() {
        this._save_button.removeAttribute("disabled");
    }

    /**
     * Clear the edit area.
     */
    _clear() {
        this._edit_area.innerHTML = "";
    }

    /**
     * Analyze the content in the editor and redraw the selection caret every
     * time an `input` event is fired.
     *
     * @private
     */
    @throttlePromise
    _update_content() {
        const selection = this.shadowRoot.getSelection();
        const tokens = this._get_tokens(this._edit_area);

        let anchor_idx = null;
        let focus_idx = null;
        let current_idx = 0;

        for (const token of tokens) {
            if (token.node === selection.anchorNode) {
                anchor_idx = current_idx + selection.anchorOffset;
            }

            if (token.node === selection.focusNode) {
                focus_idx = current_idx + selection.focusOffset;
            }

            current_idx += token.text.length;
        }

        this._value = tokens.map(t => t.text).join("");

        if (this._value.length === 0) {
            // Clear input from the editor
            this._clear();
        } else {
            // Calls the `_render_expression` to transform a text string
            // to DOM tokens, but only when string.length > 0
            const markup = this._render_expression(this._value, tokens);
            this._edit_area.innerHTML = markup;
        }

        this.restore_selection(anchor_idx, focus_idx);

        // After the render has completed, validate the expression.
        this._validate_expression(this._get_text());
    }

    /**
     * After editor content has been rendered, "un-reset" the caret position
     * by returning it to where the user selected.
     *
     * @private
     * @param {Number} absolute_anchor_idx
     * @param {Number} absolute_focus_idx
     */
    restore_selection(absolute_anchor_idx, absolute_focus_idx) {
        const selection = this.shadowRoot.getSelection();
        const tokens = this._get_tokens(this._edit_area);
        let anchor_node = this._edit_area;
        let anchor_idx = 0;
        let focus_node = this._edit_area;
        let focus_idx = 0;
        let current_idx = 0;

        for (const token of tokens) {
            const start_idx = current_idx;
            const end_idx = start_idx + token.text.length;

            if (start_idx <= absolute_anchor_idx && absolute_anchor_idx <= end_idx) {
                anchor_node = token.node;
                anchor_idx = absolute_anchor_idx - start_idx;
            }

            if (start_idx <= absolute_focus_idx && absolute_focus_idx <= end_idx) {
                focus_node = token.node;
                focus_idx = absolute_focus_idx - start_idx;
            }

            current_idx += token.text.length;
        }

        selection.setBaseAndExtent(anchor_node, anchor_idx, focus_node, focus_idx);
    }

    /**
     * Returns the editor's text content.
     *
     * @private
     */
    _get_text() {
        return this._edit_area.textContent;
    }

    /**
     * Return an array of the element's tokens in traversal order, flattening
     * out any element trees.
     *
     * @private
     * @param {*} element
     */
    _get_tokens(element) {
        const tokens = [];
        for (const node of element.childNodes) {
            if (this._ignored_nodes.includes(node.nodeName)) continue;
            switch (node.nodeType) {
                case Node.TEXT_NODE:
                    tokens.push({text: node.nodeValue, node});
                    break;
                case Node.ELEMENT_NODE:
                    tokens.splice(tokens.length, 0, ...this._get_tokens(node));
                    break;
                default:
                    continue;
            }
        }
        return tokens;
    }

    /**
     * Set focus on the edit area.
     *
     * @private
     */
    _focus() {
        this._edit_area.focus();
    }

    /**
     * Dispatch a `perspective-expression-editor-keyup` event containing
     * the original `keyup` event in `event.details` so that other elements
     * can act when the editor receives input.
     *
     * @private
     * @param {*} ev a `keyup` event.
     */
    _keyup(ev) {
        const event = new CustomEvent("perspective-expression-editor-keyup", {
            detail: ev
        });
        this.dispatchEvent(event);
    }

    /**
     * Dispatch a `perspective-expression-editor-keydown` event containing
     * the original `keydown` event in `event.details` so that other elements
     * can act when the editor receives input.
     *
     * @private
     * @param {*} ev a `keydown` event.
     */
    _keydown(ev) {
        // Prevent reserved keys from triggering a re-render.
        // TODO: enable multi-line expressions in the editor.
        switch (ev.key) {
            case "Enter":
                {
                    ev.preventDefault();
                    ev.stopPropagation();
                    this._save_expression();
                }
                break;
            case "Tab":
            case "ArrowDown":
            case "ArrowUp":
                {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
                break;
        }

        const event = new CustomEvent("perspective-expression-editor-keydown", {
            detail: ev
        });

        this.dispatchEvent(event);
    }

    /**
     * When a column/text is dragged and dropped into the textbox, read it
     * properly and set selection state on the editor.
     *
     * @private
     * @param {*} event
     */
    _capture_drop_data(event) {
        this._focus();
        const data = event.dataTransfer.getData("text");
        if (data !== "") {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed) && parsed.length > 4) {
                    event.preventDefault();

                    // Escape single quotes in the column name
                    let column_name = parsed[0].replace(/'/g, "\\'");
                    this._edit_area.textContent += `$'${column_name}'`;
                }
            } catch (e) {
                // regular text, don't do anything as browser will handle
                // the `drop` event.
            } finally {
                // When text is dropped into the editor, set the caret
                // at the end of the editor's text content as the default
                // selection fires with the caret at the beginning.
                this._reset_selection();
                this._update_content();
            }
        }
    }

    _reset_selection() {
        const selection = this.shadowRoot.getSelection();
        selection.setBaseAndExtent(selection.anchorNode, this._edit_area.textContent.length, selection.focusNode, this._edit_area.textContent.length);
    }

    /**
     * Map DOM IDs to class properties.
     */
    _register_ids() {
        this._edit_area = this.shadowRoot.querySelector(".perspective-expression-editor__edit_area");
        this._close_button = this.shadowRoot.querySelector("#psp-expression-editor-close");
        this._save_button = this.shadowRoot.querySelector("#psp-expression-editor-button-save");
        this._side_panel_actions = this.parentElement.querySelector("#side_panel__actions");
    }

    /**
     * Map callback functions to class properties.
     */
    _register_callbacks() {
        this._edit_area.addEventListener("drop", this._capture_drop_data.bind(this));
        this._edit_area.addEventListener("input", this._update_content.bind(this));
        this._edit_area.addEventListener("keyup", this._keyup.bind(this));
        this._edit_area.addEventListener("keydown", this._keydown.bind(this));
        this._save_button.addEventListener("click", this._save_expression.bind(this));
        this._close_button.addEventListener("click", this.close.bind(this));
    }
}
