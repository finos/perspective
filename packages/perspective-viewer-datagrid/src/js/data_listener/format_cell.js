/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {get_type_config} from "@finos/perspective/src/js/config/index.js";
// import {PLUGIN_SYMBOL} from "../model";

const FORMATTERS = {};

const FORMATTER_CONS = {
    datetime: Intl.DateTimeFormat,
    date: Intl.DateTimeFormat,
    integer: Intl.NumberFormat,
    float: Intl.NumberFormat,
    boolean: class {
        format(val) {
            return val ? "check" : "close";
        }
    },
};

/**
 * Format a single cell's text content as the content of a `<td>` or `<th>`.
 *
 * @param {*} parts
 * @param {*} val
 * @param {*} plugins
 * @param {*} use_table_schema
 * @returns
 */
export function format_cell(
    parts,
    val,
    plugins = {},
    use_table_schema = false
) {
    if (val === null) {
        return "-";
    }

    const title = parts[parts.length - 1];
    const type =
        (use_table_schema && this._table_schema[title]) ||
        this._schema[title] ||
        "string";
    const plugin = plugins[title];
    const is_numeric = type === "integer" || type === "float";
    if (is_numeric && plugin?.number_fg_mode === "bar") {
        const a = Math.max(
            0,
            Math.min(0.95, Math.abs(val / plugin.fg_gradient) * 0.95)
        );
        const div = this._div_factory.get();
        const anchor = val >= 0 ? "left" : "right";
        div.setAttribute(
            "style",
            `width:${(a * 100).toFixed(
                2
            )}%;position:absolute;${anchor}:0;height:80%;top:10%;pointer-events:none;`
        );
        return div;
    } else if (plugin?.format === "link" && type === "string") {
        const anchor = document.createElement("a");
        anchor.setAttribute("href", val);
        anchor.setAttribute("target", "_blank");
        anchor.textContent = val;
        return anchor;
    } else if (plugin?.format === "bold" && type === "string") {
        const anchor = document.createElement("b");
        anchor.textContent = val;
        return anchor;
    } else if (plugin?.format === "italics" && type === "string") {
        const anchor = document.createElement("i");
        anchor.textContent = val;
        return anchor;
    } else {
        const is_plugin_override =
            is_numeric && plugin && plugin.fixed !== undefined;
        let formatter_key = is_plugin_override
            ? `${type}${plugin.fixed}`
            : type;
        if (FORMATTERS[formatter_key] === undefined) {
            const type_config = get_type_config(type);
            if (is_plugin_override) {
                const opts = {
                    minimumFractionDigits: plugin.fixed,
                    maximumFractionDigits: plugin.fixed,
                };
                FORMATTERS[formatter_key] = new FORMATTER_CONS[type](
                    "en-us",
                    opts
                );
            } else if (FORMATTER_CONS[type]) {
                FORMATTERS[formatter_key] = new FORMATTER_CONS[type](
                    "en-us",
                    type_config.format
                );
            } else {
                FORMATTERS[formatter_key] = false;
            }
        }

        return FORMATTERS[formatter_key]
            ? FORMATTERS[formatter_key].format(val)
            : val;
    }
}

// function* _tree_header(paths = [], row_headers, regularTable) {
//     const plugins = regularTable[PLUGIN_SYMBOL];
//     for (let path of paths) {
//         path = ["TOTAL", ...path];
//         const last = path[path.length - 1];
//         path = path.slice(0, path.length - 1).fill("");
//         const formatted = _format.call(
//             this,
//             [row_headers[path.length - 1]],
//             last,
//             plugins,
//             true
//         );

//         if (formatted instanceof HTMLElement) {
//             path = path.concat(formatted);
//         } else {
//             path = path.concat({toString: () => formatted});
//         }

//         path.length = row_headers.length + 1;
//         yield path;
//     }
// }

// export function createDataListener() {
//     let last_meta;
//     let last_column_paths;
//     let last_ids;
//     let last_reverse_ids;
//     let last_reverse_columns;
//     return async function dataListener(regularTable, x0, y0, x1, y1) {
//         let columns = {};
//         let new_window;
//         if (x1 - x0 > 0 && y1 - y0 > 0) {
//             this._is_old_viewport =
//                 this._last_window?.start_row === y0 &&
//                 this._last_window?.end_row === y1 &&
//                 this._last_window?.start_col === x0 &&
//                 this._last_window?.end_col === x1;

//             new_window = {
//                 start_row: y0,
//                 start_col: x0,
//                 end_row: y1,
//                 end_col: x1,
//                 id: true,
//             };

//             columns = await this._view.to_columns(new_window);
//             this._last_window = new_window;
//             this._ids = columns.__ID__;
//             this._reverse_columns = this._column_paths
//                 .slice(x0, x1)
//                 .reduce((acc, x, i) => {
//                     acc.set(x, i);
//                     return acc;
//                 }, new Map());

//             this._reverse_ids = this._ids.reduce((acc, x, i) => {
//                 acc.set(x?.join("|"), i);
//                 return acc;
//             }, new Map());
//         } else {
//             this._div_factory.clear();
//         }

//         const data = [],
//             metadata = [],
//             column_headers = [],
//             column_paths = [];

//         // for (const path of this._column_paths.slice(x0, x1)) {
//         for (
//             let ipath = x0;
//             ipath < Math.min(x1, this._column_paths.length);
//             ++ipath
//         ) {
//             const path = this._column_paths[ipath];
//             const path_parts = path.split("|");
//             const column = columns[path] || new Array(y1 - y0).fill(null);
//             data.push(
//                 column.map((x) =>
//                     _format.call(
//                         this,
//                         path_parts,
//                         x,
//                         regularTable[PLUGIN_SYMBOL]
//                     )
//                 )
//             );
//             metadata.push(column);
//             column_headers.push(path_parts);
//             column_paths.push(path);
//         }

//         // Only update the last state if this is not a "phantom" call.
//         if (x1 - x0 > 0 && y1 - y0 > 0) {
//             this.last_column_paths = last_column_paths;
//             this.last_meta = last_meta;
//             this.last_ids = last_ids;
//             this.last_reverse_ids = last_reverse_ids;
//             this.last_reverse_columns = last_reverse_columns;

//             last_column_paths = column_paths;
//             last_meta = metadata;
//             last_ids = this._ids;
//             last_reverse_ids = this._reverse_ids;
//             last_reverse_columns = this._reverse_columns;
//         }

//         return {
//             num_rows: this._num_rows,
//             num_columns: this._column_paths.length,
//             row_headers: Array.from(
//                 _tree_header.call(
//                     this,
//                     columns.__ROW_PATH__,
//                     this._config.group_by,
//                     regularTable
//                 )
//             ),
//             column_headers,
//             data,
//             metadata,
//         };
//     };
// }
