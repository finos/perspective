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

export default async function getCellConfig(
    { _view, _config },
    row_idx,
    col_idx,
) {
    const group_by = _config.group_by;
    const split_by = _config.split_by;
    const start_row = row_idx >= 0 ? row_idx : 0;
    const end_row = start_row + 1;
    const r = await _view.to_json({ start_row, end_row });
    const row_paths = r.map((x) => x.__ROW_PATH__);
    const group_by_values = row_paths[0] || [];
    const row_filters = group_by
        .map((pivot, index) => {
            const pivot_value = group_by_values[index];
            return pivot_value ? [pivot, "==", pivot_value] : undefined;
        })
        .filter((x) => x);

    const column_index = group_by.length > 0 ? col_idx + 1 : col_idx;
    const column_paths = Object.keys(r[0])[column_index];
    const result = { row: r[0] };
    let column_filters = [];
    if (column_paths) {
        const split_by_values = column_paths.split("|");
        result.column_names = [split_by_values[split_by.length]];
        column_filters = split_by
            .map((pivot, index) => {
                const pivot_value = split_by_values[index];
                return pivot_value ? [pivot, "==", pivot_value] : undefined;
            })
            .filter((x) => x)
            .filter(([, , value]) => value !== "__ROW_PATH__");
    }

    const filter = _config.filter.concat(row_filters).concat(column_filters);
    result.config = { filter };
    return result;
}
