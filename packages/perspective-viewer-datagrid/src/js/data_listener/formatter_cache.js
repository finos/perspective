/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { get_type_config } from "@finos/perspective/src/js/config/index.js";

const FORMATTER_CONS = {
    datetime: Intl.DateTimeFormat,
    date: Intl.DateTimeFormat,
    integer: Intl.NumberFormat,
    float: Intl.NumberFormat,
    boolean: class {
        format(val) {
            return val ? "check" : "close";
        }
    },
};

export class FormatterCache {
    constructor() {
        this._formatters = new Map();
    }

    create_datetime_formatter(type, plugin) {
        const type_config = get_type_config(type);
        const options = {
            ...type_config.format,
            timeZone: plugin.timeZone,
            dateStyle: plugin.dateStyle,
            timeStyle: plugin.timeStyle,
        };

        if (options.dateStyle === "disabled") {
            options.dateStyle = undefined;
        } else if (options.dateStyle === undefined) {
            options.dateStyle = type_config.format.dateStyle;
        }

        if (options.timeStyle === "disabled") {
            options.timeStyle = undefined;
        } else if (options.timeStyle === undefined) {
            options.timeStyle = type_config.format.timeStyle;
        }

        return new Intl.DateTimeFormat([], options);
    }

    create_number_formatter(type, plugin) {
        const { format } = get_type_config(type);
        if (plugin.fixed !== undefined) {
            format.minimumFractionDigits = plugin.fixed;
            format.maximumFractionDigits = plugin.fixed;
        }

        return new FORMATTER_CONS[type]([], format);
    }

    create_boolean_formatter(type, plugin) {
        const type_config = get_type_config(type);
        return new FORMATTER_CONS[type]([], type_config.format);
    }

    get(type, plugin) {
        let formatter_key = [
            type,
            plugin.fixed,
            plugin.timeZone,
            plugin.dateStyle,
            plugin.timeStyle,
        ].join("-");

        if (!this._formatters.has(formatter_key)) {
            const type_config = get_type_config(type);
            if (type === "date" || type === "datetime") {
                this._formatters.set(
                    formatter_key,
                    this.create_datetime_formatter(type, plugin)
                );
            } else if (type === "integer" || type === "float") {
                this._formatters.set(
                    formatter_key,
                    this.create_number_formatter(type, plugin)
                );
            } else if (type === "boolean") {
                this._formatters.set(
                    formatter_key,
                    this.create_boolean_formatter(type, plugin)
                );
            } else {
                this._formatters.set(formatter_key, false);
            }
        }

        return this._formatters.get(formatter_key);
    }
}
