/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {FormatterCache} from "./formatter_cache";

const FORMAT_CACHE = new FormatterCache();

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

    // TODO don't do this on every cell render ...
    const title = parts[parts.length - 1];
    const type =
        (use_table_schema && this._table_schema[title]) ||
        this._schema[title] ||
        "string";
    const plugin = plugins[title] || {};
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
        const formatter = FORMAT_CACHE.get(type, plugin);
        return formatter ? formatter.format(val) : val;
    }
}
