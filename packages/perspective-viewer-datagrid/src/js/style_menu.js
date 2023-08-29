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

import { make_color_record } from "./color_utils.js";
import { PRIVATE_PLUGIN_SYMBOL } from "./model";

export function activate_plugin_menu(regularTable, target, column_max) {
    const target_meta = regularTable.getMeta(target);
    const column_name = target_meta.column_header[this._config.split_by.length];
    const column_type = this._schema[column_name];
    const is_numeric = column_type === "integer" || column_type === "float";
    const MENU = document.createElement(
        `perspective-${
            {
                float: "number",
                integer: "number",
                string: "string",
                date: "date",
                datetime: "datetime",
            }[column_type]
        }-column-style`
    );

    let default_config;
    if (is_numeric) {
        default_config = {
            fg_gradient: column_max,
            pos_fg_color: this._pos_fg_color[0],
            neg_fg_color: this._neg_fg_color[0],
            number_fg_mode: "color",
            bg_gradient: column_max,
            pos_bg_color: this._pos_bg_color[0],
            neg_bg_color: this._neg_bg_color[0],
            number_bg_mode: "disabled",
        };
    } else {
        // date, datetime, string, boolean
        default_config = {
            color: this._color[0],
            bg_color: this._color[0],
        };
    }

    if (
        column_type === "string" ||
        column_type === "date" ||
        column_type === "datetime"
    ) {
        // do nothing
    } else if (column_type === "float") {
        default_config.fixed = 2;
    } else if (column_type === "integer") {
        default_config.fixed = 0;
    } else {
        this._open_column_styles_menu.pop();
        target.classList.remove("psp-menu-open");
        return;
    }

    const scroll_handler = () => MENU.blur();
    const update_handler = (event) => {
        const config = event.detail;
        if (config.pos_fg_color) {
            config.pos_fg_color = make_color_record(config.pos_fg_color);
            config.neg_fg_color = make_color_record(config.neg_fg_color);
        }

        if (config.pos_bg_color) {
            config.pos_bg_color = make_color_record(config.pos_bg_color);
            config.neg_bg_color = make_color_record(config.neg_bg_color);
        }

        if (config.color) {
            config.color = make_color_record(config.color);
        }

        if (config.bg_color) {
            config.bg_color = make_color_record(config.bg_color);
        }

        regularTable[PRIVATE_PLUGIN_SYMBOL] =
            regularTable[PRIVATE_PLUGIN_SYMBOL] || {};
        regularTable[PRIVATE_PLUGIN_SYMBOL][column_name] = config;
        regularTable.draw({ preserve_width: true });
        regularTable.parentElement.parentElement.dispatchEvent(
            new Event("perspective-config-update")
        );
    };

    const blur_handler = async () => {
        regularTable.removeEventListener(
            "regular-table-scroll",
            scroll_handler
        );

        MENU.removeEventListener(
            "perspective-column-style-change",
            update_handler
        );

        MENU.removeEventListener("blur", blur_handler);
        const popped = this._open_column_styles_menu.pop();
        regularTable.parentElement.parentElement.dispatchEvent(
            new Event("perspective-config-update")
        );

        if (popped !== this._open_column_styles_menu[0]) {
            target.classList.remove("psp-menu-open");
        }

        MENU.destroy();
    };

    MENU.addEventListener("perspective-column-style-change", update_handler);
    MENU.addEventListener("blur", blur_handler);
    regularTable.addEventListener("regular-table-scroll", scroll_handler);

    // Get the current column style config
    const pset = regularTable[PRIVATE_PLUGIN_SYMBOL] || {};
    const config = Object.assign(
        {},
        (pset[column_name] = pset[column_name] || {})
    );

    if (config.pos_fg_color || config.pos_bg_color) {
        config.pos_fg_color = config.pos_fg_color?.[0];
        config.neg_fg_color = config.neg_fg_color?.[0];
        config.pos_bg_color = config.pos_bg_color?.[0];
        config.neg_bg_color = config.neg_bg_color?.[0];
    }

    if (config.color) {
        config.color = config.color[0];
    }

    if (config.bg_color) {
        config.bg_color = config.bg_color[0];
    }

    MENU.open(target, config, default_config);
}
