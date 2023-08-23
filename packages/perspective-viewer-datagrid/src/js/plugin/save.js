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
import { save_column_size_overrides } from "../model/column_overrides.js";

export function get_default_config(model, column_type) {
    let default_config;
    if (column_type === "integer" || column_type === "float") {
        default_config = {
            fg_gradient: 0,
            pos_fg_color: model._pos_fg_color[0],
            neg_fg_color: model._neg_fg_color[0],
            number_fg_mode: "color",
            bg_gradient: 0,
            pos_bg_color: model._pos_bg_color[0],
            neg_bg_color: model._neg_bg_color[0],
            number_bg_mode: "disabled",
        };
    } else {
        // date, datetime, string, boolean
        default_config = {
            color: model._color[0],
            bg_color: model._color[0],
        };
    }

    if (column_type === "float") {
        default_config.fixed = 2;
    } else if (column_type === "integer") {
        default_config.fixed = 0;
    }
    return default_config;
}

/**
 * Serialize the state of this plugin to a token.
 *
 * @returns This plugin's state as a token.
 */
export function save() {
    if (this.regular_table) {
        const datagrid = this.regular_table;
        const token = {
            columns: {},
            scroll_lock: !!this._is_scroll_lock,
            editable: !!this._is_edit_mode,
        };

        for (const col of Object.keys(datagrid[PRIVATE_PLUGIN_SYMBOL] || {})) {
            const config = Object.assign(
                {},
                datagrid[PRIVATE_PLUGIN_SYMBOL][col]
            );
            if (config?.pos_fg_color || config?.pos_bg_color) {
                config.pos_fg_color = config.pos_fg_color?.[0];
                config.neg_fg_color = config.neg_fg_color?.[0];
                config.pos_bg_color = config.pos_bg_color?.[0];
                config.neg_bg_color = config.neg_bg_color?.[0];
            }

            if (config?.color) {
                config.color = config.color[0];
            }

            token.columns[col] = config;
        }

        const column_size_overrides = save_column_size_overrides.call(this);

        for (const col of Object.keys(column_size_overrides || {})) {
            if (!token.columns[col]) {
                token.columns[col] = {};
            }

            token.columns[col].column_size_override =
                column_size_overrides[col];
        }

        if (this.model) {
            token.default_config = {};
            for (let val of [
                "string",
                "float",
                "integer",
                "bool",
                "date",
                "datetime",
            ]) {
                token.default_config[val] = get_default_config(this.model, val);
            }
        }

        return JSON.parse(JSON.stringify(token));
    }
    return {};
}
