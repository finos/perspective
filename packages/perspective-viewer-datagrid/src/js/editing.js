/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const selected_position_map = new WeakMap();

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
        let _range = document.getSelection().getRangeAt(0);
        let range = _range.cloneRange();
        range.selectNodeContents(this);
        range.setEnd(_range.endContainer, _range.endOffset);
        return range.toString().length;
    } else {
        return this.target.selectionStart;
    }
}

function write(table, model, active_cell) {
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
        }

        const msg = {
            __INDEX__: id,
            [model._column_paths[meta.x]]: text,
        };

        model._table.update([msg], {port_id: model._edit_port});
        return true;
    }
}

function isEditable(viewer) {
    const has_pivots =
        this._config.row_pivots.length === 0 &&
        this._config.column_pivots.length === 0;
    const selectable = viewer.hasAttribute("selectable");
    const editable = viewer.hasAttribute("editable");
    return has_pivots && !selectable && editable;
}

const moveSelection = lock(async function (table, active_cell, dx, dy) {
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
        !focusStyleListener(table) &&
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

// Styles

function editableStyleListener(table, viewer) {
    // Independently check "editable" and `isEditable()`, so we can skip
    // the styler entirely if editing was disabled at the time of element
    // creation, but toggle in when e.g. pivots or selectable will
    // affect editability.
    if (!viewer.hasAttribute("editable")) {
        return;
    }
    const edit = isEditable.call(this, viewer);
    for (const td of table.querySelectorAll("td")) {
        td.toggleAttribute("contenteditable", edit);
    }
}

const focusStyleListener = (table) => {
    const tds = table.querySelectorAll("td");
    const selected_position = selected_position_map.get(table);
    if (selected_position) {
        for (const td of tds) {
            const meta = table.getMeta(td);
            if (
                meta.x === selected_position.x &&
                meta.y === selected_position.y
            ) {
                if (document.activeElement !== td) {
                    td.focus({preventScroll: true});
                }
                return true;
            }
        }
        if (
            document.activeElement !== document.body &&
            table.contains(document.activeElement)
        ) {
            document.activeElement.blur();
        }
    }
};

// Events

function keydownListener(table, viewer, event) {
    if (!isEditable.call(this, viewer)) {
        return;
    }
    const target = document.activeElement;
    event.target.classList.remove("psp-error");
    switch (event.keyCode) {
        case 13:
            event.preventDefault();
            if (event.shiftKey) {
                moveSelection.call(this, table, target, 0, -1);
            } else {
                moveSelection.call(this, table, target, 0, 1);
            }
            break;
        case 37:
            if (getPos.call(target) == 0) {
                event.preventDefault();
                moveSelection.call(this, table, target, -1, 0);
            }
            break;
        case 38:
            event.preventDefault();
            moveSelection.call(this, table, target, 0, -1);
            break;
        case 39:
            if (getPos.call(target) == target.textContent.length) {
                event.preventDefault();
                moveSelection.call(this, table, target, 1, 0);
            }
            break;
        case 40:
            event.preventDefault();
            moveSelection.call(this, table, target, 0, 1);
            break;
        default:
    }
}

function focusoutListener(table, viewer, event) {
    if (isEditable.call(this, viewer) && selected_position_map.has(table)) {
        event.target.classList.remove("psp-error");
        const selectedPosition = selected_position_map.get(table);
        selected_position_map.delete(table);
        if (selectedPosition.content !== event.target.textContent) {
            if (!write(table, this, event.target)) {
                event.target.textContent = selectedPosition.content;
                event.target.classList.add("psp-error");
                event.target.focus();
            }
        }
    }
}

function focusinListener(table, viewer, event) {
    const meta = table.getMeta(event.target);
    if (meta) {
        const new_state = {
            x: meta.x,
            y: meta.y,
            content: event.target.textContent,
        };
        selected_position_map.set(table, new_state);
    }
}

// Plugin

export async function configureEditable(table, viewer) {
    this._edit_port = await viewer.getEditPort();
    table.addStyleListener(editableStyleListener.bind(this, table, viewer));
    table.addStyleListener(focusStyleListener.bind(this, table, viewer));
    table.addEventListener(
        "focusin",
        focusinListener.bind(this, table, viewer)
    );
    table.addEventListener(
        "focusout",
        focusoutListener.bind(this, table, viewer)
    );
    table.addEventListener(
        "keydown",
        keydownListener.bind(this, table, viewer)
    );
}
