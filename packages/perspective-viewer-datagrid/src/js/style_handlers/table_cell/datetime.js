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
import {
    rgbaToRgb,
    infer_foreground_from_background,
} from "../../color_utils.js";

export function cell_style_datetime(plugin, td, metadata) {
    const column_name = metadata.column_header?.[this._config.split_by.length];

    const [hex, r, g, b, gradhex] = (() => {
        if (plugin?.color !== undefined) {
            return plugin.color;
        } else {
            return this._color;
        }
    })();

    if (metadata._is_hidden_by_aggregate_depth) {
        td.style.backgroundColor = "";
        td.style.color = "";
    } else if (
        plugin?.datetime_color_mode === "foreground" &&
        metadata.user !== null
    ) {
        td.style.color = hex;
        td.style.backgroundColor = "";
    } else if (
        plugin?.datetime_color_mode === "background" &&
        metadata.user !== null
    ) {
        const source = this._plugin_background;
        const foreground = infer_foreground_from_background(
            rgbaToRgb([r, g, b, 1], source),
        );
        td.style.color = foreground;
        td.style.backgroundColor = hex;
    } else {
        td.style.backgroundColor = "";
        td.style.color = "";
    }
}
