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
    PerspectiveViewerConfig,
} from "../perspective-viewer";
import { Config271 } from "./2-7-1";

/**
 * Migrates from 2.7.1. Focus is on plugin API changes, moving plugin_config.columns to column_config
 * @param old
 * @param options
 * @returns
 */
export default function migrate_2_8_0(old: Config271, options: Options) {
    let next_version = options.version_chain!.shift();
    if (old.version?.gt(next_version!)) {
        return old;
    } else if (options.warn) {
        console.warn(`Migrating 2.8.0 -> ${next_version}`);
    }
    old.version = new Semver(next_version!);

    for (let [col, val] of Object.entries(old.column_config ?? {})) {
        if (val?.datagrid_number_style?.fixed) {
            val.number_string_format = val.number_string_format ?? {};
            val.number_string_format["minimumFractionDigits"] =
                val.datagrid_number_style.fixed;
            val.number_string_format["maximumFractionDigits"] =
                val.datagrid_number_style.fixed;
            delete val.datagrid_number_style.fixed;
        }
    }

    if (options.verbose) {
        console.log(old);
    }
    return old;
}
