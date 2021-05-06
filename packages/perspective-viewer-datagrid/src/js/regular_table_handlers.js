/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {get_type_config} from "@finos/perspective/dist/esm/config/index.js";
import {activate_plugin_menu, PLUGIN_SYMBOL} from "./plugin_menu.js";
import {rgbaToRgb, infer_foreground_from_background} from "./color_utils.js";

import chroma from "chroma-js";

function styleListener(regularTable) {
    const header_depth = regularTable._view_cache.config.row_pivots.length - 1;
    let group_headers = Array.from(regularTable.children[0].children[0].children);
    let [col_headers] = group_headers.splice(group_headers.length - 1, 1);
    const plugins = regularTable[PLUGIN_SYMBOL] || {};

    for (const td of col_headers?.children) {
        const metadata = regularTable.getMeta(td);
        const column_name = metadata.column_header?.[metadata.column_header?.length - 1];
        const sort = this._config.sort.find(x => x[0] === column_name);
        let needs_border = metadata.row_header_x === header_depth;
        const is_corner = typeof metadata.x === "undefined";
        needs_border = needs_border || (metadata.x + 1) % this._config.columns.length === 0;
        td.classList.toggle("psp-header-border", needs_border);
        td.classList.toggle("psp-header-group", false);
        td.classList.toggle("psp-header-leaf", true);
        td.classList.toggle("psp-is-top", false);
        td.classList.toggle("psp-header-corner", is_corner);
        td.classList.toggle("psp-header-sort-asc", !!sort && sort[1] === "asc");
        td.classList.toggle("psp-header-sort-desc", !!sort && sort[1] === "desc");
        td.classList.toggle("psp-header-sort-col-asc", !!sort && sort[1] === "col asc");
        td.classList.toggle("psp-header-sort-col-desc", !!sort && sort[1] === "col desc");

        let type = get_psp_type.call(this, metadata);
        const is_numeric = type === "integer" || type === "float";
        const float_val = is_numeric && metadata.user;
        td.classList.toggle("psp-align-right", is_numeric);
        td.classList.toggle("psp-align-left", !is_numeric);
        td.classList.toggle("psp-positive", float_val > 0);
        td.classList.toggle("psp-negative", float_val < 0);
        td.classList.toggle("psp-menu-open", this._open_column_styles_menu[0] === metadata._virtual_x);
        td.classList.toggle("psp-menu-enabled", is_numeric && !is_corner);

        // Color plugin
        // const plugin = plugins[column_name];
        // if (plugin?.pos_color !== undefined) {
        //     const [, r, g, b] = plugin.pos_color;
        //     const foreground = infer_foreground_from_background([r, g, b]);
        //     td.style.backgroundColor = plugin.pos_color[0];
        //     td.style.color = foreground;
        // } else {
        //     td.style.backgroundColor = "";
        //     td.style.color = "";
        // }
    }

    const m = [];
    let marked = new Set();
    const table = regularTable.children[0];
    for (let y = 0; y < group_headers.length; y++) {
        let row = table.rows[y];
        const tops = new Set();
        for (let x = 0; x < row.cells.length; x++) {
            const td = row.cells[x];
            td.style.backgroundColor = "";
            const metadata = regularTable.getMeta(td);
            let needs_border = metadata.row_header_x === header_depth || metadata.x >= 0;
            td.classList.toggle("psp-align-right", false);
            td.classList.toggle("psp-align-left", false);
            td.classList.toggle("psp-header-group", true);
            td.classList.toggle("psp-header-leaf", false);
            td.classList.toggle("psp-header-border", needs_border);
            td.classList.toggle("psp-header-group-corner", typeof metadata.x === "undefined");
            let cell = row.cells[x],
                xx = x,
                tx,
                ty;

            for (; m[y] && m[y][xx]; ++xx);
            tops.add(xx);
            for (tx = xx; tx < xx + cell.colSpan; ++tx) {
                for (ty = y; ty < y + cell.rowSpan; ++ty) {
                    if (!m[ty]) m[ty] = [];
                    m[ty][tx] = true;
                }
            }

            cell.classList.toggle("psp-is-top", y === 0 || !marked.has(tx));
        }
        marked = tops;
    }

    // this._cached_range = this._cached_range || {};
    for (const tr of regularTable.children[0].children[1].children) {
        for (const td of tr.children) {
            const metadata = regularTable.getMeta(td);
            const column_name = metadata.column_header?.[metadata.column_header?.length - 1];
            const plugin = plugins[column_name];

            let type = get_psp_type.call(this, metadata);
            const is_numeric = type === "integer" || type === "float";

            if (is_numeric) {
                const is_positive = metadata.user > 0;
                const is_negative = metadata.user < 0;
                const [hex, r, g, b] = (() => {
                    if (plugin?.pos_color !== undefined) {
                        return is_positive ? plugin.pos_color : is_negative ? plugin.neg_color : ["", 0, 0, 0];
                    } else {
                        return is_positive ? this._pos_color : is_negative ? this._neg_color : ["", 0, 0, 0];
                    }
                })();

                if (plugin?.color_mode === "background") {
                    const source = this._plugin_background;
                    const foreground = infer_foreground_from_background(rgbaToRgb([r, g, b, 1], source));
                    td.style.color = foreground;
                    td.style.backgroundColor = hex;
                } else if (plugin?.color_mode === "gradient") {
                    const a = Math.max(0, Math.min(1, Math.abs(metadata.user / plugin.gradient)));
                    const source = this._plugin_background;
                    const foreground = infer_foreground_from_background(rgbaToRgb([r, g, b, a], source));
                    td.style.color = foreground;
                    td.style.backgroundColor = `rgba(${r},${g},${b},${a})`;
                } else if (plugin?.color_mode === "foreground") {
                    td.style.backgroundColor = "";
                    td.style.color = hex;
                } else {
                    td.style.backgroundColor = "";
                    td.style.color = "";
                }
            } else {
                td.style.backgroundColor = "";
                td.style.color = "";
            }

            const is_th = td.tagName === "TH";
            if (is_th) {
                const is_not_empty = !!metadata.value && metadata.value.toString().trim().length > 0;
                const is_leaf = metadata.row_header_x >= this._config.row_pivots.length;
                const next = regularTable.getMeta({dx: 0, dy: metadata.y - metadata.y0 + 1});
                const is_collapse = next && next.row_header && typeof next.row_header[metadata.row_header_x + 1] !== "undefined";
                td.classList.toggle("psp-tree-label", is_not_empty && !is_leaf);
                td.classList.toggle("psp-tree-label-expand", is_not_empty && !is_leaf && !is_collapse);
                td.classList.toggle("psp-tree-label-collapse", is_not_empty && !is_leaf && is_collapse);
                td.classList.toggle("psp-tree-leaf", is_not_empty && is_leaf);
            }

            const float_val = is_numeric && metadata.user;
            td.classList.toggle("psp-align-right", !is_th && is_numeric);
            td.classList.toggle("psp-align-left", is_th || !is_numeric);
            td.classList.toggle("psp-positive", float_val > 0);
            td.classList.toggle("psp-negative", float_val < 0);
        }
    }
}

function get_psp_type(metadata) {
    if (metadata.x >= 0) {
        const column_path = this._column_paths[metadata.x];
        const column_path_parts = column_path.split("|");
        return this._schema[column_path_parts[column_path_parts.length - 1]];
    } else {
        const column_path = this._config.row_pivots[metadata.row_header_x - 1];
        return this._table_schema[column_path];
    }
}

async function sortHandler(regularTable, event, target) {
    const meta = regularTable.getMeta(target);
    const column_name = meta.column_header[meta.column_header.length - 1];
    const sort_method = event.shiftKey ? append_sort : override_sort;
    const sort = sort_method.call(this, column_name);
    regularTable.dispatchEvent(new CustomEvent("regular-table-psp-sort", {detail: {sort}}));
}

function append_sort(column_name) {
    const sort = [];
    let found = false;
    for (const sort_term of this._config.sort) {
        const [_column_name, _sort_dir] = sort_term;
        if (_column_name === column_name) {
            found = true;
            const term = create_sort.call(this, column_name, _sort_dir);
            if (term) {
                sort.push(term);
            }
        } else {
            sort.push(sort_term);
        }
    }
    if (!found) {
        sort.push([column_name, "desc"]);
    }
    return sort;
}
function override_sort(column_name) {
    for (const [_column_name, _sort_dir] of this._config.sort) {
        if (_column_name === column_name) {
            const sort = create_sort.call(this, column_name, _sort_dir);
            return sort ? [sort] : [];
        }
    }
    return [[column_name, "desc"]];
}
function create_sort(column_name, sort_dir) {
    const is_col_sortable = this._config.column_pivots.length > 0;
    const order = is_col_sortable ? ROW_COL_SORT_ORDER : ROW_SORT_ORDER;
    const inc_sort_dir = sort_dir ? order[sort_dir] : "desc";
    if (inc_sort_dir) {
        return [column_name, inc_sort_dir];
    }
}

const ROW_SORT_ORDER = {desc: "asc", asc: undefined};
const ROW_COL_SORT_ORDER = {desc: "asc", asc: "col desc", "col desc": "col asc", "col asc": undefined};

async function expandCollapseHandler(regularTable, event) {
    const meta = regularTable.getMeta(event.target);
    const is_collapse = event.target.classList.contains("psp-tree-label-collapse");
    if (event.shiftKey && is_collapse) {
        this._view.set_depth(meta.row_header.filter(x => x !== undefined).length - 2);
    } else if (event.shiftKey) {
        this._view.set_depth(meta.row_header.filter(x => x !== undefined).length - 1);
    } else if (is_collapse) {
        this._view.collapse(meta.y);
    } else {
        this._view.expand(meta.y);
    }
    this._num_rows = await this._view.num_rows();
    this._num_columns = await this._view.num_columns();
    regularTable.draw();
}

async function mousedownListener(regularTable, event) {
    if (event.which !== 1) {
        return;
    }

    let target = event.target;
    while (target.tagName !== "TD" && target.tagName !== "TH") {
        target = target.parentElement;
        if (!regularTable.contains(target)) {
            return;
        }
    }

    if (target.classList.contains("psp-tree-label") && event.offsetX < 26) {
        expandCollapseHandler.call(this, regularTable, event);
        event.stopImmediatePropagation();
        return;
    }

    const rect = target.getBoundingClientRect();
    if (target.classList.contains("psp-menu-enabled") && event.clientY - rect.top > 16) {
        const meta = regularTable.getMeta(target);
        const column_name = meta.column_header?.[meta.column_header?.length - 1];
        const [, max] = await this._view.get_min_max(column_name);
        this._open_column_styles_menu.unshift(meta._virtual_x);
        regularTable.draw();
        activate_plugin_menu.call(this, regularTable, target, max);
        event.preventDefault();
        event.stopImmediatePropagation();
    } else if (target.classList.contains("psp-header-leaf") && !target.classList.contains("psp-header-corner")) {
        sortHandler.call(this, regularTable, event, target);
        event.stopImmediatePropagation();
    }
}

function clickListener(regularTable, event) {
    if (event.which !== 1) {
        return;
    }

    let target = event.target;
    while (target.tagName !== "TD" && target.tagName !== "TH") {
        target = target.parentElement;
        if (!regularTable.contains(target)) {
            return;
        }
    }

    if (target.classList.contains("psp-tree-label") && event.offsetX < 26) {
        event.stopImmediatePropagation();
    } else if (target.classList.contains("psp-header-leaf") && !target.classList.contains("psp-header-corner")) {
        event.stopImmediatePropagation();
    }
}

const FORMATTERS = {};

const FORMATTER_CONS = {
    datetime: Intl.DateTimeFormat,
    date: Intl.DateTimeFormat,
    integer: Intl.NumberFormat,
    float: Intl.NumberFormat
};

export const formatters = FORMATTERS;

function _format(parts, val, plugins = {}, use_table_schema = false) {
    if (val === null) {
        return "-";
    }

    const title = parts[parts.length - 1];
    const plugin = plugins[title];
    const type = (use_table_schema && this._table_schema[title]) || this._schema[title] || "string";
    const is_numeric = type === "integer" || type === "float";
    const is_plugin_override = is_numeric && plugin && plugin.fixed !== undefined;
    let formatter_key = is_plugin_override ? `${type}${plugin.fixed}` : type;
    if (FORMATTERS[formatter_key] === undefined) {
        const type_config = get_type_config(type);
        if (is_plugin_override) {
            const opts = {minimumFractionDigits: plugin.fixed, maximumFractionDigits: plugin.fixed};
            FORMATTERS[formatter_key] = new FORMATTER_CONS[type]("en-us", opts);
        } else if (FORMATTER_CONS[type] && type_config.format) {
            FORMATTERS[formatter_key] = new FORMATTER_CONS[type]("en-us", type_config.format);
        } else {
            FORMATTERS[formatter_key] = false;
        }
    }

    return FORMATTERS[formatter_key] ? FORMATTERS[formatter_key].format(val) : val;
}

function* _tree_header(paths = [], row_headers, regularTable) {
    const plugins = regularTable[PLUGIN_SYMBOL];
    for (let path of paths) {
        path = ["TOTAL", ...path];
        const last = path[path.length - 1];
        path = path.slice(0, path.length - 1).fill("");
        const formatted = _format.call(this, [row_headers[path.length - 1]], last, plugins, true);
        path = path.concat({toString: () => formatted});
        path.length = row_headers.length + 1;
        yield path;
    }
}

async function dataListener(regularTable, x0, y0, x1, y1) {
    let columns = {};
    if (x1 - x0 > 0 && y1 - y0 > 0) {
        columns = await this._view.to_columns({
            start_row: y0,
            start_col: x0,
            end_row: y1,
            end_col: x1,
            id: true
        });
        this._ids = columns.__ID__;
    }
    const data = [],
        metadata = [];
    const column_headers = [];
    for (const path of this._column_paths.slice(x0, x1)) {
        const path_parts = path.split("|");
        const column = columns[path] || new Array(y1 - y0).fill(null);
        data.push(column.map(x => _format.call(this, path_parts, x, regularTable[PLUGIN_SYMBOL])));
        metadata.push(column);
        column_headers.push(path_parts);
    }

    return {
        num_rows: this._num_rows,
        num_columns: this._column_paths.length,
        row_headers: Array.from(_tree_header.call(this, columns.__ROW_PATH__, this._config.row_pivots, regularTable)),
        column_headers,
        data,
        metadata
    };
}

function get_rule(regular, tag, def) {
    let color = window
        .getComputedStyle(regular)
        .getPropertyValue(tag)
        .trim();
    if (color.length > 0) {
        return color;
    } else {
        return def;
    }
}

export async function createModel(regular, table, view, extend = {}) {
    const config = await view.get_config();

    // Extract just the expression strings from the expressions array, which
    // contains more metadata than we need.
    const expressions = config.expressions.map(expr => expr[0]);

    const [table_schema, table_expression_schema, num_rows, schema, expression_schema, column_paths] = await Promise.all([
        table.schema(),
        table.validate_expressions(expressions).expression_schema,
        view.num_rows(),
        view.schema(),
        view.expression_schema(),
        view.column_paths()
    ]);

    const _plugin_background = chroma(get_rule(regular, "--plugin--background", "#FFFFFF")).rgb();
    let _pos_color = get_rule(regular, "--rt-pos-cell--color", "#0000ff");
    _pos_color = [_pos_color, ...chroma(_pos_color).rgb()];
    let _neg_color = get_rule(regular, "--rt-neg-cell--color", "#ff0000");
    _neg_color = [_neg_color, ...chroma(_neg_color).rgb()];
    const model = Object.assign(extend, {
        _view: view,
        _table: table,
        _table_schema: {...table_schema, ...table_expression_schema},
        _config: config,
        _num_rows: num_rows,
        _schema: {...schema, ...expression_schema},
        _ids: [],
        _open_column_styles_menu: [],
        _plugin_background,
        _pos_color,
        _neg_color,
        _column_paths: column_paths.filter(path => {
            return path !== "__ROW_PATH__" && path !== "__ID__";
        })
    });
    regular.setDataListener(dataListener.bind(model, regular));
    return model;
}

export async function configureRegularTable(regular, model) {
    regular.addStyleListener(styleListener.bind(model, regular));
    regular.addEventListener("mousedown", mousedownListener.bind(model, regular));
    regular.addEventListener("click", clickListener.bind(model, regular));
    await regular.draw();
}
