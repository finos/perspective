/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {get_type_config} from "@finos/perspective/dist/esm/config";
import {METADATA_MAP} from "./constants";
import {memoize} from "./utils";

function _tree_header(td, path, is_leaf, is_open) {
    let name;
    if (path.length > 0) {
        name = path[path.length - 1];
    } else {
        name = "TOTAL";
    }
    if (is_leaf) {
        let html = "";
        for (let i = 0; i < path.length; i++) {
            html += `<span class="pd-tree-group"></span>`;
        }
        td.innerHTML = `<div style="display:flex;align-items:stretch">${html}<span class="pd-group-name pd-group-leaf">${name}</span></div>`;
    } else {
        const icon = is_open ? "remove" : "add";
        let html = "";
        for (let i = 0; i < path.length; i++) {
            html += `<span class="pd-tree-group"></span>`;
        }
        td.innerHTML = `<div style="display:flex;align-items:stretch">${html}<span class="pd-row-header-icon">${icon}</span><span class="pd-group-name">${name}</span></div>`;
    }
    td.classList.add("pd-group-header");
}

/******************************************************************************
 *
 * View Model
 *
 */

export class ViewModel {
    constructor(column_sizes, container, table) {
        this._column_sizes = column_sizes;
        this._container = container;
        this.table = table;
        this.cells = [];
        this.rows = [];
    }

    num_rows() {
        return this.cells.length;
    }

    _get_or_create_metadata(td) {
        if (METADATA_MAP.has(td)) {
            return METADATA_MAP.get(td);
        } else {
            const metadata = {};
            METADATA_MAP.set(td, metadata);
            return metadata;
        }
    }

    @memoize
    _format(type) {
        const config = get_type_config(type);
        const real_type = config.type || type;
        const format_function = {
            float: Intl.NumberFormat,
            integer: Intl.NumberFormat,
            datetime: Intl.DateTimeFormat,
            date: Intl.DateTimeFormat
        }[real_type];
        if (format_function) {
            const func = new format_function("en-us", config.format);
            return {
                format(td, path) {
                    td.textContent = func.format(path);
                    if (real_type === "integer" || real_type === "float") {
                        if (path > 0) {
                            td.classList.add("pd-positive");
                        } else if (path < 0) {
                            td.classList.add("pd-negative");
                        }
                    }
                }
            };
        } else if (type === undefined) {
            return {format: _tree_header};
        }
    }

    _get_cell(tag = "td", row_container, cidx, tr) {
        let td = row_container[cidx];
        if (!td) {
            td = row_container[cidx] = document.createElement(tag);
            tr.appendChild(td);
        }
        return td;
    }

    _get_row(ridx) {
        let tr = this.rows[ridx];
        if (!tr) {
            tr = this.rows[ridx] = document.createElement("tr");
            this.table.appendChild(tr);
        }

        let row_container = this.cells[ridx];
        if (!row_container) {
            row_container = this.cells[ridx] = [];
        }

        return {tr, row_container};
    }

    _clean_columns(cidx) {
        for (let i = 0; i < this.rows.length; i++) {
            const tr = this.rows[i];
            const row_container = this.cells[i];
            let idx = cidx[i] || cidx;
            while (tr.children[idx]) {
                tr.removeChild(tr.children[idx]);
            }
            this.cells[i] = row_container.slice(0, idx);
        }
    }

    _clean_rows(ridx) {
        while (this.table.children[ridx]) {
            this.table.removeChild(this.table.children[ridx]);
        }
        this.rows = this.rows.slice(0, ridx);
        this.cells = this.cells.slice(0, ridx);
    }
}
