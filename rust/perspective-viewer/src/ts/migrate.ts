/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * A migration utility for `@finos/perspective-viewer` and
 * `@finos/perspective-workspace` persisted state objects.  If you have an
 * application which persists tokens returned by the `.save()` method of a
 * Perspective Custom Element, and you want to upgrade Perspective to the latest
 * version, this module is for you!  You know who you are!
 *
 * Say you have a `<perspective-viewer>` Custom Element from
 * `@finos/perspective-viewer>=0.8.3`, and have persisted an arbitrary persistence
 * token object:
 *
 * ```javascript
 * const old_elem = document.querySelector("perspective-viewer");
 * const old_token = await old_elem.save();
 * ```
 *
 * To migrate this token to the version of `@finos/perspective-migrate` itself:
 *
 * ```javascript
 * import {convert} from "@finos/perspective-viewer`;
 *
 * // ...
 *
 * const new_elem = document.querySelector("perspective-viewer");
 * const new_token = convert(old_token);
 * await new_elem.restore(new_token);
 * ```
 *
 * `convert` can also be imported in node for converting persisted tokens
 * outside the browser.
 *
 * ```javascript
 * const {convert} = require("@finos/perspective-viewer/dist/cjs/migrate.js");
 * ```
 * @param old the layout to convert, in `<perspective-viewer>` or
 * `<perspective-workspace>` format.
 * @param options a `PerspectiveConvertOptions` object specifying the convert
 * options for this call.
 * @returns a layout for either `<perspective-viewer>` or
 * `<perspective-workspace>`, updated to the perspective version of this
 * script's package.
 */
export function convert(
    old: Record<string, unknown> | ArrayBuffer | string,
    {warn = true, replace_defaults = false}: PerspectiveConvertOptions = {}
): Record<string, unknown> | ArrayBuffer | string {
    if (typeof old === "object" && !(old instanceof ArrayBuffer)) {
        const copy = JSON.parse(JSON.stringify(old));
        if ("viewers" in copy && "detail" in copy) {
            return migrate_workspace(copy, {warn, replace_defaults});
        } else {
            return migrate_viewer(copy, false, {warn, replace_defaults});
        }
    } else {
        return old;
    }
}

type PerspectiveConvertOptions = {
    warn?: boolean;
    replace_defaults?: boolean;
};

/**
 * Migrate a layout for `<perspective-workspace>`
 * @param old
 * @param options
 * @returns
 */
function migrate_workspace(old, options) {
    for (const key in old.viewers) {
        old.viewers[key] = migrate_viewer(old.viewers[key], true, options);
        if (!("master" in old.viewers[key])) {
            old.viewers[key].master = false;
            if (options.warn) {
                console.warn(
                    `Deprecated perspective missing attribute "master" set to default`
                );
            }
        }

        if (!("linked" in old.viewers[key])) {
            old.viewers[key].linked = false;
            if (options.warn) {
                console.warn(
                    `Deprecated perspective missing attribute "linked" set to default`
                );
            }
        }
    }

    return old;
}

/**
 * Migrate a layout for `<perspective-viewer>`
 * @param old
 * @param options
 * @returns
 */
function migrate_viewer(old, omit_attributes, options) {
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
            omit_attributes
                ? migrate_attributes_workspace
                : migrate_attributes_viewer,
        ].filter((x) => !!x),
        options
    );
}

/**
 * Chains functions of `args` and apply to `old`
 * @param old
 * @param args
 * @param options
 * @returns
 */
function chain(old, args, options) {
    for (const arg of args) {
        old = arg(old, options);
    }

    return old;
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
    if (old.plugin === "Datagrid" && !!old.plugin_config) {
        for (const name of Object.keys(old.plugin_config)) {
            const column = old.plugin_config[name];
            if (typeof column.color_mode === "string") {
                column.number_color_mode = column.color_mode;
                delete column["color_mode"];

                if (options.warn) {
                    console.warn(
                        `Deprecated perspective attribute "color_mode" renamed "number_color_mode"`
                    );
                }
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
