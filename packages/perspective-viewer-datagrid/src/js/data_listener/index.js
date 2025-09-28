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
import {
    format_tree_header,
    format_tree_header_row_path,
} from "./format_tree_header.js";

/**
 * Creates a new DataListener, suitable for passing to `regular-table`'s
 * `.setDataListener()` method.  This should be called as a method on the
 * plugin.
 *
 * @returns A data listener for the plugin.
 */
export function createDataListener(viewer) {
    let last_meta;
    let last_column_paths;
    let last_ids;
    let last_reverse_ids;
    let last_reverse_columns;
    return async function dataListener(regularTable, x0, y0, x1, y1) {
        let columns = {};
        const new_window = {
            start_row: y0,
            start_col: x0,
            end_row: y1,
            end_col: x1,
            id: true,
        };

        let num_columns = null;

        if (x1 - x0 > 0 && y1 - y0 > 0) {
            this._is_old_viewport =
                this._last_window?.start_row === y0 &&
                this._last_window?.end_row === y1 &&
                this._last_window?.start_col === x0 &&
                this._last_window?.end_col === x1;

            // if (this._config.split_by?.length > 0) {
            const [x, z] = await Promise.all([
                this._view.to_columns_string(new_window),
                this._view.num_columns(),
                // this._view.column_paths(new_window),
            ]);

            num_columns = z;
            columns = JSON.parse(x);
            const y = Object.keys(columns);
            const new_col_paths = y.filter(
                (x) => x !== "__ROW_PATH__" && x !== "__ID__",
            );

            const old_length = this._column_paths.length;
            this._column_paths.splice(
                new_window.start_col,
                new_col_paths.length,
                ...new_col_paths,
            );

            if (this._column_paths.length !== old_length || old_length === 0) {
                const [a, b] = await Promise.all([
                    this._view.schema(),
                    this._view.expression_schema(),
                ]);

                this._schema = { ...a, ...b };
                for (let i = 0; i < new_col_paths.length; i++) {
                    const column_path_parts = new_col_paths[i].split("|");
                    const column =
                        column_path_parts[this._config.split_by.length];

                    this._is_editable[i + new_window.start_col] =
                        !!this._table_schema[column];

                    this._column_types[i + new_window.start_col] =
                        this._schema[column];
                }
            }

            this._last_window = new_window;
            this._ids =
                columns.__ID__ ||
                Array(y1 - y0)
                    .fill()
                    .map((_, index) => [index + y0]);

            this._reverse_columns = this._column_paths
                .slice(x0, x1)
                .reduce((acc, x, i) => {
                    acc.set(x, i);
                    return acc;
                }, new Map());

            this._reverse_ids = this._ids?.reduce((acc, x, i) => {
                acc.set(x?.join("|"), i);
                return acc;
            }, new Map());
        } else {
            this._div_factory.clear();
            num_columns = await this._view.num_columns();
        }

        const data = [],
            metadata = [],
            column_headers = [],
            column_paths = [];

        const is_settings_open = viewer.hasAttribute("settings");
        for (
            let ipath = x0;
            ipath < Math.min(x1, this._column_paths.length);
            ++ipath
        ) {
            const path = this._column_paths[ipath];
            const path_parts = path.split("|");
            const column = columns[path] || new Array(y1 - y0).fill(null);
            const agg_depth = Math.min(
                regularTable[PRIVATE_PLUGIN_SYMBOL]?.[
                    path_parts[this._config.split_by.length]
                ]?.aggregate_depth || 0,
                this._config.group_by.length,
            );

            data.push(
                column.map((x, i) => {
                    if (columns?.__ROW_PATH__?.[i]?.length < agg_depth) {
                        return "";
                    } else {
                        return format_cell.call(
                            this,
                            path_parts[this._config.split_by.length],
                            x,
                            regularTable[PRIVATE_PLUGIN_SYMBOL],
                        );
                    }
                }),
            );

            metadata.push(column);
            if (is_settings_open) {
                path_parts.push("");
            }

            column_headers.push(path_parts);
            column_paths.push(path);
        }

        // Only update the last state if this is not a "phantom" call.
        if (x1 - x0 > 0 && y1 - y0 > 0) {
            this.last_column_paths = last_column_paths;
            this.last_meta = last_meta;
            this.last_ids = last_ids;
            this.last_reverse_ids = last_reverse_ids;
            this.last_reverse_columns = last_reverse_columns;

            last_column_paths = column_paths;
            last_meta = metadata;
            last_ids = this._ids;
            last_reverse_ids = this._reverse_ids;
            last_reverse_columns = this._reverse_columns;
        }

        const is_row_path = columns.__ROW_PATH__ !== undefined;
        const row_headers = Array.from(
            (is_row_path
                ? format_tree_header_row_path
                : format_tree_header
            ).call(
                this,
                columns.__ROW_PATH__,
                this._config.group_by,
                regularTable,
            ),
        );

        const num_row_headers = row_headers[0]?.length;

        const result = {
            num_column_headers: column_headers[0]?.length || 1,
            num_row_headers,
            num_rows: this._num_rows,
            num_columns,
            row_headers,
            column_headers,
            data,
            metadata,
            column_header_merge_depth: Math.max(
                0,
                this._config.split_by.length,
            ),
        };

        return result;
    };
}
