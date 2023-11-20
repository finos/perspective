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

import { cmp_semver, parse_semver } from "../migrate";

/**
 * Migrates from 2.6.1
 * @param old
 * @param options
 * @returns
 */
export default function migrate_2_6_1(old, options) {
    if (cmp_semver(old.version, "2.6.1")) {
        return old;
    } else if (options.warn) {
        console.warn("Migrating from 2.6.1");
    }
    old.version = parse_semver("2.6.1");

    // Migrate X/Y Scatter plugin
    if (old.plugin === "X/Y Scatter") {
        for (const i in old.plugin_config.columns) {
            const entries = Object.entries(old.plugin_config.columns[i]);
            const mapped_entries = entries.map(([grp_name, grp_val]) => {
                if (grp_name === "symbols" && Array.isArray(grp_val)) {
                    if (options.warn) {
                        console.warn(
                            `Replacing depcrecated X/Y Scatter Plot symbol config ${grp_val}`
                        );
                    }
                    const obj = {};
                    for (const i in grp_val) {
                        const item = grp_val[i];
                        obj[item.key] = item.value;
                    }
                    grp_val = obj;
                }
                return [grp_name, grp_val];
            });
            old.plugin_config.columns[i] = Object.fromEntries(mapped_entries);
        }
    }

    // check for string expressions, replace with objects
    let new_exprs = {};
    for (let i in old.expressions) {
        if (typeof old.expressions[i] === "string") {
            if (options.warn) {
                console.warn(
                    "Replacing deprecated string expression with object"
                );
            }
            let old_expr = old.expressions[i];
            let [whole_expr, name, expr] = old_expr.match(
                /\/\/\s*([^\n]+)\n(.*)/
            ) ?? [old_expr, null, null];
            if (name && expr) {
                new_exprs[name] = expr;
            } else {
                new_exprs[whole_expr] = whole_expr;
            }
        }
    }
    old.expressions = new_exprs;

    return old;
}
