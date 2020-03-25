/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import isEqual from "lodash/isEqual";
import {ViewModel} from "./view_model";
import {ROW_HEIGHT} from "./constants";

/**
 * <tbody> view model.
 *
 * @class DatagridBodyViewModel
 */
export class DatagridBodyViewModel extends ViewModel {
    _draw_td(ridx, cidx, column, val, id, selected_id, type, depth, is_open, ridx_offset, cidx_offset) {
        const {tr, row_container} = this._get_row(ridx);
        if (selected_id !== false) {
            const is_selected = isEqual(id, selected_id);
            const is_sub_selected = !is_selected && isEqual(id?.slice(0, selected_id?.length), selected_id);
            tr.classList.toggle("pd-selected", !!id && is_selected);
            tr.classList.toggle("pd-sub-selected", !!id && is_sub_selected);
        }
        const td = this._get_cell("td", row_container, cidx, tr);
        const metadata = this._get_or_create_metadata(td);
        metadata.id = id;
        metadata.cidx = cidx + cidx_offset;
        if (metadata.value !== val || metadata.type !== type) {
            td.className = type;
            metadata.column = column;
            metadata.size_key = `${column}|${type}`;
            const override_width = this._column_sizes.override[metadata.size_key];
            if (override_width) {
                const auto_width = this._column_sizes.auto[metadata.size_key];
                td.classList.toggle("pd-cell-clip", auto_width > override_width);
                td.style.minWidth = override_width + "px";
                td.style.maxWidth = override_width + "px";
            } else {
                td.classList.remove("pd-cell-clip");

                td.style.minWidth = "0";
                td.style.maxWidth = "none";
            }
            const formatter = this._format(type);
            if (val === undefined || val === null) {
                td.textContent = "-";
                metadata.value = null;
                metadata.row_path = null;
                metadata.ridx = ridx + ridx_offset;
            } else if (formatter) {
                formatter.format(td, val, val.length === depth, is_open);
                metadata.value = Array.isArray(val) ? val[val.length - 1] : val;
                metadata.row_path = val;
                metadata.ridx = ridx + ridx_offset;
                metadata.is_open = is_open;
            } else {
                td.textContent = val;
                metadata.value = val;
                metadata.ridx = ridx + ridx_offset;
            }
        }

        return {td, metadata};
    }

    draw(container_height, column_name, cidx, column_data, id_column, selected_id, type, depth, ridx_offset, cidx_offset) {
        let ridx = 0;
        let td, metadata;
        for (const val of column_data) {
            const next = column_data[ridx + 1];
            const id = id_column?.[ridx];
            const obj = this._draw_td(ridx++, cidx, column_name, val, id, selected_id, type, depth, next?.length > val?.length, ridx_offset, cidx_offset);
            td = obj.td;
            metadata = obj.metadata;

            if (ridx * ROW_HEIGHT > container_height) {
                break;
            }
        }
        this._clean_rows(ridx);
        return {td, cidx, ridx, metadata};
    }

    clean({ridx, cidx}) {
        this._clean_rows(ridx);
        this._clean_columns(cidx);
    }
}
