/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {get_type_config, get_types} from "@finos/perspective/dist/esm/config";

function get_style(elem, name) {
    let value;
    if (window.ShadyCSS) {
        value = window.ShadyCSS.getComputedStyleValue(elem, name);
    } else {
        value = getComputedStyle(elem).getPropertyValue(name);
    }
    if (value.trim() === "") {
        return undefined;
    }
    return value;
}

function get_font(elem, title) {
    if (title.length > 0) {
        title += "--";
    }
    const font_size = get_style(elem, `${title}font-size`);
    const font_family = get_style(elem, `${title}font-family`);

    // FIXME this sucks but it is difficult to partially apply fonts in Hypergrid's API
    // Fonts will not be picked up unless both font-size and font-family are defined
    // for a specific scope.
    if (!font_size || !font_family) {
        return undefined;
    }
    return `${font_size} ${font_family}`;
}

function copy_defined(source, dest, f) {
    for (const key of Object.keys(source)) {
        const val = source[key];
        if (typeof val === "string" && f) {
            const style = f(val);
            if (style !== undefined) {
                dest[key] = style;
            }
        } else if (typeof val === "object") {
            dest[key] = dest[key] || {};
            copy_defined(val, dest[key], f);
        } else {
            dest[key] = val;
        }
    }
}

export class PropsBuilder {
    constructor(elem) {
        this._props = {};
        this._elem = elem;
        this._types = {};

        for (const type of get_types()) {
            this._types[type] = [];
            this._props[type] = {};
            let parent = type;
            while (parent && parent.length) {
                this._types[type].unshift(parent);
                parent = get_type_config(parent).type;
            }
        }
    }

    add(props) {
        copy_defined(props, this._props);
    }

    add_styles(props) {
        for (const type of get_types()) {
            copy_defined(props, this._props[type], name => get_style(this._elem, name));
            for (const parent of this._types[type]) {
                copy_defined(props, this._props[type], name => get_style(this._elem, `--${parent}${name}`));
            }
        }
    }

    add_fonts(props) {
        for (const type of get_types()) {
            copy_defined(props, this._props[type], name => get_font(this._elem, name));
            for (const type of this._types[type]) {
                copy_defined(props, this._props[type], name => get_font(this._elem, `--${type}${name}`));
            }
        }
    }

    get props() {
        return this._props;
    }
}
