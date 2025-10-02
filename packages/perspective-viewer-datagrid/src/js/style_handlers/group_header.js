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

export function group_header_style_listener(regularTable) {
    const header_depth = regularTable._view_cache.config.row_pivots.length - 1;
    let group_header_trs = Array.from(
        regularTable.children[0].children[0].children,
    );

    const m = [];
    let marked = new Set();
    const table = regularTable.children[0];
    for (let y = 0; y < group_header_trs.length; y++) {
        let row = table.rows[y];
        const tops = new Set();
        for (let x = 0; x < row.cells.length; x++) {
            const td = row.cells[x];
            td.style.backgroundColor = "";
            const metadata = regularTable.getMeta(td);
            let needs_border =
                (header_depth > 0 && metadata.row_header_x === header_depth) ||
                metadata.x >= 0;

            td.classList.toggle("psp-align-right", false);
            td.classList.toggle("psp-align-left", false);
            td.classList.toggle("psp-header-group", true);
            td.classList.toggle("psp-header-leaf", false);
            td.classList.toggle("psp-header-border", needs_border);
            td.classList.toggle(
                "psp-header-group-corner",
                typeof metadata.x === "undefined",
            );

            td.classList.toggle("psp-color-mode-bar", false);
            td.classList.toggle("psp-header-sort-asc", false);
            td.classList.toggle("psp-header-sort-desc", false);
            td.classList.toggle("psp-header-sort-col-asc", false);
            td.classList.toggle("psp-header-sort-col-desc", false);
            td.classList.toggle("psp-sort-enabled", false);

            let cell = row.cells[x],
                xx = x,
                tx,
                ty;

            for (; m[y] && m[y][xx]; ++xx);
            tops.add(xx);
            for (tx = xx; tx < xx + cell.colSpan; ++tx) {
                for (ty = y; ty < y + cell.rowSpan; ++ty) {
                    if (!m[ty]) m[ty] = [];
                    m[ty][tx] = true;
                }
            }

            cell.classList.toggle("psp-is-top", y === 0 || !marked.has(tx));
        }
        marked = tops;
    }
}
