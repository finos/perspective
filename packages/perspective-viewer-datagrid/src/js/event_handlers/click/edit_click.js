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

export function write_cell(table, model, active_cell) {
    const meta = table.getMeta(active_cell);
    const type = model._schema[model._column_paths[meta.x]];
    if (meta) {
        let text = active_cell.textContent;
        const id = model._ids[meta.y - meta.y0][0];
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

export function clickListener(table, _viewer, event) {
    const meta = table.getMeta(event.target);
    if (typeof meta?.x !== "undefined") {
        const is_editable2 = this._is_editable[meta.x];
        const is_bool = this.get_psp_type(meta) === "boolean";
        const is_null = event.target.classList.contains("psp-null");
        if (is_editable2 && is_bool && !is_null) {
            write_cell(table, this, event.target);
        }
    }
}
