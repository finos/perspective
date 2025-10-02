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

import { style_cell_flash } from "./cell_flash.js";
import {
    rgbaToRgb,
    infer_foreground_from_background,
} from "../../color_utils.js";

export function cell_style_numeric(plugin, td, metadata, is_settings_open) {
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
        if (metadata._is_hidden_by_aggregate_depth) {
            td.style.animation = "";
            td.style.backgroundColor = "";
        } else if (plugin?.number_bg_mode === "color") {
            td.style.animation = "";
            td.style.backgroundColor = hex;
        } else if (plugin?.number_bg_mode === "gradient") {
            const a = Math.max(
                0,
                Math.min(1, Math.abs(metadata.user / plugin.bg_gradient)),
            );
            const source = this._plugin_background;
            const foreground = infer_foreground_from_background(
                rgbaToRgb([r, g, b, a], source),
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
                neg_bg_color,
                is_settings_open,
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

    if (metadata._is_hidden_by_aggregate_depth) {
        td.style.backgroundColor = "";
        td.style.color = "";
    } else if (plugin?.number_fg_mode === "disabled") {
        if (plugin?.number_bg_mode === "color") {
            const source = this._plugin_background;
            const foreground = infer_foreground_from_background(
                rgbaToRgb([bg_tuple[1], bg_tuple[2], bg_tuple[3], 1], source),
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
    } else if (plugin?.number_fg_mode === "color" || !plugin?.number_fg_mode) {
        td.style.color = hex;
    }
}
