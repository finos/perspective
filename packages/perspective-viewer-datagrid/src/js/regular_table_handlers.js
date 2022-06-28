/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// TODO Import this directly due to overly-sensitive tree shaking.
import {get_type_config} from "../../../perspective/src/js/config/index.js";
import {style_cell_flash} from "./cell_flash.js";
import {sortHandler} from "./sorting.js";

import {
    activate_plugin_menu,
    PLUGIN_SYMBOL,
    make_color_record,
} from "./plugin_menu.js";
import {rgbaToRgb, infer_foreground_from_background} from "./color_utils.js";

import chroma from "chroma-js";

function styleListener(regularTable) {
    const header_depth = regularTable._view_cache.config.row_pivots.length - 1;
    let group_headers = Array.from(
        regularTable.children[0].children[0].children
    );

    const plugins = regularTable[PLUGIN_SYMBOL] || {};
    if (group_headers.length > 0) {
        let [col_headers] = group_headers.splice(group_headers.length - 1, 1);

        for (const td of col_headers?.children) {
            const metadata = regularTable.getMeta(td);
            const column_name =
                metadata.column_header?.[metadata.column_header?.length - 1];
            const sort = this._config.sort.find((x) => x[0] === column_name);
            let needs_border = metadata.row_header_x === header_depth;
            const is_corner = typeof metadata.x === "undefined";
            needs_border =
                needs_border ||
                (metadata.x + 1) % this._config.columns.length === 0;
            td.classList.toggle("psp-header-border", needs_border);
            td.classList.toggle("psp-header-group", false);
            td.classList.toggle("psp-header-leaf", true);
            td.classList.toggle("psp-is-top", false);
            td.classList.toggle("psp-header-corner", is_corner);
            td.classList.toggle(
                "psp-header-sort-asc",
                !!sort && sort[1] === "asc"
            );
            td.classList.toggle(
                "psp-header-sort-desc",
                !!sort && sort[1] === "desc"
            );
            td.classList.toggle(
                "psp-header-sort-col-asc",
                !!sort && sort[1] === "col asc"
            );
            td.classList.toggle(
                "psp-header-sort-col-desc",
                !!sort && sort[1] === "col desc"
            );

            let type = get_psp_type.call(this, metadata);
            const is_numeric = type === "integer" || type === "float";
            const is_string = type === "string";
            td.classList.toggle("psp-align-right", is_numeric);
            td.classList.toggle("psp-align-left", !is_numeric);
            td.classList.toggle(
                "psp-menu-open",
                this._open_column_styles_menu[0] === metadata._virtual_x
            );
            td.classList.toggle(
                "psp-menu-enabled",
                (is_string || is_numeric) && !is_corner
            );
            td.classList.toggle(
                "psp-is-width-override",
                regularTable._column_sizes?.override[metadata.size_key] !==
                    undefined
            );
        }
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
            let needs_border =
                metadata.row_header_x === header_depth || metadata.x >= 0;
            td.classList.toggle("psp-align-right", false);
            td.classList.toggle("psp-align-left", false);
            td.classList.toggle("psp-header-group", true);
            td.classList.toggle("psp-header-leaf", false);
            td.classList.toggle("psp-header-border", needs_border);
            td.classList.toggle(
                "psp-header-group-corner",
                typeof metadata.x === "undefined"
            );
            td.classList.toggle("psp-color-mode-bar", false);

            td.classList.toggle("psp-header-sort-asc", false);
            td.classList.toggle("psp-header-sort-desc", false);
            td.classList.toggle("psp-header-sort-col-asc", false);
            td.classList.toggle("psp-header-sort-col-desc", false);

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

    for (const tr of regularTable.children[0].children[1].children) {
        for (const td of tr.children) {
            const metadata = regularTable.getMeta(td);
            const column_name =
                metadata.column_header?.[metadata.column_header?.length - 1];

            let type = get_psp_type.call(this, metadata);
            const plugin = plugins[column_name];
            const is_numeric = type === "integer" || type === "float";

            if (is_numeric) {
                const is_positive = metadata.user > 0;
                const is_negative = metadata.user < 0;

                let pos_bg_color;
                if (plugin?.pos_bg_color !== undefined) {
                    pos_bg_color = plugin.pos_bg_color;
                } else {
                    pos_bg_color = this._pos_bg_color;
                }

                let neg_bg_color;
                if (plugin?.neg_bg_color !== undefined) {
                    neg_bg_color = plugin.neg_bg_color;
                } else {
                    neg_bg_color = this._neg_bg_color;
                }

                const bg_tuple = is_positive
                    ? pos_bg_color
                    : is_negative
                    ? neg_bg_color
                    : ["", ...this._plugin_background, ""];

                {
                    const [hex, r, g, b, _gradhex] = bg_tuple;

                    td.style.position = "";
                    if (plugin?.number_bg_mode === "color") {
                        td.style.animation = "";
                        td.style.backgroundColor = hex;
                    } else if (plugin?.number_bg_mode === "gradient") {
                        const a = Math.max(
                            0,
                            Math.min(
                                1,
                                Math.abs(metadata.user / plugin.bg_gradient)
                            )
                        );
                        const source = this._plugin_background;
                        const foreground = infer_foreground_from_background(
                            rgbaToRgb([r, g, b, a], source)
                        );

                        td.style.animation = "";
                        td.style.color = foreground;
                        td.style.backgroundColor = `rgba(${r},${g},${b},${a})`;
                    } else if (plugin?.number_bg_mode === "pulse") {
                        // TODO!
                        style_cell_flash.call(
                            this,
                            metadata,
                            td,
                            pos_bg_color,
                            neg_bg_color
                        );
                        td.style.backgroundColor = "";
                    } else if (
                        plugin?.number_bg_mode === "disabled" ||
                        !plugin?.number_bg_mode
                    ) {
                        td.style.animation = "";
                        td.style.backgroundColor = "";
                    } else {
                        td.style.animation = "";
                        td.style.backgroundColor = "";
                    }
                }

                const [hex, r, g, b, gradhex] = (() => {
                    if (plugin?.pos_fg_color !== undefined) {
                        return is_positive
                            ? plugin.pos_fg_color
                            : is_negative
                            ? plugin.neg_fg_color
                            : ["", ...this._plugin_background, ""];
                    } else {
                        return is_positive
                            ? this._pos_fg_color
                            : is_negative
                            ? this._neg_fg_color
                            : ["", ...this._plugin_background, ""];
                    }
                })();

                if (plugin?.number_fg_mode === "disabled") {
                    if (plugin?.number_bg_mode === "color") {
                        const source = this._plugin_background;
                        const foreground = infer_foreground_from_background(
                            rgbaToRgb(
                                [bg_tuple[1], bg_tuple[2], bg_tuple[3], 1],
                                source
                            )
                        );
                        td.style.color = foreground;
                    } else if (plugin?.number_bg_mode === "gradient") {
                    } else {
                        td.style.color = "";
                    }
                } else if (plugin?.number_fg_mode === "bar") {
                    td.style.color = "";
                    td.style.position = "relative";
                    if (
                        gradhex !== "" &&
                        td.children.length > 0 &&
                        td.children[0].nodeType === Node.ELEMENT_NODE
                    ) {
                        td.children[0].style.background = gradhex;
                    }
                } else if (
                    plugin?.number_fg_mode === "color" ||
                    !plugin?.number_fg_mode
                ) {
                    td.style.color = hex;
                }
            } else if (type === "boolean") {
                const [hex] =
                    metadata.user === true
                        ? this._pos_fg_color
                        : metadata.user === false
                        ? this._neg_fg_color
                        : ["", 0, 0, 0, ""];

                td.style.backgroundColor = "";
                td.style.color = hex;
            } else if (type === "string") {
                const [hex, r, g, b, gradhex] = (() => {
                    if (plugin?.color !== undefined) {
                        return plugin.color;
                    } else {
                        return this._color;
                    }
                })();

                if (
                    plugin?.string_color_mode === "foreground" &&
                    metadata.user !== null
                ) {
                    td.style.color = hex;
                    td.style.backgroundColor = "";
                    if (plugin?.format === "link") {
                        td.children[0].style.color = hex;
                    }
                } else if (
                    plugin?.string_color_mode === "background" &&
                    metadata.user !== null
                ) {
                    const source = this._plugin_background;
                    const foreground = infer_foreground_from_background(
                        rgbaToRgb([r, g, b, 1], source)
                    );
                    td.style.color = foreground;
                    td.style.backgroundColor = hex;
                } else if (
                    plugin?.string_color_mode === "series" &&
                    metadata.user !== null
                ) {
                    if (!this._series_color_map.has(column_name)) {
                        this._series_color_map.set(column_name, new Map());
                        this._series_color_seed.set(column_name, 0);
                    }

                    const series_map = this._series_color_map.get(column_name);
                    if (!series_map.has(metadata.user)) {
                        const seed = this._series_color_seed.get(column_name);
                        series_map.set(metadata.user, seed);
                        this._series_color_seed.set(column_name, seed + 1);
                    }

                    const color_seed = series_map.get(metadata.user);
                    let [h, s, l] = chroma(hex).hsl();
                    h = h + ((color_seed * 150) % 360);
                    const color2 = chroma(h, s, l, "hsl");
                    const [r, g, b] = color2.rgb();
                    const hex2 = color2.hex();
                    const source = this._plugin_background;
                    const foreground = infer_foreground_from_background(
                        rgbaToRgb([r, g, b, 1], source)
                    );
                    td.style.color = foreground;
                    td.style.backgroundColor = hex2;
                } else {
                    td.style.backgroundColor = "";
                    td.style.color = "";
                }
            } else {
                td.style.backgroundColor = "";
                td.style.color = "";
            }

            td.classList.toggle(
                "psp-bool-type",
                type === "boolean" && metadata.user !== null
            );

            const is_th = td.tagName === "TH";
            if (is_th) {
                const is_not_empty =
                    typeof metadata.value != undefined &&
                    typeof metadata.value != null &&
                    metadata.value?.toString()?.trim().length > 0;
                const is_leaf =
                    metadata.row_header_x >= this._config.group_by.length;
                const next = regularTable.getMeta({
                    dx: 0,
                    dy: metadata.y - metadata.y0 + 1,
                });
                const is_collapse =
                    next &&
                    next.row_header &&
                    typeof next.row_header[metadata.row_header_x + 1] !==
                        "undefined";
                td.classList.toggle("psp-tree-label", is_not_empty && !is_leaf);
                td.classList.toggle(
                    "psp-tree-label-expand",
                    is_not_empty && !is_leaf && !is_collapse
                );
                td.classList.toggle(
                    "psp-tree-label-collapse",
                    is_not_empty && !is_leaf && is_collapse
                );
                td.classList.toggle("psp-tree-leaf", is_not_empty && is_leaf);
            }

            td.classList.toggle("psp-align-right", !is_th && is_numeric);
            td.classList.toggle("psp-align-left", is_th || !is_numeric);
            td.classList.toggle(
                "psp-color-mode-bar",
                plugin?.number_fg_mode === "bar" && is_numeric
            );
        }
    }
}

async function expandCollapseHandler(regularTable, event) {
    const meta = regularTable.getMeta(event.target);
    const is_collapse = event.target.classList.contains(
        "psp-tree-label-collapse"
    );
    if (event.shiftKey && is_collapse) {
        this._view.set_depth(
            meta.row_header.filter((x) => x !== undefined).length - 2
        );
    } else if (event.shiftKey) {
        this._view.set_depth(
            meta.row_header.filter((x) => x !== undefined).length - 1
        );
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
    if (target.tagName === "A") {
        return;
    }

    while (target.tagName !== "TD" && target.tagName !== "TH") {
        target = target.parentElement;
        if (!regularTable.contains(target)) {
            return;
        }
    }

    if (target.classList.contains("psp-tree-label")) {
        expandCollapseHandler.call(this, regularTable, event);
        event.stopImmediatePropagation();
        return;
    }

    const rect = target.getBoundingClientRect();
    if (
        target.classList.contains("psp-menu-enabled") &&
        event.clientY - rect.top > 16
    ) {
        const meta = regularTable.getMeta(target);
        const column_name =
            meta.column_header?.[meta.column_header?.length - 1];
        const column_type = this._schema[column_name];
        this._open_column_styles_menu.unshift(meta._virtual_x);
        if (column_type === "string") {
            regularTable.draw({preserve_width: true});
            activate_plugin_menu.call(this, regularTable, target);
        } else {
            const [min, max] = await this._view.get_min_max(column_name);
            regularTable.draw({preserve_width: true});
            let bound = Math.max(Math.abs(min), Math.abs(max));
            if (bound > 1) {
                bound = Math.round(bound * 100) / 100;
            }

            activate_plugin_menu.call(this, regularTable, target, bound);
        }

        event.preventDefault();
        event.stopImmediatePropagation();
    } else if (
        target.classList.contains("psp-header-leaf") &&
        !target.classList.contains("psp-header-corner")
    ) {
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
    } else if (
        target.classList.contains("psp-header-leaf") &&
        !target.classList.contains("psp-header-corner")
    ) {
        event.stopImmediatePropagation();
    }
}

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

export const formatters = FORMATTERS;

function _format(parts, val, plugins = {}, use_table_schema = false) {
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

function* _tree_header(paths = [], row_headers, regularTable) {
    const plugins = regularTable[PLUGIN_SYMBOL];
    for (let path of paths) {
        path = ["TOTAL", ...path];
        const last = path[path.length - 1];
        path = path.slice(0, path.length - 1).fill("");
        const formatted = _format.call(
            this,
            [row_headers[path.length - 1]],
            last,
            plugins,
            true
        );

        if (formatted instanceof HTMLElement) {
            path = path.concat(formatted);
        } else {
            path = path.concat({toString: () => formatted});
        }

        path.length = row_headers.length + 1;
        yield path;
    }
}

function createDataListener() {
    let last_meta;
    let last_column_paths;
    let last_ids;
    let last_reverse_ids;
    let last_reverse_columns;
    return async function dataListener(regularTable, x0, y0, x1, y1) {
        let columns = {};
        let new_window;
        if (x1 - x0 > 0 && y1 - y0 > 0) {
            this._is_old_viewport =
                this._last_window?.start_row === y0 &&
                this._last_window?.end_row === y1 &&
                this._last_window?.start_col === x0 &&
                this._last_window?.end_col === x1;

            new_window = {
                start_row: y0,
                start_col: x0,
                end_row: y1,
                end_col: x1,
                id: true,
            };

            columns = await this._view.to_columns(new_window);
            this._last_window = new_window;
            this._ids = columns.__ID__;
            this._reverse_columns = this._column_paths
                .slice(x0, x1)
                .reduce((acc, x, i) => {
                    acc.set(x, i);
                    return acc;
                }, new Map());

            this._reverse_ids = this._ids.reduce((acc, x, i) => {
                acc.set(x?.join("|"), i);
                return acc;
            }, new Map());
        } else {
            this._div_factory.clear();
        }

        const data = [],
            metadata = [],
            column_headers = [],
            column_paths = [];

        // for (const path of this._column_paths.slice(x0, x1)) {
        for (
            let ipath = x0;
            ipath < Math.min(x1, this._column_paths.length);
            ++ipath
        ) {
            const path = this._column_paths[ipath];
            const path_parts = path.split("|");
            const column = columns[path] || new Array(y1 - y0).fill(null);
            data.push(
                column.map((x) =>
                    _format.call(
                        this,
                        path_parts,
                        x,
                        regularTable[PLUGIN_SYMBOL]
                    )
                )
            );
            metadata.push(column);
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

        return {
            num_rows: this._num_rows,
            num_columns: this._column_paths.length,
            row_headers: Array.from(
                _tree_header.call(
                    this,
                    columns.__ROW_PATH__,
                    this._config.group_by,
                    regularTable
                )
            ),
            column_headers,
            data,
            metadata,
        };
    };
}

function get_rule(regular, tag, def) {
    let color = window.getComputedStyle(regular).getPropertyValue(tag).trim();
    if (color.length > 0) {
        return color;
    } else {
        return def;
    }
}

class ElemFactory {
    constructor(name) {
        this._name = name;
        this._elements = [];
        this._index = 0;
    }

    clear() {
        this._index = 0;
    }

    get() {
        if (!this._elements[this._index]) {
            this._elements[this._index] = document.createElement(this._name);
        }
        const elem = this._elements[this._index];
        this._index += 1;
        return elem;
    }
}

function blend(a, b) {
    return chroma.mix(a, `rgb(${b[0]},${b[1]},${b[2]})`, 0.5).hex();
}

export async function createModel(regular, table, view, extend = {}) {
    const config = await view.get_config();

    // Extract the entire expression string as typed by the user, so we can
    // feed it into `validate_expressions` and get back the data types for
    // each column without it being affected by a pivot.
    const expressions = config.expressions.map((expr) => expr[1]);
    const [
        table_schema,
        validated_expressions,
        num_rows,
        schema,
        expression_schema,
        column_paths,
    ] = await Promise.all([
        table.schema(),
        table.validate_expressions(expressions),
        view.num_rows(),
        view.schema(),
        view.expression_schema(),
        view.column_paths(),
    ]);

    const _plugin_background = chroma(
        get_rule(regular, "--plugin--background", "#FFFFFF")
    ).rgb();

    const _pos_fg_color = make_color_record(
        get_rule(regular, "--rt-pos-cell--color", "#338DCD")
    );

    const _neg_fg_color = make_color_record(
        get_rule(regular, "--rt-neg-cell--color", "#FF5942")
    );

    const _pos_bg_color = make_color_record(
        blend(_pos_fg_color[0], _plugin_background)
    );

    const _neg_bg_color = make_color_record(
        blend(_neg_fg_color[0], _plugin_background)
    );

    const _color = make_color_record(
        get_rule(regular, "--active--color", "#ff0000")
    );

    const _schema = {...schema, ...expression_schema};
    const _table_schema = {
        ...table_schema,
        ...validated_expressions.expression_schema,
    };

    const _column_paths = column_paths.filter((path) => {
        return path !== "__ROW_PATH__" && path !== "__ID__";
    });

    const _is_editable = [];
    const _column_types = [];
    for (const column_path of _column_paths) {
        const column_path_parts = column_path.split("|");
        const column = column_path_parts[column_path_parts.length - 1];
        _column_types.push(_schema[column]);
        _is_editable.push(!!table_schema[column]);
    }

    const model = Object.assign(extend, {
        _view: view,
        _table: table,
        _table_schema,
        _config: config,
        _num_rows: num_rows,
        _schema,
        _ids: [],
        _open_column_styles_menu: [],
        _plugin_background,
        _color,
        _pos_fg_color,
        _neg_fg_color,
        _pos_bg_color,
        _neg_bg_color,
        _column_paths,
        _column_types,
        _is_editable,
        _row_header_types: config.group_by.map((column_path) => {
            return _table_schema[column_path];
        }),
        _series_color_map: new Map(),
        _series_color_seed: new Map(),
        get_psp_type,
    });

    // Re-use div factory
    model._div_factory = model._div_factory || new ElemFactory("div");

    regular.setDataListener(createDataListener().bind(model, regular), {
        virtual_mode:
            window
                .getComputedStyle(regular)
                .getPropertyValue("--datagrid-virtual-mode")
                ?.trim() || "both",
    });

    return model;
}

function get_psp_type(metadata) {
    if (metadata.x >= 0) {
        return this._column_types[metadata.x];
    } else {
        return this._row_header_types[metadata.row_header_x - 1];
    }
}

export async function configureRegularTable(regular, model) {
    regular.addStyleListener(styleListener.bind(model, regular));
    regular.addEventListener(
        "mousedown",
        mousedownListener.bind(model, regular)
    );
    regular.addEventListener("click", clickListener.bind(model, regular));
}
