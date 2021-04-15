/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {hexToRgb} from "./color_utils.js";

export const PLUGIN_SYMBOL = Symbol("Plugin Symbol");

class PluginMenu extends HTMLElement {
    constructor() {
        super();
    }

    open(pv_plugin, regularTable, target, column_meta) {
        this._pv_plugin = pv_plugin;
        this._regularTable = regularTable;

        const rect = target.getBoundingClientRect();
        this.setAttribute("tabindex", "0");
        this.className = "column-plugin-menu";
        this.attachShadow({mode: "open"});
        const pset = regularTable[PLUGIN_SYMBOL] || {};
        const meta = regularTable.getMeta(target);
        const column_name = meta.column_header[meta.column_header.length - 1];
        const column_type = pv_plugin._schema[column_name];
        const column_styles = (pset[column_name] = pset[column_name] || {});
        const default_prec = column_type === "float" ? 2 : 0;
        const is_numeric = column_type === "float" || column_type === "integer";
        if (!is_numeric) {
            this.drop();
            return;
        }

        const fixed = (column_styles.fixed + 1 || default_prec + 1) - 1;
        const fixed_example = fixed > 0 ? "0." + "0".repeat(fixed - 1) + "1" : "1";

        let html = `
            <style>
                :host {
                    position: absolute;
                    left: ${rect.left}px;
                    top: ${rect.bottom}px;
                    padding: 6px;
                    outline: none;
                    font-family: "Open Sans";
                    font-size: 12px;
                    font-weight: 300;
                    border: inherit;
                    box-shadow: 0 2px 4px 0 rgb(0 0 0 / 10%);
                }

                :host input.parameter {
                    max-width: 65px;
                    background: none;
                    color: inherit;
                    border: 0px solid transparent;
                    border-bottom-width: 1px;
                    border-color: var(--input--border-color);
                    outline: none;
                }

                :host input[type=radio], :host input[type=checkbox], :host > div > div > span:first-child {
                    width: 24px;
                    margin: 0;
                }

                :host > div > div {
                    display: flex;
                    align-items: center;
                    height: 24px;
                }

                :host div.section {
                    margin-bottom: 8px;
                }

                :host input[type=color] {
                    width: 24px;
                }

                :host .operator {
                    font-family: "Roboto Mono", monospace;
                    white-space:pre;
                }

                :host input.parameter[disabled] {
                    opacity: 0.5;
                }

                :host .indent1 {
                    margin-left: 24px;
                }
            </style>
            <div>
                <div>
                    <input type="checkbox" checked disabled>
                    </input>
                    <span id="fixed-examples">Prec ${fixed_example}</span>
                </div>
                <div class="section">
                    <span></span>    
                    <input 
                        id="fixed-param" 
                        value="${fixed}" 
                        class="parameter" 
                        ${is_numeric ? "" : "disabled"}
                        type="number" 
                        min="0" 
                        step="1">
                    </input>
                </div>
                <div>
                    <input 
                        id="color-selected" 
                        type="checkbox" 
                        ${column_styles.color_mode !== undefined ? "checked" : ""}>
                    </input>
                    <input
                        id="color-param"
                        value="${column_styles.color_mode !== undefined ? column_styles.pos_color[0] : pv_plugin._pos_color[0]}"
                        ${column_styles.color_mode !== undefined ? "" : "disabled"}
                        class="parameter"
                        type="color">
                    </input>
                    <span class="operator"> + / - </span>
                    <input
                        id="neg-color-param"
                        value="${column_styles.color_mode !== undefined ? column_styles.neg_color[0] : pv_plugin._neg_color[0]}"
                        ${column_styles.color_mode !== undefined ? "" : "disabled"}
                        class="parameter"
                        type="color">
                    </input>
                </div>
                <div class="indent1">
                    <input 
                        id="color-mode-1" 
                        name="color-mode" 
                        type="radio" 
                        value="foreground" 
                        class="parameter"
                        ${column_styles.color_mode !== undefined ? "" : "disabled"}
                        ${column_styles.color_mode !== "background" && column_styles.color_mode !== "gradient" ? "checked" : ""}>
                    </input>
                    <span>Foreground</span>
                </div>
                <div class="indent1">
                    <input 
                        id="color-mode-2" 
                        name="color-mode" 
                        type="radio"
                        value="background" 
                        class="parameter" 
                        ${column_styles.color_mode !== undefined ? "" : "disabled"}
                        ${column_styles.color_mode === "background" ? "checked" : ""}>
                    </input>
                    <span>Background</span>
                </div>
                <div class="indent1">
                    <input 
                        id="color-mode-3" 
                        name="color-mode" 
                        type="radio" 
                        value="gradient" 
                        class="parameter" 
                        ${column_styles.color_mode !== undefined ? "" : "disabled"}
                        ${column_styles.color_mode === "gradient" ? "checked" : ""}>
                    </input>
                    <span>Gradient</span>
                </div>
                <div class="indent1">
                    <span></span>
                    <input 
                        id="gradient-param" 
                        value="${Math.ceil(column_styles.opacity + 1 || column_meta[column_name] + 1) - 1}" 
                        class="parameter" 
                        ${column_styles.opacity !== undefined ? "" : "disabled"}
                        type="number" 
                        min="0">
                    </input>
                </div>
            </div>
        `;

        this.shadowRoot.innerHTML += html;
        document.body.appendChild(this);
        this.shadowRoot.addEventListener(
            "input",
            (this._changeListener = () => {
                const config = {};
                const fixed = parseInt(this.shadowRoot.querySelector(`#fixed-param`).value);
                const fixed_example = fixed > 0 ? "Prec 0." + "0".repeat(fixed - 1) + "1" : "Prec 1";
                this.shadowRoot.querySelector(`#fixed-examples`).textContent = fixed_example;
                if (isFinite(fixed) && fixed !== default_prec && fixed > -1) {
                    config.fixed = fixed;
                } else {
                    // TODO validation
                }

                const is_color = this.shadowRoot.querySelector(`#color-selected`).checked;
                const color = this.shadowRoot.querySelector(`#color-param`);
                const neg_color = this.shadowRoot.querySelector(`#neg-color-param`);
                const opacity = this.shadowRoot.querySelector(`#gradient-param`);
                const color_mode_1 = this.shadowRoot.querySelector(`#color-mode-1`);
                const color_mode_2 = this.shadowRoot.querySelector(`#color-mode-2`);
                const color_mode_3 = this.shadowRoot.querySelector(`#color-mode-3`);
                if (is_color) {
                    color_mode_1.disabled = color_mode_2.disabled = color_mode_3.disabled = false;
                    if (color_mode_1.checked) {
                        config.color_mode = "foreground";
                    } else if (color_mode_2.checked) {
                        config.color_mode = "background";
                    } else {
                        config.color_mode = "gradient";
                    }

                    if (config.color_mode === "gradient") {
                        opacity.disabled = false;
                        config.opacity = parseInt(opacity.value);
                    } else {
                        opacity.disabled = true;
                        opacity.value = Math.ceil(column_meta[column_name]);
                    }

                    color.disabled = neg_color.disabled = false;
                    config.pos_color = [color.value].concat(hexToRgb(color.value));
                    config.neg_color = [neg_color.value].concat(hexToRgb(neg_color.value));
                } else {
                    color_mode_1.disabled = color_mode_2.disabled = color_mode_3.disabled = true;
                    color.disabled = neg_color.disabled = true;
                    opacity.disabled = true;
                }

                regularTable[PLUGIN_SYMBOL] = regularTable[PLUGIN_SYMBOL] || {};
                regularTable[PLUGIN_SYMBOL][column_name] = config;
                regularTable.draw({preserve_width: true});
                regularTable.parentElement.dispatchEvent(new Event("perspective-config-update"));
            })
        );

        this.addEventListener("blur", (this._drop_handler = this.drop.bind(this)));
        regularTable.addEventListener("regular-table-scroll", this._drop_handler);
        this.focus();
    }

    drop() {
        if (document.body.contains(this)) {
            this.removeEventListener("blur", this._drop_handler);
            this._regularTable?.removeEventListener("regular-table-scroll", this._drop_handler);
            document.body.removeChild(this);
            this.shadowRoot.removeEventListener("input", this._changeListener);
        }
        this._pv_plugin._open_column_styles_menu.pop();
        this._regularTable.draw();
    }
}

customElements.define("perspective-viewer-datagrid-plugin-menu", PluginMenu);

export function activate_plugin_menu(regularTable, target, meta) {
    const menu = document.createElement("perspective-viewer-datagrid-plugin-menu");
    menu.open(this, regularTable, target, meta);
}
