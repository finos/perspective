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

import * as edit_click from "./click/edit_click.js";
import * as edit_keydown from "./keydown/edit_keydown.js";

export function is_editable(viewer, allowed = false) {
    const has_pivots =
        this._config.group_by.length === 0 &&
        this._config.split_by.length === 0;
    const selectable = viewer.hasAttribute("selectable");
    const editable = allowed || !!(viewer.children[0]._edit_mode === "EDIT");
    return has_pivots && !selectable && editable;
}

export function keydownListener(table, viewer, selected_position_map, event) {
    if (this._edit_mode === "EDIT") {
        if (!is_editable.call(this, viewer)) {
            return;
        }

        edit_keydown.keydownListener.call(
            this,
            table,
            viewer,
            selected_position_map,
            event,
        );
    } else {
        console.debug(
            `Mode ${this._edit_mode} for "keydown" event not yet implemented`,
        );
    }
}

export function clickListener(table, viewer, event) {
    if (this._edit_mode === "EDIT") {
        if (!is_editable.call(this, viewer)) {
            return;
        }

        edit_click.clickListener.call(this, table, viewer, event);
    } else if (this._edit_mode === "READ_ONLY") {
    } else if (this._edit_mode === "SELECT_COLUMN") {
    } else if (this._edit_mode === "SELECT_ROW") {
    } else if (this._edit_mode === "SELECT_REGION") {
    } else {
        console.debug(
            `Mode ${this._edit_mode} for "click" event not yet implemented`,
        );
    }
}
