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
import {tree_header} from "./tree_row_header";

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

    _set_metadata(td, metadata) {
        METADATA_MAP.set(td, metadata);
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
    _format_text(type) {
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
            return path => func.format(path);
        } else {
            return path => path;
        }
    }

    @memoize
    _format_class(type) {
        const config = get_type_config(type);
        const real_type = config.type || type;
        if (real_type === "integer" || real_type === "float") {
            return path => {
                if (path > 0) {
                    return "pd-positive";
                } else if (path < 0) {
                    return "pd-negative";
                }
            };
        } else {
            return () => "";
        }
    }

    @memoize
    _format(type) {
        if (Array.isArray(type)) {
            return {format: tree_header.bind(this)};
        }
        const fmt = this._format_text(type);
        const cls = this._format_class(type);
        return {
            format(td, path) {
                td.textContent = fmt(path);
                const c = cls(path);
                if (c) {
                    td.classList.add(c);
                }
            }
        };
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
