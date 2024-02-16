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

/**
 * @param {import("@finos/perspective").Type} type
 * @param {string} _group
 * @returns {import("@finos/perspective-viewer").PerspectiveColumnConfigValue}
 */
export default function column_style_opts(type, _group) {
    if (type === "integer" || type === "float")
        return {
            datagrid_number_style: {
                fg_gradient: 0,
                pos_fg_color: this.model._pos_fg_color[0],
                neg_fg_color: this.model._neg_fg_color[0],
                number_fg_mode: "color",
                bg_gradient: 0,
                pos_bg_color: this.model._pos_bg_color[0],
                neg_bg_color: this.model._neg_bg_color[0],
                number_bg_mode: "disabled",
                fixed: type === "float" ? 2 : 0,
            },
            number_string_format: {},
        };
    else if (type === "date" || type === "datetime" || type === "string") {
        let control =
            type === "date" || type === "datetime"
                ? "datagrid_datetime_style"
                : `datagrid_string_style`;
        return {
            [control]: {
                color: this.model._color[0],
                bg_color: this.model._color[0],
            },
        };
    } else {
        return null;
    }
}
