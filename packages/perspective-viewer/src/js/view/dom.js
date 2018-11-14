/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export function _show_context_menu(event) {
    this.shadowRoot.querySelector("#app").classList.toggle("show_menu");
    event.stopPropagation();
    event.preventDefault();
    return false;
}

export function _hide_context_menu() {
    this.shadowRoot.querySelector("#app").classList.remove("show_menu");
}

export function _toggle_config() {
    if (this._show_config) {
        this._side_panel.style.display = "none";
        this._top_panel.style.display = "none";
        this.removeAttribute("settings");
    } else {
        this._side_panel.style.display = "flex";
        this._top_panel.style.display = "flex";
        this.setAttribute("settings", true);
    }
    this._show_config = !this._show_config;
    this._plugin.resize.call(this, true);
    _hide_context_menu.call(this);
    this.dispatchEvent(new CustomEvent("perspective-toggle-settings", {detail: this._show_config}));
}