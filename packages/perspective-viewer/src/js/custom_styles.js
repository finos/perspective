/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {get_type_config, get_types} from "@finos/perspective";

export function get_style(elem, name) {
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

function get_measure(elem, name) {
    let value;
    if (window.ShadyCSS) {
        value = window.ShadyCSS.getComputedStyleValue(elem, name);
    } else {
        value = getComputedStyle(elem).getPropertyValue(name);
    }
    if (value.trim() === "") {
        return undefined;
    }
    return parseInt(value);
}

function get_font(elem, title) {
    if (title.length > 0) {
        title += "--";
    }
    const font_size = get_style(elem, `${title}font-size`);
    const font_family = get_style(elem, `${title}font-family`);

    // FIXME this sucks but it is difficult to partially apply fonts in
    // Hypergrid's API Fonts will not be picked up unless both font-size and
    // font-family are defined for a specific scope.
    if (!font_size || !font_family) {
        return undefined;
    }
    return `${font_size} ${font_family}`;
}

function copy_defined(source, dest, f) {
    for (const key of Object.keys(source)) {
        const val = source[key];
        if (Array.isArray(val) && f) {
            for (const candidate of val) {
                const style = f(candidate);
                if (style !== undefined) {
                    dest[key] = style;
                    break;
                }
            }
        } else if (typeof val === "string" && f) {
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

function calc_rec(result, type, elem, types, iter, f) {
    result[type] = result[type] || {};
    for (const props of iter) {
        copy_defined(props, result[type], name => f(elem, name));
        for (const parent of types[type]) {
            copy_defined(props, result[type], name => f(elem, `--${parent}${name}`));
        }
    }
}

function get_type_deps() {
    const types = {"": []};
    for (const type of get_types()) {
        types[type] = [];
        let parent = type;
        while (parent && parent.length) {
            types[type].unshift(parent);
            parent = get_type_config(parent).type;
        }
    }
    return types;
}

const STYLE_PROPERTIES = Symbol("Perspective Style Properties");

export class PropsBuilder {
    constructor() {
        this._staged_props = [];
        this._staged_fonts = [];
        this._staged_measures = [];
    }

    add_measures(props) {
        this._staged_measures.push(props);
        this._initialized = false;
    }

    add_styles(props) {
        this._staged_props.push(props);
        this._initialized = false;
    }

    add_fonts(props) {
        this._staged_fonts.push(props);
        this._initialized = false;
    }

    clear_properties(elem) {
        delete elem[STYLE_PROPERTIES];
    }

    get_properties(elem) {
        if (!elem[STYLE_PROPERTIES]) {
            const types = get_type_deps();
            const result = (elem[STYLE_PROPERTIES] = {});
            calc_rec(result, "", elem, types, this._staged_measures, get_measure);
            calc_rec(result, "", elem, types, this._staged_props, get_style);
            calc_rec(result, "", elem, types, this._staged_fonts, get_font);
            for (const type of get_types()) {
                calc_rec(result, type, elem, types, this._staged_measures, get_measure);
                calc_rec(result, type, elem, types, this._staged_props, get_style);
                calc_rec(result, type, elem, types, this._staged_fonts, get_font);
            }
        }
        return elem[STYLE_PROPERTIES];
    }
}
