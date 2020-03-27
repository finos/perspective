/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {DatagridHeaderViewModel} from "./thead";
import {DatagridBodyViewModel} from "./tbody";
import {column_path_2_type} from "./utils";

/**
 * <table> view model.  In order to handle unknown column width when `draw()`
 * is called, this model will iteratively fetch more data to fill in columns
 * until the page is complete, and makes some column viewport estimations
 * when this information is not availble.
 *
 * @class DatagridTableViewModel
 */
export class DatagridTableViewModel {
    constructor(table_clip, column_sizes) {
        const table = document.createElement("table");
        table.setAttribute("cellspacing", 0);

        const thead = document.createElement("thead");
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        table.appendChild(tbody);

        this.table = table;
        this._column_sizes = column_sizes;
        this.header = new DatagridHeaderViewModel(column_sizes, table_clip, thead);
        this.body = new DatagridBodyViewModel(column_sizes, table_clip, tbody);
        this.fragment = document.createDocumentFragment();
    }

    num_columns() {
        return this.header._get_row(Math.max(0, this.header.rows?.length - 1 || 0)).row_container.length;
    }

    /**
     * Calculate amendments to auto size from this render pass.
     *
     * Disable autosizing when column pivots are applied but the entire column
     * group is not visible, as this can lead to columns sized to their group
     * header's min size.
     *
     * @param {*} last_cells
     * @param {*} {columns, column_pivots}
     * @memberof DatagridTableViewModel
     */
    _autosize_columns(last_cells, {columns}) {
        let is_column_group_visible = false;
        while (last_cells.length > 0) {
            const [cell, metadata] = last_cells.shift();
            const offsetWidth = cell.offsetWidth;
            this._column_sizes.indices[metadata.cidx] = offsetWidth;
            const col_offset = (metadata.cidx - 1) % columns.length;
            if (col_offset === 0) {
                if (last_cells.length < columns.length) {
                    is_column_group_visible = false;
                } else {
                    is_column_group_visible = true;
                }
            }
            const is_override = this._column_sizes.override.hasOwnProperty(metadata.size_key);
            if ((is_column_group_visible || metadata.cidx === 0) && offsetWidth && !is_override) {
                this._column_sizes.auto[metadata.size_key] = offsetWidth;
            }
        }
    }

    async draw({width: container_width, height: container_height}, {view, config, column_paths, schema}, selected_id, is_resize, viewport) {
        const visible_columns = column_paths.slice(viewport.start_col);
        const columns_data = await view.to_columns(viewport);
        const {start_col: sidx} = viewport;
        let cont_body,
            cont_head,
            cidx = 0,
            width = 0,
            last_cells = [];
        const id_column = columns_data["__ID__"];

        if (column_paths[0] === "__ROW_PATH__") {
            const alias = config.row_pivots.join(",");
            cont_head = this.header.draw(config, alias, "");
            cont_body = this.body.draw(container_height, alias, 0, columns_data["__ROW_PATH__"], id_column, selected_id, undefined, config.row_pivots.length, viewport.start_row, 0);
            selected_id = false;
            if (!is_resize) {
                last_cells.push([cont_body.td || cont_head.th, cont_body.metadata || cont_head.metadata]);
            }
            width += this._column_sizes.indices[0] || cont_body.td?.offsetWidth || cont_head.th.offsetWidth;
            cidx++;
        }

        try {
            while (cidx < visible_columns.length) {
                const column_name = visible_columns[cidx];
                if (!columns_data[column_name]) {
                    let missing_cidx = Math.max(viewport.end_col, 0);
                    viewport.start_col = missing_cidx;
                    viewport.end_col = missing_cidx + 1;
                    const new_col = await view.to_columns(viewport);
                    if (!(column_name in new_col)) {
                        new_col[column_name] = [];
                    }
                    columns_data[column_name] = new_col[column_name];
                }
                const column_data = columns_data[column_name];
                const type = column_path_2_type(schema, column_name);

                cont_head = this.header.draw(config, undefined, column_name, type, config.sort, cont_head);
                cont_body = this.body.draw(container_height, column_name, cidx, column_data, id_column, selected_id, type, undefined, viewport.start_row, sidx);
                selected_id = false;
                width += this._column_sizes.indices[cidx + sidx] || cont_body.td?.offsetWidth || cont_head.th.offsetWidth;
                if (!is_resize) {
                    last_cells.push([cont_body.td || cont_head.th, cont_body.metadata || cont_head.metadata]);
                }
                cidx++;

                if (width > container_width) {
                    break;
                }
            }
            this._autosize_columns(last_cells, config);
        } finally {
            this.body.clean({ridx: cont_body?.ridx || 0, cidx});
            if (cont_head) {
                this.header.clean(cont_head);
            }
        }
    }
}
