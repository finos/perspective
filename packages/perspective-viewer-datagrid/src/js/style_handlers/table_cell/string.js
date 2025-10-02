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

export function cell_style_string(plugin, td, metadata) {
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
            rgbaToRgb([r, g, b, 1], source),
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
            rgbaToRgb([r, g, b, 1], source),
        );
        td.style.color = foreground;
        td.style.backgroundColor = hex2;
    } else {
        td.style.backgroundColor = "";
        td.style.color = "";
    }
}
