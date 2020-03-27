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

/******************************************************************************
 *
 * Utilities
 *
 */

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
        const cidx = offset_cache[d];
        offset_cache[d] += 1;
        th.className = "";
        th.removeAttribute("colspan");
        th.style.minWidth = "0";
        const metadata = this._get_or_create_metadata(th);
        metadata.cidx = cidx;

        if (sort_dir?.length === 0) {
            th.innerHTML = "<span>" + column + `</span><span class="pd-column-resize"></span>`;
        } else {
            const sort_txt = sort_dir?.map(x => ICON_MAP[x]);
            th.innerHTML = "<span>" + column + `</span><span class="pd-column-header-icon">${sort_txt}</span><span class="pd-column-resize"></span>`;
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
        metadata.size_key = `${column}|${type}`;
        th.className = "";
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
            th.style.maxWidth = "none";
            th.style.minWidth = auto_width + "px";
        }
    }

    draw(config, alias, column, type, sort, {group_header_cache = [], offset_cache = []} = {}) {
        const header_levels = config.column_pivots.length + 1;
        let parts = column.split?.("|");
        let th,
            column_name,
            is_new_group = false;
        for (let d = 0; d < header_levels; d++) {
            column_name = parts[d] ? parts[d] : "";
            group_header_cache[d] = group_header_cache[d] || [];
            offset_cache[d] = offset_cache[d] || 0;
            if (d < header_levels - 1) {
                if (group_header_cache[d][0] === column_name) {
                    th = group_header_cache[d][1];
                    th.setAttribute("colspan", (parseInt(th.getAttribute("colspan")) || 1) + 1);
                } else {
                    th = this._draw_group_th(offset_cache, d, column_name, []);
                    this._draw_group(column, column_name, type, th);
                    group_header_cache[d] = [column_name, th];
                    is_new_group = true;
                }
            } else {
                if (is_new_group) {
                    this._redraw_previous(offset_cache, d);
                }
                const sort_dir = sort?.filter(x => x[0] === column_name).map(x => x[1]);
                th = this._draw_group_th(offset_cache, d, column_name, sort_dir);
                this._draw_th(alias || column, column_name, type, th);
            }
        }

        if (header_levels === 1 && type === undefined) {
            th.classList.add("pd-group-header");
        }
        const metadata = this._get_or_create_metadata(th);
        this._clean_rows(offset_cache.length);
        return {group_header_cache, offset_cache, th, metadata};
    }

    clean({offset_cache}) {
        this._clean_columns(offset_cache);
    }
}
