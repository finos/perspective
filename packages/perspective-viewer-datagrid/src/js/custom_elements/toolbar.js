// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import TOOLBAR_STYLE from "../../../dist/css/perspective-viewer-datagrid-toolbar.css";
import { toggle_edit_mode, toggle_scroll_lock } from "../model/toolbar";

/**
 * The custom element for this plugin's toolbar, a component which displays in
 * the host `<perspective-viewer>`'s status bar when this plugin is active.
 * In the case of Datagrid, this comprises "Editable" and "Scroll Lock" toggle
 * buttons.
 */
export class HTMLPerspectiveViewerDatagridToolbarElement extends HTMLElement {
    connectedCallback() {
        if (this._initialized) {
            return;
        }

        this._initialized = true;
        this.setAttribute("slot", "plugin-settings");
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            <style>
                ${TOOLBAR_STYLE}
            </style>
            <div id="toolbar">
                <span id="scroll_lock" class="button">
                    <span>Rolagem livre</span>
                </span>
                <span id="edit_mode" class="button"><span>Apenas leitura</span></span>
            </div>
        `;

        const viewer = this.parentElement;
        const plugin = viewer.querySelector("perspective-viewer-datagrid");
        plugin._scroll_lock = this.shadowRoot.querySelector("#scroll_lock");
        plugin._scroll_lock.addEventListener("click", () =>
            toggle_scroll_lock.call(plugin)
        );

        plugin._edit_mode = this.shadowRoot.querySelector("#edit_mode");
        plugin._edit_mode.addEventListener("click", () => {
            toggle_edit_mode.call(plugin);
            plugin.regular_table.draw();
            viewer.dispatchEvent(new Event("perspective-config-update"));
        });
    }
}
