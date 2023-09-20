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
 * Gets the default column configurations used for styling.
 * @returns The default configuration per type.
 */
export default function getDefaultConfig() {
    const get_type_default = (column_type) => {
        let type_default;
        if (column_type === "integer" || column_type === "float") {
            type_default = {
                fg_gradient: 0,
                pos_fg_color: this.model._pos_fg_color[0],
                neg_fg_color: this.model._neg_fg_color[0],
                number_fg_mode: "color",
                bg_gradient: 0,
                pos_bg_color: this.model._pos_bg_color[0],
                neg_bg_color: this.model._neg_bg_color[0],
                number_bg_mode: "disabled",
                fixed: column_type === "float" ? 2 : 0,
            };
        } else {
            // date, datetime, string, boolean
            type_default = {
                color: this.model._color[0],
                bg_color: this.model._color[0],
            };
        }
        return type_default;
    };

    let default_config = {};
    for (let val of [
        "string",
        "float",
        "integer",
        "bool",
        "date",
        "datetime",
    ]) {
        default_config[val] = get_type_default(val);
    }
    return default_config;
}
