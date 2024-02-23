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

import { get_type_config } from "@finos/perspective/src/js/config/index.js";

const FORMATTER_CONS = {
    datetime: Intl.DateTimeFormat,
    date: Intl.DateTimeFormat,
    integer: Intl.NumberFormat,
    float: Intl.NumberFormat,
    boolean: class {
        format(val) {
            return val ? "true" : "false";
        }
    },
};

export class FormatterCache {
    constructor() {
        this._formatters = new Map();
    }

    create_datetime_formatter(type, plugin) {
        const type_config = get_type_config(type);
        if (type === "datetime") {
            if (plugin.format !== "custom") {
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
            } else {
                const options = {
                    // ...type_config.format,
                    timeZone: plugin.timeZone,
                    second: plugin.second,
                    minute: plugin.minute,
                    hour: plugin.hour,
                    day: plugin.day,
                    weekday: plugin.weekday,
                    month: plugin.month,
                    year: plugin.year,
                    hour12: plugin.hour12,
                    fractionalSecondDigits: plugin.fractionalSecondDigits,
                };

                if (options.year === "disabled") {
                    options.year = undefined;
                } else if (options.year === undefined) {
                    options.year = "2-digit";
                }

                if (options.month === "disabled") {
                    options.month = undefined;
                } else if (options.month === undefined) {
                    options.month = "numeric";
                }

                if (options.day === "disabled") {
                    options.day = undefined;
                } else if (options.day === undefined) {
                    options.day = "numeric";
                }

                if (options.weekday === "disabled") {
                    options.weekday = undefined;
                }

                if (options.hour === "disabled") {
                    options.hour = undefined;
                } else if (options.hour === undefined) {
                    options.hour = "numeric";
                }

                if (options.minute === "disabled") {
                    options.minute = undefined;
                } else if (options.minute === undefined) {
                    options.minute = "numeric";
                }

                if (options.second === "disabled") {
                    options.second = undefined;
                } else if (options.second === undefined) {
                    options.second = "numeric";
                }

                if (options.hour12 === undefined) {
                    options.hour12 = true;
                }

                return new Intl.DateTimeFormat([], options);
            }
        } else {
            const options = {
                ...type_config.format,
                dateStyle: plugin.dateStyle,
            };

            if (options.dateStyle === "disabled") {
                options.dateStyle = undefined;
            } else if (options.dateStyle === undefined) {
                options.dateStyle = type_config.format.dateStyle;
            }

            return new Intl.DateTimeFormat([], options);
        }
    }

    create_number_formatter(type, plugin) {
        let { format } = get_type_config(type);
        if (plugin.number_string_format !== undefined) {
            format = plugin.number_string_format;
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
            plugin.timeZone,
            plugin.dateStyle,
            plugin.timeStyle,
            plugin.fractionalSecondDigits,
            plugin.format,
            plugin.year,
            plugin.month,
            plugin.day,
            plugin.weekday,
            plugin.hour,
            plugin.minute,
            plugin.second,
            plugin.hour12,
            ...Object.values(plugin.number_string_format ?? {}),
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
