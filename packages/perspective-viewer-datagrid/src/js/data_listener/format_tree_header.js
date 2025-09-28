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
import { format_cell } from "./format_cell.js";

/**
 * Format a single cell of the `group_by` tree header.
 *
 * @param {*} paths
 * @param {*} row_headers
 * @param {*} regularTable
 */
export function* format_tree_header_row_path(
    paths = [],
    row_headers,
    regularTable,
) {
    const plugins = regularTable[PRIVATE_PLUGIN_SYMBOL];
    for (let path of paths) {
        path = ["TOTAL", ...path];
        const last = path[path.length - 1];
        path = path.slice(0, path.length - 1).fill("");
        const formatted = format_cell.call(
            this,
            row_headers[path.length - 1],
            last,
            plugins,
            true,
        );

        if (formatted instanceof HTMLElement) {
            path = path.concat(formatted);
        } else {
            path = path.concat({ toString: () => formatted });
        }

        path.length = row_headers.length + 1;
        yield path;
    }
}

export function* format_tree_header(paths = [], row_headers, regularTable) {
    const plugins = regularTable[PRIVATE_PLUGIN_SYMBOL];
    for (let path of paths) {
        const new_path = [""];
        for (const idx in path) {
            new_path.push(
                format_cell.call(
                    this,
                    row_headers[idx],
                    path[idx],
                    plugins,
                    true,
                ),
            );
        }

        yield path;
    }
}
