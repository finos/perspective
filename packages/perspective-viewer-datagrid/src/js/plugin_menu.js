/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import chroma from "chroma-js";

export const PLUGIN_SYMBOL = Symbol("Plugin Symbol");

export function make_gradient(chromahex) {
    const [r, g, b] = chromahex.rgb();
    const [r1, g1, b1] = chromahex
        .set("hsl.h", (chromahex.get("hsl.h") - 15) % 360)
        .rgb();
    const [r2, g2, b2] = chromahex
        .set("hsl.h", (chromahex.get("hsl.h") + 15) % 360)
        .rgb();
    return `linear-gradient(to right top,rgb(${r1},${g1},${b1}),rgb(${r},${g},${b}) 50%,rgb(${r2},${g2},${b2}))`;
}

export function activate_plugin_menu(regularTable, target, column_max) {
    const is_numeric = typeof column_max !== "undefined";
    const MENU = document.createElement(
        `perspective-${is_numeric ? "number" : "string"}-column-style`
    );
    const target_meta = regularTable.getMeta(target);
    const column_name =
        target_meta.column_header[target_meta.column_header.length - 1];
    const column_type = this._schema[column_name];
    let default_config;
    if (is_numeric) {
        default_config = {
            gradient: column_max,
            pos_color: this._pos_color[0],
            neg_color: this._neg_color[0],
            number_color_mode: "foreground",
        };
    } else {
        default_config = {
            color: this._color[0],
        };
    }

    if (column_type === "string") {
        // do nothing
    } else if (column_type === "float") {
        default_config.fixed = 2;
    } else if (column_type === "integer") {
        default_config.fixed = 0;
    } else {
        this._open_column_styles_menu.pop();
        regularTable.draw({preserve_width: true});
        return;
    }

    const scroll_handler = () => MENU.blur();
    const update_handler = (event) => {
        const config = event.detail;
        if (config.pos_color) {
            config.pos_color = [
                config.pos_color,
                ...chroma(config.pos_color).rgb(),
                make_gradient(chroma(config.pos_color)),
            ];
            config.neg_color = [
                config.neg_color,
                ...chroma(config.neg_color).rgb(),
                make_gradient(chroma(config.neg_color)),
            ];
        }

        if (config.color) {
            config.color = [
                config.color,
                ...chroma(config.color).rgb(),
                make_gradient(chroma(config.color)),
            ];
        }

        regularTable[PLUGIN_SYMBOL] = regularTable[PLUGIN_SYMBOL] || {};
        regularTable[PLUGIN_SYMBOL][column_name] = config;
        regularTable.draw({preserve_width: true});
        regularTable.parentElement.dispatchEvent(
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
        MENU.destroy();
        this._open_column_styles_menu.pop();
        await regularTable.draw({preserve_width: true});
        regularTable.parentElement.dispatchEvent(
            new Event("perspective-config-update")
        );
    };

    MENU.addEventListener("perspective-column-style-change", update_handler);
    MENU.addEventListener("blur", blur_handler);
    regularTable.addEventListener("regular-table-scroll", scroll_handler);

    // Get the current column style config
    const pset = regularTable[PLUGIN_SYMBOL] || {};
    const config = Object.assign(
        {},
        (pset[column_name] = pset[column_name] || {})
    );

    if (config.pos_color) {
        config.pos_color = config.pos_color[0];
        config.neg_color = config.neg_color[0];
    }

    if (config.color) {
        config.color = config.color[0];
    }

    MENU.open(target, config, default_config);
}
