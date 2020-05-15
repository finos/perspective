/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {nothing, render} from "lit-html";

import {bindTemplate, throttlePromise} from "./utils.js";

import template from "../html/autocomplete_widget.html";

import style from "../less/autocomplete_widget.less";

/**
 * A single suggestion object for the autocomplete, containing `label`, which
 * is the text displayed to the user, and `value`, which is the text that goes
 * into the input when a selection is chosen.
 */
export class AutocompleteSuggestion {
    /**
     * Construct a new autocomplete suggestion.
     *
     * @param {String} label the text shown to the user
     * @param {String} value the text used to replace inside the input
     */
    constructor(label, value) {
        this.label = label;
        this.value = value;
    }
}

// Eslint complains here because we don't do anything, but actually we globally
// register this class as a CustomElement
@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class PerspectiveAutocompleteWidget extends HTMLElement {
    constructor() {
        super();
        this.displayed = false;
        this._selection_index = -1;
    }

    connectedCallback() {
        this._register_ids();
        this._register_callbacks();
    }

    /**
     * Render an array of suggestions inside the autocomplete. Calling this
     * method will overwrite the existing suggestions inside the
     * autocomplete container.
     *
     * @param {Array<Template>} markup An array of `lit-html` template objects
     * that will be rendered. If the length of `markup` is 0, the autocomplete
     * is cleared and hidden.
     * @param {Boolean} is_column_name if true, suggestions will be rendered
     * with additional CSS classes denoting that they are column names.
     *
     * TODO: do we want throttlePromise on all render functions?
     */
    @throttlePromise
    render(markup) {
        if (markup.length === 0) {
            this.clear();
            render(nothing, this._container);
            return;
        }

        this.reposition();

        // Reset selection state
        this._selection_index = -1;

        // Show autocomplete container
        this.display();

        // Reset scroll inside container to be at the top
        this._container.scrollTop = 0;

        render(markup, this._container);
    }

    /**
     * Repositions the widget within the textarea - must be implemented by the
     * user. Defaults to a no-op;
     */
    reposition() {
        console.warning("PerspectiveAutocompleteWidget.reposition has not been implemented.");
        return;
    }

    /**
     * If an item is clicked inside the autocomplete, dispatch a
     * `perspective-autocomplete-item-clicked` event, containing the original
     * click event in the new event's `detail` attribute.
     *
     * @param {*} ev
     */
    item_clicked(ev) {
        if (ev.target && ev.target.matches(".psp-autocomplete__item")) {
            const event = new CustomEvent("perspective-autocomplete-item-clicked", {
                detail: ev,
                bubbles: true
            });
            this.dispatchEvent(event);
        }
    }

    /**
     * Returns the `data-value` attribute of the currently selected item, or
     * `undefined` if there is no selection.
     */
    get_selected_value() {
        if (this._selection_index !== -1) {
            return this._container.children[this._selection_index].getAttribute("data-value");
        }
    }

    /**
     * Clears the autocomplete widget and sets the widget's `display`
     * style to `none`.
     */
    clear() {
        this.hide();
        this._selection_index = -1;
        this._container.removeAttribute("style");
        this._container.classList.remove("undocked");
        this._container.classList.add("docked");
    }

    /**
     * Displays the autocomplete and sets `this.displayed` to true.
     */
    display() {
        this._container.style.display = "block";
        this.displayed = true;
    }

    /**
     * Hides the autocomplete, and sets `this.displayed` to false.
     */
    hide() {
        this._container.style.display = "none";
        this.displayed = false;
    }

    /**
     * Navigate to the next element inside the container.
     */
    _next() {
        const count = this._container.children.length;
        const idx = this._selection_index < count - 1 ? this._selection_index + 1 : count ? 0 : -1;
        this._go_to(idx);
    }

    /**
     * Go back one element inside the container.
     */
    _prev() {
        const count = this._container.children.length;
        const position = this._selection_index - 1;
        const idx = this._selection_index > -1 && position !== -1 ? position : count - 1;
        this._go_to(idx);
    }

    /**
     * Navigate to element `idx` inside the container.
     *
     * @param {Number} idx
     */
    _go_to(idx) {
        // liberally borrowed from awesomplete
        const children = this._container.children;

        if (this._selection_index > -1) {
            children[this._selection_index].setAttribute("aria-selected", false);
        }

        // reset selection
        this._selection_index = idx;

        if (idx > -1 && children.length > 0) {
            children[idx].setAttribute("aria-selected", "true");
            children[idx].scrollIntoView(true, {
                behavior: "smooth",
                block: "nearest"
            });
        }
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
     * Map DOM IDs to class properties.
     */
    _register_ids() {
        this._container = this.shadowRoot.querySelector(".psp-autocomplete-widget");
    }

    /**
     * Map callback functions to class properties.
     */
    _register_callbacks() {
        // Dispatch a custom event on click & disable the `mousedown` handler
        this._container.addEventListener("click", this.item_clicked.bind(this));
        this._container.addEventListener("mousedown", ev => ev.preventDefault());
    }
}
