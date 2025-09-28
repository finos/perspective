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

import { PRIVATE_PLUGIN_SYMBOL } from "../../model";

import { cell_style_numeric } from "./numeric.js";
import { cell_style_string } from "./string.js";
import { cell_style_datetime } from "./datetime.js";
import { cell_style_boolean } from "./boolean.js";
import { cell_style_row_header } from "./row_header.js";

function get_psp_type(metadata) {
    if (metadata.x >= 0) {
        return this._column_types[metadata.x];
    } else {
        return this._row_header_types[metadata.row_header_x - 1];
    }
}

export function table_cell_style_listener(regularTable, viewer) {
    const plugins = regularTable[PRIVATE_PLUGIN_SYMBOL] || {};
    const is_settings_open = viewer.hasAttribute("settings");

    for (const tr of regularTable.children[0].children[1].children) {
        for (const td of tr.children) {
            const metadata = regularTable.getMeta(td);

            const column_name =
                metadata.column_header?.[this._config.split_by.length];

            let type = get_psp_type.call(this, metadata);
            const plugin = plugins[column_name];
            const is_numeric = type === "integer" || type === "float";

            // Check if aggregate depth hides this cell
            metadata._is_hidden_by_aggregate_depth = ((x) =>
                x === 0
                    ? false
                    : x - 1 <
                      Math.min(
                          this._config.group_by.length,
                          plugin?.aggregate_depth,
                      ))(
                metadata.row_header?.filter((x) => x !== undefined)?.length,
            );

            if (is_numeric) {
                cell_style_numeric.call(
                    this,
                    plugin,
                    td,
                    metadata,
                    is_settings_open,
                );
            } else if (type === "boolean") {
                cell_style_boolean.call(this, plugin, td, metadata);
            } else if (type === "string") {
                cell_style_string.call(this, plugin, td, metadata);
            } else if (type === "date" || type === "datetime") {
                cell_style_datetime.call(this, plugin, td, metadata);
            } else {
                td.style.backgroundColor = "";
                td.style.color = "";
            }

            td.classList.toggle(
                "psp-bool-type",
                type === "boolean" && metadata.user !== null,
            );

            const is_th = td.tagName === "TH";
            if (is_th) {
                cell_style_row_header.call(this, regularTable, td, metadata);
            }

            tr.dataset.y = metadata.y;
            if (
                metadata.row_header_x === undefined ||
                metadata.row_header_x === metadata.row_header.length - 1 ||
                metadata.row_header[metadata.row_header_x + 1] === undefined
            ) {
                td.dataset.y = metadata.y;
                td.dataset.x = metadata.x;
            } else {
                delete td.dataset.y;
                delete td.dataset.x;
            }

            td.classList.toggle("psp-null", metadata.value === null);
            td.classList.toggle("psp-align-right", !is_th && is_numeric);
            td.classList.toggle("psp-align-left", is_th || !is_numeric);
            td.classList.toggle(
                "psp-color-mode-bar",
                plugin?.number_fg_mode === "bar" && is_numeric,
            );
        }
    }
}
