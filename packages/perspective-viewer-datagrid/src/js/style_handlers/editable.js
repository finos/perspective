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

import { PRIVATE_PLUGIN_SYMBOL } from "../model";

function isEditable(viewer, allowed = false) {
    const has_pivots =
        this._config.group_by.length === 0 &&
        this._config.split_by.length === 0;
    const selectable = viewer.hasAttribute("selectable");
    const editable =
        allowed || viewer.children[0]?.dataset?.editMode === "EDIT";
    return has_pivots && !selectable && editable;
}

export function editable_style_listener(table, viewer, datagrid) {
    // Independently check "editable" and `isEditable()`, so we can skip
    // the styler entirely if editing was disabled at the time of element
    // creation, but toggle in when e.g. pivots or selectable will
    // affect editability.
    const plugins = table[PRIVATE_PLUGIN_SYMBOL] || {};
    const edit = isEditable.call(this, viewer);
    datagrid.classList.toggle(
        "edit-mode-allowed",
        isEditable.call(this, viewer, true),
    );

    for (const td of table.querySelectorAll("td")) {
        const meta = table.getMeta(td);
        const type = this.get_psp_type(meta);
        if (edit && this._is_editable[meta.x]) {
            const col_name = meta.column_header[this._config.split_by.length];
            if (type === "string" && plugins[col_name]?.format === "link") {
                td.toggleAttribute("contenteditable", false);
                td.classList.toggle("boolean-editable", false);
            } else if (type === "boolean") {
                td.toggleAttribute("contenteditable", false);
                td.classList.toggle("boolean-editable", meta.user !== null);
            } else {
                if (edit !== td.hasAttribute("contenteditable")) {
                    td.toggleAttribute("contenteditable", edit);
                }
                td.classList.toggle("boolean-editable", false);
            }
        } else {
            td.toggleAttribute("contenteditable", false);
            td.classList.toggle("boolean-editable", false);
        }
    }
}
