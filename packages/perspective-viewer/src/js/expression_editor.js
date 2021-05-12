/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {bindTemplate, throttlePromise, getExpressionAlias, addExpressionAlias} from "./utils.js";

import template from "../html/expression_editor.html";
import style from "../less/expression_editor.less";
import {EXPRESSION_HELP_ITEMS} from "./expression_help_items";

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
        this._fill_help_items();
        this._editor_observer = new ResizeObserver(this._resize_editor.bind(this));
        this._clear();
        this._disable_save();
    }

    /**
     * Observe the editor when it is opened.
     */
    observe() {
        this._editor_observer.observe(this._edit_area);
        // Focus on the edit area immediately
        this._focus();
    }

    /**
     * Close the expressions editor.
     */
    close() {
        this.style.display = "none";
        this._side_panel_actions.style.display = "flex";
        this._help_container.style.display = "none";
        this._help_container.style.width = `100%`;
        this._disable_save();
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
    async type_check_expression(validated_expressions) {
        if (!validated_expressions.expression_schema || !validated_expressions.errors) {
            this._disable_save();
            this._hide_error();
            return;
        }

        let expression = this._temp_expression;
        const alias = this._temp_expression_alias;

        if (alias !== undefined) {
            expression = alias;
        }

        if (validated_expressions.expression_schema[expression]) {
            this._enable_save();
        } else {
            this._disable_save(validated_expressions.errors[expression]);
        }
    }

    /**
     * Validate the expression even when empty.
     *
     * @param {*} ev
     */
    @throttlePromise
    async _validate_expression() {
        let expression = this._edit_area.value;

        if (expression.length === 0) {
            this._temp_expression = undefined;
            this._temp_expression_alias = undefined;
            this._disable_save();
            this._hide_error();
            return;
        }

        if (getExpressionAlias(expression) === undefined) {
            expression = addExpressionAlias(expression);
        }

        // Store the expression temporarily so we can access it in
        // `type_check_expression()`.
        this._temp_expression = expression;
        this._temp_expression_alias = getExpressionAlias(expression);

        // Take the parsed expression and type check it on the viewer,
        // which will call `type_check_expression()` with an expression schema.
        const event = new CustomEvent("perspective-expression-editor-type-check", {
            detail: {
                expression: this._temp_expression,
                alias: this._temp_expression_alias
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

        let expression = this._edit_area.value;

        // if the expression doesn't have an alias, generate an alias and
        // add it to the expression.
        if (getExpressionAlias(expression) === undefined) {
            expression = addExpressionAlias(expression);
        }

        let alias = getExpressionAlias(expression);

        const event = new CustomEvent("perspective-expression-editor-save", {
            detail: {
                expression,
                alias
            }
        });

        this.dispatchEvent(event);
    }

    /**
     * Whenever the editor resizes, make sure the width of the error message
     * and help panel correspond to the editor width.
     *
     * @private
     */
    _resize_editor() {
        this._error_message.style.width = `${this._edit_area.offsetWidth}px`;
        this._help_container.style.width = `${this._edit_area.offsetWidth}px`;
    }

    /**
     * On an error state, disable the save button and show the error message
     * if there is one.
     *
     * @param {*} error_message
     */
    _disable_save(error_message) {
        this._save_button.setAttribute("disabled", true);
        error_message ? this._show_error(error_message) : this._hide_error();
    }

    _enable_save() {
        this._hide_error();
        this._save_button.removeAttribute("disabled");
    }

    _show_error(error_message) {
        // make sure the error is never larger than the editor, otherwise it
        // will start moving the side-panel.
        this._error_message.style.width = `${this._edit_area.offsetWidth}px`;
        this._error_message.innerText = error_message;
        this._error_message.style.display = "block";
    }

    _hide_error() {
        // Reset the width when the error hides.
        this._error_message.style.width = "100%";
        this._error_message.innerText = "";
        this._error_message.style.display = "none";
    }

    /**
     * Clear the edit area and hide the error message.
     */
    _clear() {
        this._edit_area.value = "";
        this._hide_error();
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
                this._edit_area.value = this._edit_area.value.substring(0, start) + "  " + this._edit_area.value.substring(end);
                this._edit_area.setSelectionRange(end + 2, end + 2);
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
                    let expression;

                    // expression column - use the raw expression without alias
                    if (parsed.length === 6) {
                        expression = parsed[parsed.length - 1];
                    } else {
                        // column name - escape double quotes and wrap
                        expression = `"${parsed[0].replace(/"/g, '\\"')}"`;
                    }

                    this._edit_area.value += expression;
                    this._validate_expression();
                }
            } catch (e) {
                // regular text, don't do anything as browser will handle
                // the `drop` event.
            }
        }
    }

    _toggle_help() {
        if (this._help_container.offsetParent === null) {
            this._help_container.style.width = `${this._edit_area.offsetWidth}px`;
            this._help_container.style.display = "flex";
        } else {
            this._help_container.style.display = "none";
            this._help_container.style.width = `100%`;
        }
    }

    _apply_help_item(event) {
        const template = event.target.getAttribute("template");
        this._edit_area.value += template;
        this._validate_expression();
    }

    _fill_help_items() {
        const divider = document.createElement("hr");
        divider.classList.add("psp_expression-editor__help--divider");

        for (const category in EXPRESSION_HELP_ITEMS) {
            const group = this[`_help_group_${category}`];
            const content = group.querySelector(".psp_expression-editor__help--group-content");
            const frag = document.createDocumentFragment();

            for (const item of EXPRESSION_HELP_ITEMS[category]) {
                if (item === "DIVIDER") {
                    frag.appendChild(divider.cloneNode());
                    continue;
                }

                const elem = document.createElement("span");
                elem.classList.add("psp_expression-editor__help-item");
                elem.setAttribute("title", item.description);
                elem.setAttribute("template", item.template);
                elem.innerText = item.name;
                elem.addEventListener("click", this._apply_help_item.bind(this));

                frag.appendChild(elem);
            }

            content.appendChild(frag);
        }
    }

    /**
     * Map DOM IDs to class properties.
     */
    _register_ids() {
        this._edit_area = this.shadowRoot.querySelector("#psp-expression-editor__edit_area");
        this._error_message = this.shadowRoot.querySelector("#psp-expression-editor__error-message");
        this._close_button = this.shadowRoot.querySelector("#psp-expression-editor-button-close");
        this._save_button = this.shadowRoot.querySelector("#psp-expression-editor-button-save");
        this._side_panel_actions = this.parentElement.querySelector("#side_panel__actions");

        // Help panel
        this._help_button = this.shadowRoot.querySelector("#psp-expression-editor-button-help");
        this._help_container = this.shadowRoot.querySelector("#psp-expression-editor-help-container");
        this._help_group_numeric = this.shadowRoot.querySelector("#psp-expression-editor-help-group-numeric");
        this._help_group_string = this.shadowRoot.querySelector("#psp-expression-editor-help-group-string");
        this._help_group_datetime = this.shadowRoot.querySelector("#psp-expression-editor-help-group-datetime");
        this._help_group_comparison = this.shadowRoot.querySelector("#psp-expression-editor-help-group-comparison");
        this._help_group_control_flow = this.shadowRoot.querySelector("#psp-expression-editor-help-group-control-flow");
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
        this._help_button.addEventListener("click", this._toggle_help.bind(this));
    }
}
