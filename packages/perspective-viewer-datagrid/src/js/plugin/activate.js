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

import {
    column_header_style_listener,
    style_selected_column,
} from "../style_handlers/column_header.js";
import { group_header_style_listener } from "../style_handlers/group_header.js";
import { table_cell_style_listener } from "../style_handlers/table_cell";
import {
    click_listener,
    mousedown_listener,
} from "../event_handlers/header_click.js";

import { editable_style_listener } from "../style_handlers/editable.js";
import { focus_style_listener } from "../style_handlers/focus.js";
import { focusinListener, focusoutListener } from "../event_handlers/focus.js";
import {
    keydownListener,
    clickListener,
} from "../event_handlers/edit_click.js";

import { selectionListener } from "../event_handlers/row_select_click";
import { selectionStyleListener } from "../style_handlers/selection";
import { deselect_all_listener } from "../event_handlers/deselect_all.js";

import { createModel } from "../model/create.js";
import { dispatch_click_listener } from "../event_handlers/dispatch_click";

/**
 * Lazy initialize this plugin with various listeners.
 */
export async function activate(view) {
    let viewer = this.parentElement;
    let table = await viewer.getTable(true);
    if (!this._initialized) {
        this.innerHTML = "";
        if (this.shadowRoot) {
            this.shadowRoot.appendChild(this.regular_table);
        } else {
            this.appendChild(this.regular_table);
        }
        this.model = await createModel.call(
            this,
            this.regular_table,
            table,
            view
        );

        this.regular_table.addStyleListener(
            table_cell_style_listener.bind(
                this.model,
                this.regular_table,
                viewer
            )
        );

        this.regular_table.addStyleListener(
            group_header_style_listener.bind(this.model, this.regular_table)
        );

        this.regular_table.addStyleListener(
            column_header_style_listener.bind(
                this.model,
                this.regular_table,
                viewer
            )
        );

        this.regular_table.addEventListener(
            "click",
            click_listener.bind(this.model, this.regular_table)
        );

        this.regular_table.addEventListener(
            "mousedown",
            mousedown_listener.bind(this.model, this.regular_table, viewer)
        );

        // Row selection
        const selected_rows_map = new WeakMap();
        this.regular_table.addStyleListener(
            selectionStyleListener.bind(
                this.model,
                this.regular_table,
                viewer,
                selected_rows_map
            )
        );

        this.regular_table.addEventListener(
            "mousedown",
            selectionListener.bind(
                this.model,
                this.regular_table,
                viewer,
                selected_rows_map
            )
        );

        this.regular_table.addEventListener(
            "psp-deselect-all",
            deselect_all_listener.bind(
                this.model,
                this.regular_table,
                viewer,
                selected_rows_map
            )
        );

        // User click
        this.regular_table.addEventListener(
            "click",
            dispatch_click_listener.bind(this.model, this.regular_table, viewer)
        );

        // Editing
        const selected_position_map = new WeakMap();
        this.regular_table.addStyleListener(
            editable_style_listener.bind(
                this.model,
                this.regular_table,
                viewer,
                this
            )
        );
        this.regular_table.addStyleListener(
            focus_style_listener.bind(
                this.model,
                this.regular_table,
                viewer,
                selected_position_map
            )
        );
        this.regular_table.addEventListener(
            "click",
            clickListener.bind(this.model, this.regular_table, viewer)
        );
        this.regular_table.addEventListener(
            "focusin",
            focusinListener.bind(
                this.model,
                this.regular_table,
                viewer,
                selected_position_map
            )
        );
        this.regular_table.addEventListener(
            "focusout",
            focusoutListener.bind(
                this.model,
                this.regular_table,
                viewer,
                selected_position_map
            )
        );
        this.regular_table.addEventListener(
            "keydown",
            keydownListener.bind(
                this.model,
                this.regular_table,
                viewer,
                selected_position_map
            )
        );

        // viewer event listeners
        viewer.addEventListener(
            "perspective-toggle-column-settings",
            (event) => {
                if (this.isConnected) {
                    style_selected_column.call(
                        this.model,
                        this.regular_table,
                        viewer,
                        event.detail.column_name
                    );
                    if (!event.detail.open) {
                        this.model._column_settings_selected_column = null;
                        return;
                    }

                    this.model._column_settings_selected_column =
                        event.detail.column_name;
                }
            }
        );

        this._initialized = true;
    } else {
        await createModel.call(
            this,
            this.regular_table,
            table,
            view,
            this.model
        );
    }
}
