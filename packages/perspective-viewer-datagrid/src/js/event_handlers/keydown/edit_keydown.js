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

import { focus_style_listener } from "../../style_handlers/focus.js";

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

const moveSelection = lock(
    async function (table, selected_position_map, active_cell, dx, dy) {
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
    },
);

function isLastCell(model, table, target) {
    const meta = table.getMeta(target);
    return meta.y === model._num_rows - 1;
}

// Events
export function keydownListener(table, viewer, selected_position_map, event) {
    const target = table.getRootNode().activeElement;
    event.target.classList.remove("psp-error");
    switch (event.key) {
        case "Enter":
            event.preventDefault();
            if (isLastCell(this, table, target)) {
                target.blur();
                selected_position_map.delete(table);
            } else if (event.shiftKey) {
                moveSelection.call(
                    this,
                    table,
                    selected_position_map,
                    target,
                    0,
                    -1,
                );
            } else {
                moveSelection.call(
                    this,
                    table,
                    selected_position_map,
                    target,
                    0,
                    1,
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
                    0,
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
                -1,
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
                    0,
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
                1,
            );
            break;
        default:
    }
}
