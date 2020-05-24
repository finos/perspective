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

/**
 * <tbody> view model.
 *
 * @class DatagridBodyViewModel
 */
export class DatagridBodyViewModel extends ViewModel {
    _draw_td(ridx, val, id, is_open, {cidx, column_name, type, first_col}, {selected_id, depth, ridx_offset, cidx_offset}) {
        const {tr, row_container} = this._get_row(ridx);

        const td = this._get_cell("td", row_container, cidx, tr);
        td.className = `pd-${type}`;
        if (first_col && selected_id !== undefined) {
            const is_selected = isEqual(id, selected_id);
            const is_sub_selected = !is_selected && isEqual(id?.slice(0, selected_id?.length), selected_id);
            tr.classList.toggle("pd-selected", !!id && is_selected);
            tr.classList.toggle("pd-sub-selected", !!id && is_sub_selected);
        }

        const metadata = this._get_or_create_metadata(td);
        metadata.id = id;
        metadata.cidx = cidx + cidx_offset;
        metadata.type = type;
        metadata.column = column_name;
        metadata.size_key = `${column_name}|${type}`;
        metadata.ridx = ridx + ridx_offset;
        const override_width = this._column_sizes.override[metadata.size_key];
        if (override_width) {
            const auto_width = this._column_sizes.auto[metadata.size_key];
            td.classList.toggle("pd-cell-clip", auto_width > override_width);
            td.style.minWidth = override_width + "px";
            td.style.maxWidth = override_width + "px";
        } else {
            td.classList.remove("pd-cell-clip");
            td.style.minWidth = "";
            td.style.maxWidth = "";
        }
        const formatter = this._format(type);
        if (val === undefined || val === null) {
            td.textContent = "-";
            metadata.value = null;
            metadata.row_path = null;
        } else if (formatter) {
            formatter.format(td, val, type, val.length === depth, is_open);
            metadata.value = Array.isArray(val) ? val[val.length - 1] : val;
            metadata.row_path = id;
            metadata.is_open = is_open;
        } else {
            td.textContent = val;
            metadata.value = val;
        }

        return {td, metadata};
    }

    draw(container_height, column_state, view_state) {
        const {cidx, column_data, id_column} = column_state;
        let {row_height} = view_state;
        let ridx = 0;
        let td, metadata;
        for (const val of column_data) {
            const next = column_data[ridx + 1];
            const id = id_column?.[ridx];
            const obj = this._draw_td(ridx++, val, id, next?.length > val?.length, column_state, view_state);
            td = obj.td;
            metadata = obj.metadata;
            row_height = row_height || td.offsetHeight;
            if (ridx * row_height > container_height) {
                break;
            }
        }
        this._clean_rows(ridx);
        return {td, cidx, ridx, metadata, row_height};
    }

    clean({ridx, cidx}) {
        this._clean_rows(ridx);
        this._clean_columns(cidx);
    }
}
