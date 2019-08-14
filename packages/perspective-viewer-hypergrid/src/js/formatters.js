/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {get_type_config, get_types} from "@finos/perspective/dist/esm/config";

function null_formatter(formatter, null_value = "") {
    let old = formatter.format.bind(formatter);
    formatter.format = val => {
        if (typeof val === "string") {
            return val;
        }
        if (null_value === val) {
            return "-";
        }
        let x = old(val);
        if (x === "") {
            return "-";
        }
        return x;
    };

    return formatter;
}

function custom_formatter(formatter, f) {
    let old = formatter.format.bind(formatter);
    formatter.format = val => {
        val = f(old(val));
        if (!val) {
            return "-";
        }
        return val;
    };

    return formatter;
}

export function set_formatters(grid) {
    const formatters = {};
    for (const type of get_types()) {
        const config = get_type_config(type);
        const format_function = {
            float: grid.localization.NumberFormatter,
            integer: grid.localization.NumberFormatter,
            datetime: grid.localization.DateFormatter,
            date: grid.localization.DateFormatter
        }[config.type || type];
        if (format_function) {
            if (typeof config.format === "string") {
                formatters[type] = custom_formatter(new format_function("en-us"), eval(config.format));
            } else {
                formatters[type] = null_formatter(new format_function("en-us", config.format), config.null_value);
            }
            grid.localization.add(`perspective-${type}`, formatters[type]);
        }
    }

    grid.localization.header = {
        format: value => grid.behavior.formatColumnHeader(value)
    };

    grid.localization.add("FinanceTree", {
        format: function(val, type) {
            const f = formatters[type];
            if (f) {
                return f.format(val);
            }
            return val;
        },
        parse: x => x
    });
}
