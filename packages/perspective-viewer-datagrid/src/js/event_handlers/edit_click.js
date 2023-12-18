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

import { focus_style_listener } from "../style_handlers/focus.js";

function lock(body) {
    let lock;
    return async function (...args) {
        if (!!lock && (await lock) && !!lock) {
            return;
        }

        let resolve;
        lock = new Promise((x) => (resolve = x));
        await body.apply(this, args);
        lock = undefined;
        resolve();
    };
}

function getPos() {
    if (this.isContentEditable) {
        let _range = this.getRootNode().getSelection().getRangeAt(0);
        let range = _range.cloneRange();
        range.selectNodeContents(this);
        range.setEnd(_range.endContainer, _range.endOffset);
        return range.toString().length;
    } else {
        return this.target.selectionStart;
    }
}

export function write_cell(table, model, active_cell) {
    const meta = table.getMeta(active_cell);
    const type = model._schema[model._column_paths[meta.x]];
    if (meta) {
        let text = active_cell.textContent;
        const id = model._ids[meta.y - meta.y0];
        if (type === "float" || type === "integer") {
            text = parseFloat(text.replace(/,/g, ""));
            if (isNaN(text)) {
                return false;
            }
        } else if (type === "date" || type === "datetime") {
            text = Date.parse(text);
            if (isNaN(text)) {
                return false;
            }
        } else if (type === "boolean") {
            text = text === "true" ? false : text === "false" ? true : null;
        }

        const msg = {
            __INDEX__: id,
            [model._column_paths[meta.x]]: text,
        };

        model._table.update([msg], { port_id: model._edit_port });
        return true;
    }
}

export function is_editable(viewer, allowed = false) {
    const has_pivots =
        this._config.group_by.length === 0 &&
        this._config.split_by.length === 0;
    const selectable = viewer.hasAttribute("selectable");
    const editable = allowed || !!viewer.children[0]._is_edit_mode;
    return has_pivots && !selectable && editable;
}

const moveSelection = lock(async function (
    table,
    selected_position_map,
    active_cell,
    dx,
    dy
) {
    const meta = table.getMeta(active_cell);
    const num_columns = this._column_paths.length;
    const num_rows = this._num_rows;
    const selected_position = selected_position_map.get(table);
    if (!selected_position) {
        return;
    }

    if (meta.x + dx < num_columns && 0 <= meta.x + dx) {
        selected_position.x = meta.x + dx;
    }

    if (meta.y + dy < num_rows && 0 <= meta.y + dy) {
        selected_position.y = meta.y + dy;
    }

    const xmin = Math.max(meta.x0 - 10, 0);
    const xmax = Math.min(meta.x0 + 10, num_columns);
    const ymin = Math.max(meta.y0 - 5, 0);
    const ymax = Math.min(meta.y0 + 10, num_rows);
    let x = meta.x0 + dx,
        y = meta.y0 + dy;
    while (
        !focus_style_listener(table, undefined, selected_position_map) &&
        x >= xmin &&
        x < xmax &&
        y >= ymin &&
        y < ymax
    ) {
        await table.scrollToCell(x, y, num_columns, num_rows);
        selected_position_map.set(table, selected_position);
        x += dx;
        y += dy;
    }
});

// Events

export function keydownListener(table, viewer, selected_position_map, event) {
    if (!is_editable.call(this, viewer)) {
        return;
    }
    const target = table.getRootNode().activeElement;
    event.target.classList.remove("psp-error");
    switch (event.key) {
        case "Enter":
            event.preventDefault();
            if (event.shiftKey) {
                moveSelection.call(
                    this,
                    table,
                    selected_position_map,
                    target,
                    0,
                    -1
                );
            } else {
                moveSelection.call(
                    this,
                    table,
                    selected_position_map,
                    target,
                    0,
                    1
                );
            }
            break;
        case "ArrowLeft":
            if (getPos.call(target) == 0) {
                event.preventDefault();
                moveSelection.call(
                    this,
                    table,
                    selected_position_map,
                    target,
                    -1,
                    0
                );
            }
            break;
        case "ArrowUp":
            event.preventDefault();
            moveSelection.call(
                this,
                table,
                selected_position_map,
                target,
                0,
                -1
            );
            break;
        case "ArrowRight":
            if (getPos.call(target) == target.textContent.length) {
                event.preventDefault();
                moveSelection.call(
                    this,
                    table,
                    selected_position_map,
                    target,
                    1,
                    0
                );
            }
            break;
        case "ArrowDown":
            event.preventDefault();
            moveSelection.call(
                this,
                table,
                selected_position_map,
                target,
                0,
                1
            );
            break;
        default:
    }
}

export function clickListener(table, _viewer, event) {
    const meta = table.getMeta(event.target);
    if (typeof meta?.x !== "undefined") {
        const is_all_editable = is_editable.call(this, _viewer);
        const is_editable2 = this._is_editable[meta.x];
        const is_bool = this.get_psp_type(meta) === "boolean";
        const is_null = event.target.textContent === "-";
        if (is_all_editable && is_editable2 && is_bool && !is_null) {
            write_cell(table, this, event.target);
        }
    }
}
