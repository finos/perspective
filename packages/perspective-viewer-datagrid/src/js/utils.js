/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {DEBUG} from "./constants";

/******************************************************************************
 *
 * Events
 *
 */

export async function getCellConfig({view, config}, row_idx, col_idx) {
    const row_pivots = config.row_pivots;
    const column_pivots = config.column_pivots;
    const start_row = row_idx >= 0 ? row_idx : 0;
    const end_row = start_row + 1;
    const r = await view.to_json({start_row, end_row});
    const row_paths = r.map(x => x.__ROW_PATH__);
    const row_pivots_values = row_paths[0] || [];
    const row_filters = row_pivots
        .map((pivot, index) => {
            const pivot_value = row_pivots_values[index];
            return pivot_value ? [pivot, "==", pivot_value] : undefined;
        })
        .filter(x => x);
    const column_index = row_pivots.length > 0 ? col_idx + 1 : col_idx;
    const column_paths = Object.keys(r[0])[column_index];
    const result = {row: r[0]};
    let column_filters = [];
    if (column_paths) {
        const column_pivot_values = column_paths.split("|");
        result.column_names = [column_pivot_values[column_pivot_values.length - 1]];
        column_filters = column_pivots
            .map((pivot, index) => {
                const pivot_value = column_pivot_values[index];
                return pivot_value ? [pivot, "==", pivot_value] : undefined;
            })
            .filter(x => x)
            .filter(([, , value]) => value !== "__ROW_PATH__");
    }

    const filters = config.filter.concat(row_filters).concat(column_filters);
    result.config = {filters};
    return result;
}

/******************************************************************************
 *
 * Profling
 *
 */

let LOG = [];

function log_fps() {
    const avg = LOG.reduce((x, y) => x + y, 0) / LOG.length;
    const rfps = LOG.length / 5;
    const vfps = 1000 / avg;
    const nframes = LOG.length;
    console.log(`${avg.toFixed(2)} ms/frame   ${rfps} rfps   ${vfps.toFixed(2)} vfps   (${nframes} frames in 5s)`);
    LOG = [];
}

export function log_perf(x) {
    LOG.push(x);
}

export function _start_profiling_loop() {
    if (DEBUG) {
        setInterval(log_fps, 5000);
    }
}

/******************************************************************************
 *
 * Utils
 *
 */

/**
 * A class method decorate for memoizing method results.  Only works on one
 * arg.
 */
export function memoize(_target, _property, descriptor) {
    const cache = new Map();
    const func = descriptor.value;
    descriptor.value = new_func;
    return descriptor;
    function new_func(arg) {
        if (cache.has(arg)) {
            return cache.get(arg);
        } else {
            const res = func.call(this, arg);
            cache.set(arg, res);
            return res;
        }
    }
}

export function column_path_2_type(schema, column) {
    let parts = column.split("|");
    return schema[parts[parts.length - 1]];
}

/**
 * Identical to a non-tagger template literal, this is only used to indicate to
 * babel that this string should be HTML-minified on production builds.
 */
export const html = (strings, ...args) =>
    strings
        .map((str, i) => [str, args[i]])
        .flat()
        .filter(a => !!a)
        .join("");
