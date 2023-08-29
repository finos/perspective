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

function get_psp_type(metadata) {
    if (metadata.x >= 0) {
        return this._column_types[metadata.x];
    } else {
        return this._row_header_types[metadata.row_header_x - 1];
    }
}

export function column_header_style_listener(regularTable) {
    let group_header_trs = Array.from(
        regularTable.children[0].children[0].children
    );

    if (group_header_trs.length > 0) {
        let [col_headers] = group_header_trs.splice(
            this._config.split_by.length,
            1
        );

        style_column_header_row.call(this, regularTable, col_headers, false);

        let [style_menu_headers] = group_header_trs.splice(
            this._config.split_by.length,
            1
        );

        if (style_menu_headers) {
            style_column_header_row.call(
                this,
                regularTable,
                style_menu_headers,
                true
            );
        }
    }
}

function style_column_header_row(regularTable, col_headers, is_menu_row) {
    const header_depth = regularTable._view_cache.config.row_pivots.length - 1;
    for (const td of col_headers?.children) {
        const metadata = regularTable.getMeta(td);
        const column_name =
            metadata.column_header?.[this._config.split_by.length];
        const sort = this._config.sort.find((x) => x[0] === column_name);
        let needs_border = metadata.row_header_x === header_depth;
        const is_corner = typeof metadata.x === "undefined";
        needs_border =
            needs_border ||
            (metadata.x + 1) % this._config.columns.length === 0;
        td.classList.toggle("psp-header-border", needs_border);
        td.classList.toggle("psp-header-group", false);
        td.classList.toggle("psp-header-leaf", true);
        td.classList.toggle("psp-is-top", false);
        td.classList.toggle("psp-header-corner", is_corner);
        td.classList.toggle(
            "psp-header-sort-asc",
            !is_menu_row && !!sort && sort[1] === "asc"
        );
        td.classList.toggle(
            "psp-header-sort-desc",
            !is_menu_row && !!sort && sort[1] === "desc"
        );
        td.classList.toggle(
            "psp-header-sort-col-asc",
            !is_menu_row && !!sort && sort[1] === "col asc"
        );
        td.classList.toggle(
            "psp-header-sort-col-desc",
            !is_menu_row && !!sort && sort[1] === "col desc"
        );

        let type = get_psp_type.call(this, metadata);
        const is_numeric = type === "integer" || type === "float";
        const is_string = type === "string";
        const is_date = type === "date";
        const is_datetime = type === "datetime";
        td.classList.toggle("psp-align-right", is_numeric);
        td.classList.toggle("psp-align-left", !is_numeric);
        td.classList.toggle(
            "psp-menu-open",
            this._open_column_styles_menu[0] === metadata._virtual_x
        );

        td.classList.toggle(
            "psp-menu-enabled",
            (is_string || is_numeric || is_date || is_datetime) &&
                !is_corner &&
                metadata.column_header_y == this._config.split_by.length + 1
        );

        td.classList.toggle(
            "psp-sort-enabled",
            (is_string || is_numeric || is_date || is_datetime) &&
                !is_corner &&
                metadata.column_header_y === this._config.split_by.length
        );

        td.classList.toggle(
            "psp-is-width-override",
            regularTable._column_sizes?.override[metadata.size_key] !==
                undefined
        );
    }
}
