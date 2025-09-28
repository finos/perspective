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

import getCellConfig from "../get_cell_config.js";

export async function selectionListener(
    regularTable,
    viewer,
    selected_rows_map,
    event,
) {
    const meta = regularTable.getMeta(event.target);
    if (!viewer.hasAttribute("selectable")) return;
    if (event.handled) return;
    if (event.which !== 1) {
        return;
    }

    if (!meta) {
        return;
    }

    const id = this._ids?.[meta.y - meta.y0];
    if (meta && meta.y >= 0) {
        const selected = selected_rows_map.get(regularTable);
        const key_match =
            !!selected &&
            selected.reduce((agg, x, i) => agg && x === id[i], true);

        const is_deselect =
            !!selected && id.length === selected.length && key_match;

        let detail = { selected: !is_deselect };
        const { row, column_names, config } = await getCellConfig(
            this,
            meta.y,
            meta.x,
        );

        if (is_deselect) {
            selected_rows_map.delete(regularTable);
            detail = {
                ...detail,
                row,
                config: { filter: structuredClone(this._config.filter) },
            };
        } else {
            selected_rows_map.set(regularTable, id);
            detail = { ...detail, row, column_names, config };
        }

        await regularTable.draw({ preserve_width: true });
        event.handled = true;
        viewer.dispatchEvent(
            new CustomEvent("perspective-select", {
                bubbles: true,
                composed: true,
                detail,
            }),
        );
    }
}
