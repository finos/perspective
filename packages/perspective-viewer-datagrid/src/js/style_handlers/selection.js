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

export function selectionStyleListener(
    regularTable,
    viewer,
    selected_rows_map,
) {
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
            const key_match = selected.reduce(
                (agg, x, i) => agg && x === id[i],
                true,
            );
            td.classList.toggle(
                "psp-row-selected",
                id.length === selected.length && key_match,
            );
            td.classList.toggle(
                "psp-row-subselected",
                id.length !== selected.length && key_match,
            );
        }
    }

    for (const th of regularTable.querySelectorAll("tbody th")) {
        const meta = regularTable.getMeta(th);
        const id = this._ids[meta.y - meta.y0];
        if (!has_selected || !!id[meta.row_header_x]) {
            th.classList.toggle("psp-row-selected", false);
            th.classList.toggle("psp-row-subselected", false);
        } else {
            const key_match = selected.reduce(
                (agg, x, i) => agg && x === id[i],
                true,
            );
            th.classList.toggle(
                "psp-row-selected",
                id.length === selected.length && key_match,
            );
            th.classList.toggle(
                "psp-row-subselected",
                id.length !== selected.length && key_match,
            );
        }
    }
}

//  export function configureRowSelectable(table, viewer) {
//      table.addStyleListener(selectionStyleListener.bind(this, table, viewer));
//      table.addEventListener(
//          "mousedown",
//          selectionListener.bind(this, table, viewer)
//      );
//  }

// export async function deselect(regularTable) {
//     selected_rows_map.delete(regularTable);
//     for (const td of regularTable.querySelectorAll("td,th")) {
//         td.classList.toggle("psp-row-selected", false);
//         td.classList.toggle("psp-row-subselected", false);
//     }
// }
