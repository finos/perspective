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

export function get_or_create_column_config(old, column) {
    let viewer_column_config = (old.column_config = old.column_config ?? {});
    return (viewer_column_config[column] = viewer_column_config[column] ?? {});
}

export default function migrate_2_7_1(old, options) {
    let next_version = options.version_chain.shift();
    if (old.version?.gt(next_version)) {
        return old;
    } else if (options.warn) {
        console.warn(`Migrating 2.7.1 -> ${next_version}`);
    }
    old.version = new Semver(next_version);

    // Migrate plugin_config[column].fixed to column_config[column].precision
    if (old.plugin === "Datagrid") {
        let columns = old.plugin_config?.columns ?? {};
        for (let column in columns) {
            let fixed = columns[column].fixed;
            if (fixed !== undefined) {
                let column_config = get_or_create_column_config(old, column);
                if (Object.keys(column_config).length === 0) {
                    column_config.precision = fixed;
                    delete columns[column].fixed;
                }
            }
            if (Object.keys(columns[column]).length == 0) {
                delete columns[column];
            }
        }
        if (Object.keys(old.plugin_config?.columns).length == 0) {
            delete old.plugin_config?.columns;
        }
    }

    return old;
}
