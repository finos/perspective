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

import Semver from "./semver";
import { Options } from "../migrate";
import { Config261 } from "./2-6-1";
import {
    PerspectiveColumnConfig,
    PerspectiveColumnConfigValue,
} from "../perspective-viewer";

/**
 * Migrates from 2.7.1. Focus is on plugin API changes, moving plugin_config.columns to column_config
 * @param old
 * @param options
 * @returns
 */
export default function migrate_2_7_1(old: Config271, options: Options) {
    let next_version = options.version_chain.shift();
    if (old.version?.gt(next_version!)) {
        return old;
    } else if (options.warn) {
        console.warn(`Migrating 2.7.1 -> ${next_version}`);
    }
    old.version = new Semver(next_version!);

    old.column_config = old.column_config ?? {};

    const has_config = !!old.plugin_config?.columns;
    const has_plugin =
        old.plugin === "Datagrid" || old.plugin === "X/Y Scatter";
    if (has_config && has_plugin) {
        if (options.warn) {
            console.warn("Migrating plugin_config to column_config!");
        }
        old.column_config = old.column_config ?? {};
        let entries = Object.entries(old.plugin_config.columns);
        for (let [column_name, value_map] of entries) {
            old.column_config[column_name] =
                old.column_config[column_name] ?? {};

            if (old.plugin === "X/Y Scatter") {
                old.column_config[column_name].symbols =
                    old.plugin_config.columns[column_name]?.symbols ?? {};
                delete old.plugin_config.columns[column_name];
            } else {
                const cwo =
                    old.plugin_config.columns[column_name]
                        .column_width_override;
                delete old.plugin_config.columns[column_name]
                    .column_width_override;
                for (const [key, val] of Object.entries(value_map)) {
                    let control: keyof PerspectiveColumnConfigValue;
                    switch (key) {
                        case "number_fg_mode":
                        case "number_bg_mode":
                        case "fixed":
                        case "pos_fg_color":
                        case "neg_fg_color":
                        case "pos_bg_color":
                        case "neg_bg_color":
                        case "fg_gradient":
                        case "bg_gradient": {
                            control = "datagrid_number_style";
                            break;
                        }
                        case "timeZone":
                        case "datetime_color_mode":
                        case "fractionalSecondDigits":
                        case "second":
                        case "minute":
                        case "hour":
                        case "day":
                        case "weekday":
                        case "month":
                        case "year":
                        case "hour12":
                        case "dateStyle":
                        case "timeStyle": {
                            control = "datagrid_datetime_style";
                            break;
                        }
                        case "string_color_mode": {
                            control = "datagrid_string_style";
                            break;
                        }
                        case "format": {
                            if (val === "custom") {
                                control = "datagrid_datetime_style";
                            } else {
                                control = "datagrid_string_style";
                            }
                            break;
                        }
                        case "color": {
                            if (
                                //@ts-ignore
                                value_map.datetime_color_mode ||
                                old.column_config[column_name]
                                    ?.datagrid_datetime_style
                                    ?.datetime_color_mode
                            ) {
                                control = "datagrid_datetime_style";
                            } else if (
                                //@ts-ignore
                                value_map.string_color_mode ||
                                old.column_config[column_name]
                                    ?.datagrid_string_style?.string_color_mode
                            ) {
                                control = "datagrid_string_style";
                            }
                            break;
                        }
                    }

                    // @ts-ignore this is confused by union of struct types with symbols as Record<string, string>
                    old.column_config[column_name][control] =
                        old.column_config[column_name][control] ?? {};
                    old.column_config[column_name][control][key] = val;
                    delete old.plugin_config.columns[column_name][key];
                }
                if (!!cwo) {
                    old.plugin_config.columns[column_name] = {
                        column_width_override: cwo,
                    };
                } else {
                    delete old.plugin_config.columns[column_name];
                }
            }
        }
        if (
            old.plugin === "X/Y Scatter" &&
            Object.keys(old.plugin_config?.columns).length === 0
        ) {
            delete old.plugin_config?.columns;
        }
    }

    if (options.verbose) {
        console.log(old);
    }
    return old;
}

export type Config271 = Config261 & {
    column_config?: PerspectiveColumnConfig;
};
