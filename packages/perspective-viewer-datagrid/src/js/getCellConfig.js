/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export default async function getCellConfig(
    {_view, _config},
    row_idx,
    col_idx
) {
    const row_pivots = _config.row_pivots;
    const column_pivots = _config.column_pivots;
    const start_row = row_idx >= 0 ? row_idx : 0;
    const end_row = start_row + 1;
    const r = await _view.to_json({start_row, end_row});
    const row_paths = r.map((x) => x.__ROW_PATH__);
    const row_pivots_values = row_paths[0] || [];
    const row_filters = row_pivots
        .map((pivot, index) => {
            const pivot_value = row_pivots_values[index];
            return pivot_value ? [pivot, "==", pivot_value] : undefined;
        })
        .filter((x) => x);

    const column_index = row_pivots.length > 0 ? col_idx + 1 : col_idx;
    const column_paths = Object.keys(r[0])[column_index];
    const result = {row: r[0]};
    let column_filters = [];
    if (column_paths) {
        const column_pivot_values = column_paths.split("|");
        result.column_names = [
            column_pivot_values[column_pivot_values.length - 1],
        ];
        column_filters = column_pivots
            .map((pivot, index) => {
                const pivot_value = column_pivot_values[index];
                return pivot_value ? [pivot, "==", pivot_value] : undefined;
            })
            .filter((x) => x)
            .filter(([, , value]) => value !== "__ROW_PATH__");
    }

    const filters = _config.filter.concat(row_filters).concat(column_filters);
    result.config = {filters};
    return result;
}
