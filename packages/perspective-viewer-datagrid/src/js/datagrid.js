/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {METADATA_MAP} from "./constants";
import {DatagridTableViewModel} from "./table";
import {DatagridViewEventModel} from "./events";

/**
 * Datagrid's "public" API.  See the `superstore-custom-grid.html` simple
 * example.
 *
 * @class DatagridViewEventModel
 * @extends {DatagridVirtualTableViewModel}
 */
export class DatagridViewModel extends DatagridViewEventModel {
    /**
     * Returns the metadata object associated with a `<td>` or `<th>`.  When
     * an `perspective-datagrid-after-update` event fires, use this method
     * to look up the Perspective data associated with a `<table>`s DOM cells.
     *
     * @param {*} td
     * @returns a metadata object.
     * @memberof DatagridViewModel
     */
    get_meta(td) {
        return METADATA_MAP.get(td);
    }

    /**
     * Gets all `<td>` elements modified in this render.  This is equivalent to
     * `element.querySlectorAll("td");
     *
     * @returns
     * @memberof DatagridViewModel
     */
    get_tds() {
        return this.table_model.body.cells.flat(1);
    }

    /**
     * Gets all `<th>` elements modified in this render.  This is equivalent to
     * `element.querySlectorAll("th");
     *
     * @returns
     * @memberof DatagridViewModel
     */
    get_ths() {
        return this.table_model.body.cells.flat(1);
    }

    /**
     * Clear this renderer.
     *
     * @memberof DatagridViewModel
     */
    clear() {
        this._sticky_container.innerHTML = "<table></table>";
    }

    reset_viewport() {
        this._start_row = undefined;
        this._end_row = undefined;
        this._start_col = undefined;
        this._end_col = undefined;
    }

    reset_size() {
        this._invalid_schema = true;
    }

    reset_scroll() {
        this._column_sizes.indices = [];
        this.scrollTop = 0;
        this.scrollLeft = 0;
        this.reset_viewport();
    }

    async set_view(table, view) {
        const config = await view.get_config();
        const table_schema = await table.schema();
        const schema = await view.schema();
        const column_paths = await view.column_paths();
        this._invalid_schema = true;
        const options = this.infer_options(config);
        this._view_cache = {view, config, column_paths, schema, table_schema};
        return options;
    }

    set_element(virtual_scrolling_disabled = false) {
        this._virtual_scrolling_disabled = virtual_scrolling_disabled;
        this.create_shadow_dom();
        this._column_sizes = {auto: {}, override: {}, indices: []};
        this.table_model = new DatagridTableViewModel(this._table_clip, this._column_sizes, this._sticky_container);
        if (!this.table_model) return;
        if (this !== this._sticky_container.parentElement) {
            this.appendChild(this._sticky_container);
        }
    }

    save() {
        const selected = this._get_selected();
        if (selected !== undefined) {
            return {selected};
        }
    }

    restore(config) {
        if (config.selected) {
            this._set_selected(config.selected);
        }
    }
}
