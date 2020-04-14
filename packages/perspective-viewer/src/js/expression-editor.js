/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

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
    }

    // TODO: API for set/get value

    /**
     * Map DOM IDs to class properties.
     */
    _register_ids() {
        this._textarea = this.shadowRoot.querySelector(".perspective-expression-editor__textarea");
    }

    /**
     * Map callback functions to class properties.
     */
    _register_callbacks() {}

    get placeholder() {
        return this.getAttribute("placeholder");
    }

    set placeholder(value) {
        this._textarea.setAttribute("placeholder", value);
    }
}
