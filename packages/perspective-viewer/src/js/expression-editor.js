/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
// import {html, render} from "lit-html";

import {bindTemplate} from "./utils.js";

import template from "../html/expression_editor.html";

import style from "../less/expression_editor.less";

// Eslint complains here because we don't do anything, but actually we globally
// register this class as a CustomElement
@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class PerspectiveExpressionEditor extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this._register_ids();
        this._register_callbacks();
        this._edit_area.value = "";
    }

    // Get/set/append content of editor

    /**
     * Returns the `children` of the edit area.
     */
    get_html() {
        return this._edit_area.children;
    }

    // TODO: these should all be replaced with a litHTML renderer that takes
    // an AST and renders it into the correct values
    set_html(value) {
        this._edit_area.innerHTML = value;
    }

    append_html(value) {
        this._edit_area.innerHTML += value;
    }

    get_text() {
        return this._edit_area.innerText.trim();
    }

    set_text(text) {
        this._edit_area.innerText = text;
    }

    append_text(text) {
        this._edit_area.innerText += text;
    }

    // Event handlers

    keydown() {
        this._edit_area.value = this.get_text();
    }

    /**
     * Map DOM IDs to class properties.
     */
    _register_ids() {
        this._edit_area = this.shadowRoot.querySelector(".perspective-expression-editor__edit_area");
    }

    /**
     * Map callback functions to class properties.
     */
    _register_callbacks() {
        this._edit_area.addEventListener("keydown", this.keydown.bind(this));
    }

    get placeholder() {
        return this.getAttribute("placeholder");
    }

    set placeholder(value) {
        this._edit_area.setAttribute("placeholder", value);
    }
}
