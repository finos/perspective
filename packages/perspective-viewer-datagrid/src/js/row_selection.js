/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import getCellConfig from "./getCellConfig";
const selected_rows_map = new WeakMap();

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
        const key_match =
            !!selected &&
            selected.reduce((agg, x, i) => agg && x === id[i], true);
        const is_deselect =
            !!selected && id.length === selected.length && key_match;
        let filter = [];
        if (is_deselect) {
            selected_rows_map.delete(regularTable);
        } else {
            selected_rows_map.set(regularTable, id);
            filter = await getCellConfig(this, meta.y, meta.x);
            filter = filter.config.filter;
        }

        await regularTable.draw({preserve_width: true});
        event.handled = true;
        viewer.dispatchEvent(
            new CustomEvent("perspective-select", {
                bubbles: true,
                composed: true,
                detail: {
                    selected: !is_deselect,
                    config: {filter},
                },
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
            const key_match = selected.reduce(
                (agg, x, i) => agg && x === id[i],
                true
            );
            td.classList.toggle(
                "psp-row-selected",
                id.length === selected.length && key_match
            );
            td.classList.toggle(
                "psp-row-subselected",
                id.length !== selected.length && key_match
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
                true
            );
            th.classList.toggle(
                "psp-row-selected",
                id.length === selected.length && key_match
            );
            th.classList.toggle(
                "psp-row-subselected",
                id.length !== selected.length && key_match
            );
        }
    }
}

export function configureRowSelectable(table, viewer) {
    table.addStyleListener(selectionStyleListener.bind(this, table, viewer));
    table.addEventListener(
        "mousedown",
        selectionListener.bind(this, table, viewer)
    );
}

export async function deselect(regularTable) {
    selected_rows_map.delete(regularTable);
    for (const td of regularTable.querySelectorAll("td,th")) {
        td.classList.toggle("psp-row-selected", false);
        td.classList.toggle("psp-row-subselected", false);
    }
}
