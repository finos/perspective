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
    async _validate_expression() {
        const expression = this._edit_area.value;

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

        const expression = this._edit_area.value;
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
        this._edit_area.value = "";
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
     * Enable tab indentation support and shift-enter to save.
     *
     * @private
     * @param {*} ev a `keydown` event.
     */
    _keydown(ev) {
        switch (ev.key) {
            case "Enter":
                {
                    if (ev.shiftKey) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        this._save_expression();
                    }
                }
                break;
            case "Tab": {
                ev.preventDefault();
                const start = this._edit_area.selectionStart;
                const end = this._edit_area.selectionEnd;
                this._edit_area.value = this._edit_area.value.substring(0, start) + "    " + this._edit_area.value.substring(end);
                this._edit_area.setSelectionRange(start + 1, start + 1);
            }
        }
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

                    // Escape double quotes in the column name
                    let column_name = parsed[0].replace(/"/g, '\\"');
                    this._edit_area.textContent += `"${column_name}"`;
                    this._validate_expression();
                }
            } catch (e) {
                // regular text, don't do anything as browser will handle
                // the `drop` event.
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
        this._edit_area = this.shadowRoot.querySelector("#psp-expression-editor__edit_area");
        this._close_button = this.shadowRoot.querySelector("#psp-expression-editor-close");
        this._save_button = this.shadowRoot.querySelector("#psp-expression-editor-button-save");
        this._side_panel_actions = this.parentElement.querySelector("#side_panel__actions");
    }

    /**
     * Map callback functions to class properties.
     */
    _register_callbacks() {
        this._edit_area.addEventListener("drop", this._capture_drop_data.bind(this));
        this._edit_area.addEventListener("input", this._validate_expression.bind(this));
        this._edit_area.addEventListener("keydown", this._keydown.bind(this));
        this._save_button.addEventListener("click", this._save_expression.bind(this));
        this._close_button.addEventListener("click", this.close.bind(this));
    }
}
