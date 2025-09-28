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

import chroma from "chroma-js";
import { createDataListener } from "../data_listener";
import { blend, make_color_record } from "../color_utils.js";

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

function get_psp_type(metadata) {
    if (metadata.x >= 0) {
        return this._column_types[metadata.x];
    } else {
        return this._row_header_types[metadata.row_header_x - 1];
    }
}

export async function createModel(regular, table, view, extend = {}) {
    const config = await view.get_config();
    if (this?.model?._config) {
        const old = this.model._config;
        let group_by_changed = old.group_by.length !== config.group_by.length;
        const type_changed =
            (old.group_by.length === 0 || config.group_by.length === 0) &&
            group_by_changed;

        if (!group_by_changed) {
            for (const lvl in old.group_by) {
                group_by_changed ||= config.group_by[lvl] !== old.group_by[lvl];
            }
        }

        let split_by_changed = old.split_by.length !== config.split_by.length;
        if (split_by_changed) {
            for (const lvl in old.split_by) {
                split_by_changed ||= config.split_by[lvl] !== old.split_by[lvl];
            }
        }

        let columns_changed = old.columns.length !== config.columns.length;
        if (columns_changed) {
            for (const lvl in old.columns) {
                columns_changed ||= config.columns[lvl] !== old.columns[lvl];
            }
        }

        let filter_changed = old.filter.length !== config.filter.length;
        if (filter_changed) {
            for (const lvl in old.filter) {
                for (const i in config.filter[lvl]) {
                    filter_changed ||=
                        config.filter[lvl][i] !== old.filter[lvl][i];
                }
            }
        }

        let sort_changed = old.sort.length !== config.sort.length;
        if (sort_changed) {
            for (const lvl in old.sort) {
                for (const i in config.sort[lvl]) {
                    sort_changed ||= config.sort[lvl][i] !== old.sort[lvl][i];
                }
            }
        }

        this._reset_scroll_top = group_by_changed;
        this._reset_scroll_left = split_by_changed;
        this._reset_select =
            group_by_changed ||
            split_by_changed ||
            filter_changed ||
            sort_changed ||
            columns_changed;

        this._reset_column_size =
            split_by_changed ||
            group_by_changed ||
            columns_changed ||
            type_changed;
    }

    const [table_schema, num_rows, schema, expression_schema, _edit_port] =
        await Promise.all([
            table.schema(),
            view.num_rows(),
            view.schema(),
            view.expression_schema(),
            this.parentElement.getEditPort(),
        ]);

    const _plugin_background = chroma(
        get_rule(regular, "--plugin--background", "#FFFFFF"),
    ).rgb();

    const _pos_fg_color = make_color_record(
        get_rule(regular, "--rt-pos-cell--color", "#338DCD"),
    );

    const _neg_fg_color = make_color_record(
        get_rule(regular, "--rt-neg-cell--color", "#FF5942"),
    );

    const _pos_bg_color = make_color_record(
        blend(_pos_fg_color[0], _plugin_background),
    );

    const _neg_bg_color = make_color_record(
        blend(_neg_fg_color[0], _plugin_background),
    );

    const _color = make_color_record(
        get_rule(regular, "--active--color", "#ff0000"),
    );

    const _schema = { ...schema, ...expression_schema };
    const _table_schema = {
        ...table_schema,
        ...expression_schema,
    };

    const _column_paths = [];
    const _is_editable = [];
    const _column_types = [];

    let _edit_mode = this._edit_mode || "READ_ONLY";
    this._edit_button.dataset.editMode = _edit_mode;
    const model = Object.assign(extend, {
        _edit_port,
        _view: view,
        _table: table,
        _table_schema,
        _config: config,
        _num_rows: num_rows,
        _schema,
        _ids: [],
        _plugin_background,
        _color,
        _pos_fg_color,
        _neg_fg_color,
        _pos_bg_color,
        _neg_bg_color,
        _column_paths,
        _column_types,
        _is_editable,
        _edit_mode,
        _selection_state: {
            selected_areas: [],
            dirty: false,
        },
        _row_header_types: config.group_by.map((column_path) => {
            return _table_schema[column_path];
        }),
        _series_color_map: new Map(),
        _series_color_seed: new Map(),
        get_psp_type,
    });

    // Re-use div factory
    model._div_factory = model._div_factory || new ElemFactory("div");
    regular.setDataListener(
        createDataListener(this.parentElement).bind(model, regular),
        {
            virtual_mode:
                window
                    .getComputedStyle(regular)
                    .getPropertyValue("--datagrid-virtual-mode")
                    ?.trim() || "both",
        },
    );

    return model;
}
