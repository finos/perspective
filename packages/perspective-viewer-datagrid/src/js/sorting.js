/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export async function configureSortable(table, viewer) {
    table.addEventListener("regular-table-psp-sort", (event) => {
        this._preserve_focus_state = true;
        viewer.restore({sort: event.detail.sort});
    });
}

export async function sortHandler(regularTable, event, target) {
    const meta = regularTable.getMeta(target);
    const column_name = meta.column_header[meta.column_header.length - 1];
    const sort_method = event.shiftKey ? append_sort : override_sort;
    const sort = sort_method.call(this, column_name);
    regularTable.dispatchEvent(
        new CustomEvent("regular-table-psp-sort", {detail: {sort}})
    );
}

export function append_sort(column_name) {
    const sort = [];
    let found = false;
    for (const sort_term of this._config.sort) {
        const [_column_name, _sort_dir] = sort_term;
        if (_column_name === column_name) {
            found = true;
            const term = create_sort.call(this, column_name, _sort_dir);
            if (term) {
                sort.push(term);
            }
        } else {
            sort.push(sort_term);
        }
    }
    if (!found) {
        sort.push([column_name, "desc"]);
    }
    return sort;
}

export function override_sort(column_name) {
    for (const [_column_name, _sort_dir] of this._config.sort) {
        if (_column_name === column_name) {
            const sort = create_sort.call(this, column_name, _sort_dir);
            return sort ? [sort] : [];
        }
    }
    return [[column_name, "desc"]];
}

export function create_sort(column_name, sort_dir) {
    const is_col_sortable = this._config.split_by.length > 0;
    const order = is_col_sortable ? ROW_COL_SORT_ORDER : ROW_SORT_ORDER;
    const inc_sort_dir = sort_dir ? order[sort_dir] : "desc";
    if (inc_sort_dir) {
        return [column_name, inc_sort_dir];
    }
}

const ROW_SORT_ORDER = {desc: "asc", asc: undefined};
const ROW_COL_SORT_ORDER = {
    desc: "asc",
    asc: "col desc",
    "col desc": "col asc",
    "col asc": undefined,
};
