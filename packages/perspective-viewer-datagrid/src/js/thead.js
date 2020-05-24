/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {ViewModel} from "./view_model";
import {ICON_MAP} from "./constants";
import {html} from "./utils.js";

/**
 * <thead> view model.  This model accumulates state in the form of
 * column_sizes, which leverages <tables> autosize behavior across
 * virtual pages.
 *
 * @class DatagridHeaderViewModel
 */
export class DatagridHeaderViewModel extends ViewModel {
    _draw_group_th(offset_cache, d, column, sort_dir) {
        const {tr, row_container} = this._get_row(d);
        const th = this._get_cell("th", row_container, offset_cache[d], tr);
        offset_cache[d] += 1;
        th.className = "";
        th.removeAttribute("colspan");
        th.style.minWidth = "0";
        if (sort_dir?.length === 0) {
            th.innerHTML = html`
                <span>${column}</span>
                <span class="pd-column-resize"></span>
            `;
        } else {
            const sort_txt = sort_dir
                ?.map(x => {
                    const icon = ICON_MAP[x];
                    return html`
                        <span class="pd-column-header-icon">${icon}</span>
                    `;
                })
                .join("");
            th.innerHTML = html`
                <span>${column}</span>
                ${sort_txt}
                <span class="pd-column-resize"></span>
            `;
        }

        return th;
    }

    _redraw_previous(offset_cache, d) {
        const {tr, row_container} = this._get_row(d);
        const cidx = offset_cache[d] - 1;
        if (cidx < 0) {
            return;
        }
        const th = this._get_cell("th", row_container, cidx, tr);
        if (!th) return;
        th.classList.add("pd-group-header");
        return th;
    }

    _draw_group(column, column_name, type, th) {
        const metadata = this._get_or_create_metadata(th);
        metadata.column_path = column;
        metadata.column_name = column_name;
        metadata.column_type = type;
        metadata.is_column_header = false;
        th.className = "";
        return metadata;
    }

    _draw_th(column, column_name, type, th) {
        const metadata = this._get_or_create_metadata(th);
        metadata.column_path = column;
        metadata.column_name = column_name;
        metadata.column_type = type;
        metadata.is_column_header = true;
        metadata.size_key = `${column}|${type}`;
        const auto_width = this._column_sizes.auto[metadata.size_key];
        const override_width = this._column_sizes.override[metadata.size_key];
        th.classList.add(`pd-${type}`);
        if (override_width) {
            th.classList.toggle("pd-cell-clip", auto_width > override_width);
            th.style.minWidth = override_width + "px";
            th.style.maxWidth = override_width + "px";
        } else if (auto_width) {
            th.classList.remove("pd-cell-clip");
            th.style.maxWidth = "";
            th.style.minWidth = auto_width + "px";
        }
        return metadata;
    }

    get_column_header(cidx) {
        const {tr, row_container} = this._get_row(this.rows.length - 1);
        return this._get_cell("th", row_container, cidx, tr);
    }

    _group_header_cache = [];
    _offset_cache = [];

    draw(config, alias, column_path, type, cidx) {
        const header_levels = config.column_pivots.length + 1;
        let parts = column_path.split?.("|");
        let th,
            column_name,
            is_new_group = false;
        for (let d = 0; d < header_levels; d++) {
            column_name = parts[d] ? parts[d] : "";
            this._offset_cache[d] = this._offset_cache[d] || 0;
            if (d < header_levels - 1) {
                if (this._group_header_cache?.[d]?.[0]?.column_name === column_name) {
                    th = this._group_header_cache[d][1];
                    this._group_header_cache[d][2] += 1;
                    th.setAttribute("colspan", this._group_header_cache[d][2]);
                } else {
                    th = this._draw_group_th(this._offset_cache, d, column_name, []);
                    const metadata = this._draw_group(column_path, column_name, type, th);
                    this._group_header_cache[d] = [metadata, th, 1];
                    is_new_group = true;
                }
            } else {
                if (is_new_group) {
                    this._redraw_previous(this._offset_cache, d);
                }
                const vcidx = this._offset_cache[d];
                const sort_dir = config.sort?.filter(x => x[0] === column_name).map(x => x[1]);
                th = this._draw_group_th(this._offset_cache, d, column_name, sort_dir);

                // Update the group header's metadata such that each group
                // header has the same metadata coordinates of its rightmost
                // column.
                const metadata = this._draw_th(alias || column_path, column_name, type, th);
                metadata.vcidx = vcidx;
                metadata.cidx = cidx;
                for (const [group_meta] of this._group_header_cache) {
                    group_meta.cidx = cidx;
                    group_meta.vcidx = vcidx;
                    group_meta.size_key = metadata.size_key;
                }
            }
        }

        if (header_levels === 1 && Array.isArray(type)) {
            th.classList.add("pd-group-header");
        }
        const metadata = this._get_or_create_metadata(th);
        this._clean_rows(this._offset_cache.length);
        return {th, metadata};
    }

    clean() {
        this._clean_columns(this._offset_cache);
        this._offset_cache = [];
        this._group_header_cache = [];
    }
}
