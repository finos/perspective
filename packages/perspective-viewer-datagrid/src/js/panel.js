/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {throttlePromise} from "@finos/perspective-viewer/dist/esm/utils.js";

import isEqual from "lodash/isEqual";
import CONTAINER_STYLE from "../less/container.less";
import MATERIAL_STYLE from "../less/material.less";

import {log_perf} from "./utils";
import {DEBUG, BROWSER_MAX_HEIGHT, ROW_HEIGHT, DOUBLE_BUFFER_RECREATE, DOUBLE_BUFFER_ROW, DOUBLE_BUFFER_COLUMN} from "./constants";

/**
 * Handles the virtual scroll pane, as well as the double buffering
 * of the underlying <table> (really two). This DOM structure looks
 * a little like this:
 *
 *     +------------------------+      <- div.pd-scroll-container
 *     | +----------------------|------<- div.pd-virtual-panel
 *     | | +------------------+ |      <- div.pd-scroll-table-clip
 *     | | | +----------------|-|--+   <- table             |
 *     | | | | 1  A  Alabama  | |  |                        |
 *     | | | | 2  B  Arizona  | |  |                        |
 *     | | | | 3  C  Arkansas | |  |                        |
 *     | | | | 4  D  Californi| |  |                        |
 *     | | | | 5  E  Colorado | |  |                        |
 *     | | +------------------+ |  |                        |
 *     +------------------------+  |                        |
 *       |   | 8  H  District of C |                        |
 *       |   +---------------------+                        |
 *       |                                                  |
 *       |                                                  |
 *       |                                                  |
 *       |                                                  |
 *       |                                                  |
 *       +--------------------------------------------------+
 *
 * `overflow: auto` is applied to `.pd-scroll-container`, and `.pd-virtual-pane`
 * is sized to match the estimated "virtual" size of the `table`;  estimated,
 * because it's true size can't be known until all columns dimensions are known,
 * which may be deferred in the case of auto-sized tables.
 *
 * Double buffering can be enabled on "column scroll", "row scroll" and/or
 * "column schema change".  When enabled and a redraw is requested for the case,
 * the existing table is cloned with `cloneNode()` and swapped with the real
 * `table`, which is then updated offscreen and swapped back in.  While this is
 * much slower to render, it prevents draw-in.
 *
 * @class DatagridVirtualTableViewModel
 */
export class DatagridVirtualTableViewModel extends HTMLElement {
    constructor() {
        super();
        this._create_shadow_dom();
    }

    _create_shadow_dom() {
        this.attachShadow({mode: "open"});
        const style = document.createElement("style");
        style.textContent = CONTAINER_STYLE + MATERIAL_STYLE;
        this.shadowRoot.appendChild(style);

        const virtual_panel = document.createElement("div");
        virtual_panel.classList.add("pd-virtual-panel");

        const table_clip = document.createElement("div");
        table_clip.classList.add("pd-scroll-table-clip");

        const scroll_container = document.createElement("div");
        scroll_container.classList.add("pd-scroll-container");
        scroll_container.appendChild(virtual_panel);
        scroll_container.appendChild(table_clip);

        const slot = document.createElement("slot");
        table_clip.appendChild(slot);

        this.shadowRoot.appendChild(scroll_container);

        const table_staging = document.createElement("div");
        table_staging.style.position = "absolute";
        table_staging.style.visibility = "hidden";
        scroll_container.appendChild(table_staging);

        const sticky_container = document.createElement("div");

        this._sticky_container = sticky_container;
        this._table_clip = table_clip;
        this._table_staging = table_staging;
        this._scroll_container = scroll_container;
        this._virtual_panel = virtual_panel;
    }

    _calculate_row_range(nrows, preserve_scroll_position) {
        const header_levels = this._view_cache.config.column_pivots.length + 1;
        const total_scroll_height = Math.max(1, this._virtual_panel.offsetHeight - this._container_size.height);
        const percent_scroll = this._scroll_container.scrollTop / total_scroll_height;
        const virtual_panel_row_height = Math.floor(this._container_size.height / ROW_HEIGHT);
        const relative_nrows = preserve_scroll_position ? this._nrows || 0 : nrows;
        let start_row = Math.floor(Math.max(0, relative_nrows + (header_levels - virtual_panel_row_height)) * percent_scroll);
        let end_row = start_row + virtual_panel_row_height;
        if (end_row - 1 > nrows) {
            const offset = end_row - header_levels - nrows;
            if (start_row - offset < 0) {
                end_row = nrows;
                start_row = 0;
            } else {
                start_row -= offset;
                end_row -= offset;
            }
        }
        return {start_row, end_row};
    }

    _calculate_column_range() {
        const total_scroll_width = Math.max(1, this._virtual_panel.offsetWidth - this._container_size.width);
        const percent_left = this._scroll_container.scrollLeft / total_scroll_width;

        const max_scroll_column = this._max_scroll_column() + 0.5;

        let start_col = Math.floor(max_scroll_column * percent_left);
        let end_col = start_col + (this.table_model.num_columns() || 1) + 1;

        return {start_col, end_col};
    }

    _validate_viewport({start_col, end_col, start_row, end_row}) {
        const invalid_column = this._start_col !== start_col;
        const invalid_row = this._start_row !== start_row || this._end_row !== end_row || this._end_col !== end_col;
        this._start_col = start_col;
        this._end_col = end_col;
        this._start_row = start_row;
        this._end_row = end_row;
        return {invalid_column, invalid_row};
    }

    _needs_swap({invalid_schema, invalid_row, invalid_column}) {
        return (DOUBLE_BUFFER_RECREATE && invalid_schema) || (DOUBLE_BUFFER_COLUMN && (invalid_column || invalid_schema)) || (DOUBLE_BUFFER_ROW && (invalid_row || invalid_schema));
    }

    _swap_in(args) {
        if (this._needs_swap(args)) {
            if (this._table_staging !== this.table_model.table.parentElement) {
                this._sticky_container.replaceChild(this.table_model.table.cloneNode(true), this.table_model.table);
                this._table_staging.appendChild(this.table_model.table);
            }
        } else {
            if (this._sticky_container !== this.table_model.table.parentElement) {
                this._sticky_container.replaceChild(this.table_model.table, this._sticky_container.children[0]);
            }
        }
        this._render_element.dispatchEvent(new CustomEvent("perspective-datagrid-before-update", {detail: this}));
    }

    _swap_out(args) {
        if (this._needs_swap(args)) {
            this._sticky_container.replaceChild(this.table_model.table, this._sticky_container.children[0]);
        }
        this._render_element.dispatchEvent(new CustomEvent("perspective-datagrid-after-update", {detail: this}));
    }

    _max_scroll_column() {
        let width = 0;
        if (this._view_cache.config.row_pivots.length > 0) {
            width = this._column_sizes.indices[0];
        }
        let max_scroll_column = this._view_cache.column_paths.length;
        while (width < this._container_size.width) {
            max_scroll_column--;
            width += this._column_sizes.indices[max_scroll_column] || 100;
        }
        return Math.min(this._view_cache.column_paths.length - (this._view_cache.config.row_pivots.length > 0 ? 2 : 1), max_scroll_column + (this._view_cache.config.row_pivots.length > 0 ? 0 : 1));
    }

    _update_virtual_panel_width(invalid_schema) {
        if (invalid_schema) {
            const total_scroll_width = Math.max(1, this._virtual_panel.offsetWidth - this._container_size.width);
            const percent_left = this._scroll_container.scrollLeft / total_scroll_width;
            const max_scroll_column = this._max_scroll_column();
            let cidx = 0,
                virtual_width = 0;
            while (cidx < max_scroll_column) {
                virtual_width += this._column_sizes.indices[cidx] || 100;
                cidx++;
            }
            const panel_width = this._container_size.width + virtual_width;
            this._virtual_panel.style.width = panel_width + "px";
            this._scroll_container.scrollLeft = percent_left * virtual_width;
        }
    }

    _update_virtual_panel_height(nrows) {
        const virtual_panel_px_size = Math.min(BROWSER_MAX_HEIGHT, (nrows + this.table_model.header.cells.length) * ROW_HEIGHT);
        this._virtual_panel.style.height = `${virtual_panel_px_size}px`;
    }

    _calculate_viewport(nrows, preserve_scroll_position) {
        const {start_row, end_row} = this._calculate_row_range(nrows, preserve_scroll_position);
        const {start_col, end_col} = this._calculate_column_range();
        const id = this._view_cache.config.row_pivots.length > 0;
        this._nrows = nrows;
        return {start_col, end_col, start_row, end_row, id};
    }

    _diff(config) {
        config = Object.assign({}, config);
        if (!this._view_cache) {
            return {};
        }
        const old_config = Object.assign({}, this._view_cache.config);
        delete old_config["sort"];
        delete config["sort"];
        return {preserve_scroll_position: isEqual(config, old_config)};
    }

    @throttlePromise
    async draw(options = {}) {
        const __debug_start_time__ = DEBUG && performance.now();
        const {preserve_scroll_position = true, preserve_width = false, invalid_viewport = false} = options;

        if (this._view_cache.column_paths === undefined) {
            return;
        }

        // this will trigger another call to draw(), but will not be invalid
        // and this won't actually render.
        if (!preserve_scroll_position) {
            this.reset_scroll();
        }

        const nrows = await this._view_cache.view.num_rows();

        this._container_size = this._container_size || {
            width: this._scroll_container.offsetWidth,
            height: this._scroll_container.offsetHeight
        };

        const viewport = this._calculate_viewport(nrows, preserve_scroll_position);
        const {invalid_row, invalid_column} = this._validate_viewport(viewport);
        this._update_virtual_panel_height(nrows);

        if (this._invalid_schema || invalid_row || invalid_column || invalid_viewport) {
            this._swap_in(options);
            await this.table_model.draw(this._container_size, this._view_cache, this._selected_id, preserve_width, viewport);
            this._swap_out(options);
            if (!preserve_width) {
                this._update_virtual_panel_width(this._invalid_schema || invalid_column);
            }
            this._invalid_schema = false;
        }

        if (DEBUG) {
            log_perf(performance.now() - __debug_start_time__);
        }
    }
}
