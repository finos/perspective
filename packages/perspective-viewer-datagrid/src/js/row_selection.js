/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const selected_rows_map = new WeakMap();

async function getCellConfig({_view, _config}, row_idx, col_idx) {
    const row_pivots = _config.row_pivots;
    const column_pivots = _config.column_pivots;
    const start_row = row_idx >= 0 ? row_idx : 0;
    const end_row = start_row + 1;
    const r = await _view.to_json({start_row, end_row});
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

    const filters = _config.filter.concat(row_filters).concat(column_filters);
    result.config = {filters};
    return result;
}

async function selectionListener(regularTable, viewer, event) {
    const meta = regularTable.getMeta(event.target);
    if (!viewer.hasAttribute("selectable")) return;
    if (event.handled) return;
    if (event.which !== 1) {
        return;
    }

    if (!meta) {
        return;
    }

    const id = this._ids[meta.y - meta.y0];
    if (meta && meta.y >= 0) {
        const selected = selected_rows_map.get(regularTable);
        const key_match = !!selected && selected.reduce((agg, x, i) => agg && x === id[i], true);
        const is_deselect = !!selected && id.length === selected.length && key_match;
        let filters = [];
        if (is_deselect) {
            selected_rows_map.delete(regularTable);
        } else {
            selected_rows_map.set(regularTable, id);
            filters = await getCellConfig(this, meta.y, meta.x);
            filters = filters.config.filters;
        }

        await regularTable.draw();
        event.handled = true;
        viewer.dispatchEvent(
            new CustomEvent("perspective-select", {
                bubbles: true,
                composed: true,
                detail: {
                    selected: !is_deselect,
                    config: {filters}
                }
            })
        );
    }
}

function selectionStyleListener(regularTable, viewer) {
    if (!viewer.hasAttribute("selectable")) return;
    const has_selected = selected_rows_map.has(regularTable);
    const selected = selected_rows_map.get(regularTable);
    for (const td of regularTable.querySelectorAll("td")) {
        if (!has_selected) {
            td.classList.toggle("psp-row-selected", false);
            td.classList.toggle("psp-row-subselected", false);
        } else {
            const meta = regularTable.getMeta(td);
            const id = this._ids[meta.y - meta.y0];
            const key_match = selected.reduce((agg, x, i) => agg && x === id[i], true);
            td.classList.toggle("psp-row-selected", id.length === selected.length && key_match);
            td.classList.toggle("psp-row-subselected", id.length !== selected.length && key_match);
        }
    }

    for (const th of regularTable.querySelectorAll("tbody th")) {
        const meta = regularTable.getMeta(th);
        const id = this._ids[meta.y - meta.y0];
        if (!has_selected || !!id[meta.row_header_x]) {
            th.classList.toggle("psp-row-selected", false);
            th.classList.toggle("psp-row-subselected", false);
        } else {
            const key_match = selected.reduce((agg, x, i) => agg && x === id[i], true);
            th.classList.toggle("psp-row-selected", id.length === selected.length && key_match);
            th.classList.toggle("psp-row-subselected", id.length !== selected.length && key_match);
        }
    }
}

export function configureRowSelectable(table, viewer) {
    table.addStyleListener(selectionStyleListener.bind(this, table, viewer));
    table.addEventListener("mousedown", selectionListener.bind(this, table, viewer));
}

export async function deselect(regularTable) {
    selected_rows_map.delete(regularTable);
    for (const td of regularTable.querySelectorAll("td,th")) {
        td.classList.toggle("psp-row-selected", false);
        td.classList.toggle("psp-row-subselected", false);
    }
}
