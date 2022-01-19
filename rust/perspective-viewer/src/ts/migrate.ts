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
 * import {convert} from "@finos/perspective-viewer/dist/esm/migrate.js`;
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
 */
export function convert(old: unknown): unknown {
    if (typeof old === "object" && !(old instanceof ArrayBuffer)) {
        const copy = JSON.parse(JSON.stringify(old));
        if ("viewers" in copy && "detail" in copy) {
            return migrate_workspace(copy);
        } else {
            return migrate_viewer(copy, false);
        }
    } else {
        return old;
    }
}

export default convert;

function migrate_workspace(old) {
    for (const key in old.viewers) {
        old.viewers[key] = migrate_viewer(old.viewers[key], true);
        if (!("master" in old.viewers[key])) {
            old.viewers[key].master = false;
        }

        if (!("linked" in old.viewers[key])) {
            old.viewers[key].linked = false;
        }
    }

    return old;
}

function migrate_viewer(old, omit_attributes) {
    return chain(
        old,
        [
            migrate_row_pivots,
            migrate_column_pivots,
            migrate_filters,
            migrate_expressions,
            migrate_nulls,
            migrate_plugins,
            migrate_plugin_config,
            omit_attributes
                ? migrate_attributes_workspace
                : migrate_attributes_viewer,
        ].filter((x) => !!x)
    );
}

function chain(old, args) {
    for (const arg of args) {
        old = arg(old);
    }

    return old;
}

function migrate_nulls(old) {
    for (const key of ["row_pivot", "column_pivot", "filter", "sort"]) {
        if (old[key] === null) {
            old[key] = [];
        }

        if ("aggregates" in old && old.aggregates === null) {
            old.aggregates = {};
        }
    }

    return old;
}

function _migrate_field_aliases(original, aliases) {
    return function (old) {
        let count = 0;
        for (const pivot of aliases) {
            if (pivot in old) {
                if (count++ > 0) {
                    throw new Error(`Duplicate "${original}" fields`);
                }

                console.log(`Renaming "${pivot}" to "${original}"`);
                old[original] = old[pivot];
                if (pivot !== original) {
                    delete old[pivot];
                }
            }
        }

        return old;
    };
}

const migrate_row_pivots = _migrate_field_aliases("row_pivots", [
    "row_pivots",
    "row-pivot",
    "row-pivots",
    "row_pivot",
]);

const migrate_column_pivots = _migrate_field_aliases("column_pivots", [
    "column_pivots",
    "column-pivot",
    "column-pivots",
    "column_pivot",
    "col_pivots",
    "col-pivot",
    "col-pivots",
    "col_pivot",
]);

const migrate_filters = _migrate_field_aliases("filter", ["filter", "filters"]);

function _migrate_expression(regex1, rep, expression, old) {
    if (regex1.test(expression)) {
        const replaced = expression.replace(regex1, rep);
        for (const key of ["row_pivots", "column_pivots"]) {
            if (key in old) {
                for (const idx in old[key]) {
                    const pivot = old[key][idx];
                    if (pivot === expression.replace(/"/g, "")) {
                        old[key][idx] = replaced;
                    }
                }
            }
        }

        for (const filter of old.filter || []) {
            if (filter[0] === expression.replace(/"/g, "")) {
                filter[0] = replaced;
            }
        }

        for (const sort of old.sort || []) {
            if (sort[0] === expression.replace(/"/g, "")) {
                sort[0] = replaced;
            }
        }

        return replaced;
    } else {
        return expression;
    }
}

function migrate_expressions(old) {
    if (old["computed-columns"]) {
        if ("expressions" in old) {
            throw new Error(`Duplicate "expressions" and "computed-columns`);
        }

        old.expressions = old["computed-columns"];
        delete old["computed-columns"];

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
                expression = _migrate_expression(a, b, expression, old);
            }

            old.expressions[idx] = expression;
        }
    }

    return old;
}

function migrate_plugins(old) {
    const ALIASES = {
        datagrid: "Datagrid",
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
        Heatmp: "Heatmap",
        d3_treemap: "Treemap",
        Treemap: "Treemap",
        d3_sunburst: "Sunburst",
        Sunburst: "Sunburst",
    };

    if ("plugin" in old) {
        old.plugin = ALIASES[old.plugin];
    }

    return old;
}

function migrate_plugin_config(old) {
    if (old.plugin === "Datagrid" && !!old.plugin_config) {
        for (const name of Object.keys(old.plugin_config)) {
            const column = old.plugin_config[name];
            if (typeof column.color_mode === "string") {
                column.number_color_mode = column.color_mode;
                delete column["color_mode"];
            }
        }
    }

    return old;
}

function migrate_attributes_viewer(old) {
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
        }
    }

    return old;
}

function migrate_attributes_workspace(old) {
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
        }
    }

    return old;
}
