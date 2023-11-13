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

import { chain, parse_semver } from "../migrate";

/**
 * Migrates all viewer configs older than version 1.0.0.
 * @param old
 * @param omit_attributes
 * @param options
 * @returns The migrated viewer.
 */
export default function migrate_0_0_0(old, options) {
    if (old.version?.major > 0) {
        return old;
    } else {
        if (options.warn) {
            console.warn("Migrating pre-1.0.0 config");
        }
    }
    return chain(
        old,
        [
            migrate_group_by,
            migrate_split_by,
            migrate_filters,
            migrate_expressions,
            options.replace_defaults ? migrate_nulls : false,
            migrate_plugins,
            migrate_plugin_config,
            migrate_title,
            migrate_name_title_workspace,
            options.omit_attributes
                ? migrate_attributes_workspace
                : migrate_attributes_viewer,
            (old) => {
                old.version = parse_semver("0.0.0");
                return old;
            },
        ].filter((x) => !!x),
        options
    );
}

/**
 * Replace `null` properties with defaults.  This is not strictly behavioral,
 * as new `<perspective-viewer>` treats `null` as an explicit "reset to default"
 * instruction.  However, it may be necessary to ensure that `.save()` returns
 * identical results to `convert()`, which may be desirable when migrating a
 * database of layouts.
 * @param old
 * @param options
 * @returns
 */
function migrate_nulls(old, options) {
    for (const key of ["group_by", "split_by", "filter", "sort"]) {
        if (old[key] === null) {
            old[key] = [];
            if (options.warn) {
                console.warn(
                    `Deprecated perspective missing attribute "${key}" set to default"`
                );
            }
        }

        if ("aggregates" in old && old.aggregates === null) {
            old.aggregates = {};
            if (options.warn) {
                console.warn(
                    `Deprecated perspective missing attribute "aggregates" set to default"`
                );
            }
        }
    }

    return old;
}

/**
 * Helper for alias-replacement migrations
 * @param original
 * @param aliases
 * @returns
 */
function _migrate_field_aliases(original, aliases) {
    return function (old, options) {
        let count = 0;
        for (const pivot of aliases) {
            if (pivot in old) {
                if (count++ > 0) {
                    throw new Error(`Duplicate "${original}" fields`);
                }

                old[original] = old[pivot];
                if (pivot !== original) {
                    delete old[pivot];
                    if (options.warn) {
                        console.warn(
                            `Deprecated perspective attribute "${pivot}" renamed "${original}"`
                        );
                    }
                }
            }
        }

        return old;
    };
}

/**
 * Migrate `group_by` field aliases
 */
const migrate_group_by = _migrate_field_aliases("group_by", [
    "group_by",
    "row_pivots",
    "row-pivot",
    "row-pivots",
    "row_pivot",
]);

/**
 * Migrate `split_by` field aliases
 */
const migrate_split_by = _migrate_field_aliases("split_by", [
    "split_by",
    "column_pivots",
    "column-pivot",
    "column-pivots",
    "column_pivot",
    "col_pivots",
    "col-pivot",
    "col-pivots",
    "col_pivot",
]);

/**
 * Migrate `filters` field aliases
 */
const migrate_filters = _migrate_field_aliases("filter", ["filter", "filters"]);

/**
 * Migrate the old `computed-columns` format expressions to ExprTK
 * @param regex1
 * @param rep
 * @param expression
 * @param old
 * @param options
 * @returns
 */
function _migrate_expression(regex1, rep, expression, old, options) {
    if (regex1.test(expression)) {
        const replaced = expression.replace(regex1, rep);
        if (options.warn) {
            console.warn(
                `Deprecated perspective "expression" attribute value "${expression}" updated to "${replaced}"`
            );
        }

        for (const key of ["group_by", "split_by"]) {
            if (key in old) {
                for (const idx in old[key]) {
                    const pivot = old[key][idx];
                    if (pivot === expression.replace(/"/g, "")) {
                        old[key][idx] = replaced;
                        if (options.warn) {
                            console.warn(
                                `Deprecated perspective expression in "${key}" attribute "${expression}" replaced with "${replaced}"`
                            );
                        }
                    }
                }
            }
        }

        for (const filter of old.filter || []) {
            if (filter[0] === expression.replace(/"/g, "")) {
                filter[0] = replaced;
                if (options.warn) {
                    console.warn(
                        `Deprecated perspective expression in "filter" attribute "${expression}" replaced with "${replaced}"`
                    );
                }
            }
        }

        for (const sort of old.sort || []) {
            if (sort[0] === expression.replace(/"/g, "")) {
                sort[0] = replaced;
                if (options.warn) {
                    console.warn(
                        `Deprecated perspective expression in "sort" attribute "${expression}" replaced with "${replaced}"`
                    );
                }
            }
        }

        return replaced;
    } else {
        return expression;
    }
}

function migrate_title(old) {
    if (old["title"] === undefined) {
        old.title = null;
    }

    return old;
}

/**
 * Migrate `expressions` field from `computed-columns`
 * @param old
 * @param options
 * @returns
 */
function migrate_expressions(old, options) {
    if (old["computed-columns"]) {
        if ("expressions" in old) {
            throw new Error(`Duplicate "expressions" and "computed-columns`);
        }

        old.expressions = old["computed-columns"];
        delete old["computed-columns"];
        if (options.warn) {
            console.warn(
                `Deprecated perspective attribute "computed-columns" renamed "expressions"`
            );
        }

        const REPLACEMENTS = [
            [/^year_bucket\("(.+?)"\)/, `bucket("$1", 'y')`],
            [/^month_bucket\("(.+?)"\)/, `bucket("$1", 'M')`],
            [/^day_bucket\("(.+?)"\)/, `bucket("$1", 'd')`],
            [/^hour_bucket\("(.+?)"\)/, `bucket("$1", 'h')`],
            [/^minute_bucket\("(.+?)"\)/, `bucket("$1", 'm')`],
            [/^second_bucket\("(.+?)"\)/, `bucket("$1", 's')`],
        ];

        for (const idx in old.expressions) {
            let expression = old.expressions[idx];
            for (const [a, b] of REPLACEMENTS) {
                expression = _migrate_expression(
                    a,
                    b,
                    expression,
                    old,
                    options
                );
            }

            old.expressions[idx] = expression;
        }
    }

    return old;
}

/**
 * Migrate the `plugin` field
 * @param old
 * @param options
 * @returns
 */
function migrate_plugins(old, options) {
    const ALIASES = {
        datagrid: "Datagrid",
        Datagrid: "Datagrid",
        d3_y_area: "Y Area",
        "Y Area": "Y Area",
        d3_y_line: "Y Line",
        "Y Line": "Y Line",
        d3_xy_line: "X/Y Line",
        "X/Y Line": "X/Y Line",
        d3_y_scatter: "Y Scatter",
        "Y Scatter": "Y Scatter",
        d3_xy_scatter: "X/Y Scatter",
        "X/Y Scatter": "X/Y Scatter",
        d3_x_bar: "X Bar",
        "X Bar": "X Bar",
        d3_y_bar: "Y Bar",
        "Y Bar": "Y Bar",
        d3_heatmap: "Heatmap",
        Heatmap: "Heatmap",
        d3_treemap: "Treemap",
        Treemap: "Treemap",
        d3_sunburst: "Sunburst",
        Sunburst: "Sunburst",
    };

    if ("plugin" in old && old.plugin !== ALIASES[old.plugin]) {
        old.plugin = ALIASES[old.plugin];
        if (options.warn) {
            console.warn(
                `Deprecated perspective "plugin" attribute value "${
                    old.plugin
                }" updated to "${ALIASES[old.plugin]}"`
            );
        }
    }

    return old;
}

/**
 * Migrate the `plugin_config` field
 * @param old
 * @param options
 * @returns
 */
function migrate_plugin_config(old, options) {
    return !!old.plugin_config && old.plugin === "Datagrid"
        ? _migrate_datagrid(old, options)
        : old;
}

function _migrate_datagrid(old, options) {
    if (!old.plugin_config.columns) {
        if (options.warn) {
            console.warn(
                `Deprecated perspective attribute "plugin_config" moved to "plugin_config.columns"`
            );
        }

        const columns = {};
        for (const name of Object.keys(old.plugin_config)) {
            const column = old.plugin_config[name];
            delete old.plugin_config[name];

            if (typeof column.color_mode === "string") {
                if (column.color_mode === "foreground") {
                    column.number_fg_mode = "color";
                } else if (column.color_mode === "bar") {
                    column.number_fg_mode = "bar";
                } else if (column.color_mode === "background") {
                    column.number_bg_mode = "color";
                } else if (column.color_mode === "gradient") {
                    column.number_bg_mode = "gradient";
                } else {
                    console.warn(`Unknown color_mode ${column.color_mode}`);
                }

                // column.number_color_mode = column.color_mode;
                delete column["color_mode"];

                if (options.warn) {
                    console.warn(
                        `Deprecated perspective attribute "color_mode" renamed "number_bg_mode"`
                    );
                }
            }

            columns[name] = column;
        }

        old.plugin_config.columns = columns;
        if (options.replace_defaults) {
            old.plugin_config.editable = false;
            old.plugin_config.scroll_lock = true;
        }
    }

    // Post 1.5, number columns have been split between `fg` and `bg`
    // style param contexts.
    for (const name of Object.keys(old.plugin_config.columns)) {
        const column = old.plugin_config.columns[name];

        if (typeof column.number_color_mode === "string") {
            if (column.number_color_mode === "foreground") {
                column.number_fg_mode = "color";
            } else if (column.number_color_mode === "bar") {
                column.number_fg_mode = "bar";
            } else if (column.number_color_mode === "background") {
                column.number_bg_mode = "color";
            } else if (column.number_color_mode === "gradient") {
                column.number_bg_mode = "gradient";
            }

            delete column["number_color_mode"];

            if (options.warn) {
                console.warn(
                    `Deprecated perspective attribute "number_color_mode" renamed "number_bg_mode"`
                );
            }
        }

        if (column.gradient !== undefined) {
            if (column.number_bg_mode === "gradient") {
                column.bg_gradient = column.gradient;
            } else if (column.number_fg_mode === "bar") {
                column.fg_gradient = column.gradient;
            }

            delete column["gradient"];
            if (options.warn) {
                console.warn(
                    `Deprecated perspective attribute "gradient" renamed "bg_gradient"`
                );
            }
        }

        if (column.pos_color !== undefined) {
            if (column.number_bg_mode !== undefined) {
                column.pos_bg_color = column.pos_color;
            } else if (column.number_fg_mode !== undefined) {
                column.pos_fg_color = column.pos_color;
            }

            delete column["pos_color"];
            if (options.warn) {
                console.warn(
                    `Deprecated perspective attribute "pos_color" renamed "pos_bg_color"`
                );
            }
        }

        if (column.neg_color !== undefined) {
            if (column.number_bg_mode !== undefined) {
                column.neg_bg_color = column.neg_color;
            } else if (column.number_fg_mode !== undefined) {
                column.neg_fg_color = column.neg_color;
            }

            delete column["neg_color"];
            if (options.warn) {
                console.warn(
                    `Deprecated perspective attribute "neg_color" renamed "neg_bg_color"`
                );
            }
        }
    }

    return old;
}

/**
 * Migrate attributes which were once persisted but are now considered errors
 * in `<perspective-viewer>` and should only be set in HTML
 * @param old
 * @param options
 * @returns
 */
function migrate_attributes_viewer(old, options) {
    const ATTRIBUTES = [
        "editable",
        "selectable",
        "name",
        "table",
        "master",
        "linked",
    ];
    for (const attr of ATTRIBUTES) {
        if (attr in old) {
            delete old[attr];

            if (options.warn) {
                console.warn(
                    `Deprecated perspective attribute "${attr}" removed`
                );
            }
        }
    }

    return old;
}

/**
 * Migrate attributes which were once persisted but are now considered errors
 * in `<perspective-workspace>` and should only be set in HTML
 * @param old
 * @param options
 * @returns
 */
function migrate_attributes_workspace(old, options) {
    const ATTRIBUTES = [
        "editable",
        "selectable",
        "name",
        "table",
        "master",
        "linked",
    ];
    for (const attr of ATTRIBUTES) {
        if (attr in old && old[attr] === null) {
            delete old[attr];

            if (options.warn) {
                console.warn(
                    `Deprecated perspective attribute "${attr}" removed`
                );
            }
        }
    }

    return old;
}

/**
 * Migrate workspace viewer 'name' which was unified with `title`.
 * @param old
 * @param options
 * @returns
 */
function migrate_name_title_workspace(old, options) {
    if ("name" in old) {
        if ("title" in old && old.title !== undefined) {
            old.title = old["name"];
            if (options.warn) {
                console.warn(`"name" conflicts with "title"`);
            }
        }

        delete old["name"];

        if (options.warn) {
            console.warn(`"name" unified with "title"`);
        }
    }

    return old;
}
