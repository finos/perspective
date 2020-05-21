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

import {log_perf, html} from "./utils";
import {DEBUG, BROWSER_MAX_HEIGHT, DOUBLE_BUFFER_RECREATE, DOUBLE_BUFFER_ROW, DOUBLE_BUFFER_COLUMN} from "./constants";

/**
 * Handles the virtual scroll pane, as well as the double buffering
 * of the underlying <table>. This DOM structure looks a little like
 * this:
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
    }

    /**
     * Create the DOM for this `shadowRoot`.
     *
     * `MATERIAL_STYLE` is needed both here, and in the document `<head>`, due
     * to double buffering, which may read incorrect position/size values as the
     * double buffered `<table>` is rendered in the shadow DOM before being
     * swapped in.
     *
     * @memberof DatagridVirtualTableViewModel
     */
    create_shadow_dom() {
        this.attachShadow({mode: "open"});
        const slot = `<slot></slot>`;
        this.shadowRoot.innerHTML = html`
            <style>
                ${CONTAINER_STYLE + MATERIAL_STYLE}
            </style>
            <div class="pd-virtual-panel">${this._virtual_scrolling_disabled ? slot : ""}</div>
            <div class="pd-scroll-table-clip">${this._virtual_scrolling_disabled ? "" : slot}</div>
            <div style="position: absolute; visibility: hidden;"></div>
        `;

        const sticky_container = document.createElement("div");
        sticky_container.setAttribute("tabindex", "0");
        this.setAttribute("tabindex", "0");
        const [, virtual_panel, table_clip, table_staging] = this.shadowRoot.children;
        this._sticky_container = sticky_container;
        this._table_clip = table_clip;
        this._table_staging = table_staging;
        this._virtual_panel = virtual_panel;
    }

    /**
     * Calculates the `viewport` argument for perspective's `to_columns` method.
     *
     * @param {*} nrows
     * @param {*} reset_scroll_position
     * @returns
     * @memberof DatagridVirtualTableViewModel
     */
    _calculate_viewport(nrows, reset_scroll_position) {
        const id = this._view_cache.config.row_pivots.length > 0;
        if (this._virtual_scrolling_disabled) {
            return {id};
        }
        const {start_row, end_row} = this._calculate_row_range(nrows, reset_scroll_position);
        const {start_col, end_col} = this._calculate_column_range();
        this._nrows = nrows;
        return {start_col, end_col, start_row, end_row, id};
    }

    /**
     * Calculate `start_row` and `end_row` for the viewport.  We do this by
     * first calculating `total_scroll_height`, the px height of the
     * scrollable page, from the `_virtual_panel.offsetHeight`.
     *
     *    0px +------------+-------------+  - virtual_panel.offsetHeight
     *        |            |  .          |  . 600px
     *        |  viewport  |  .          |  .
     *        |            |  .          |  .
     *  200px +------------+  - height   |  .  - total_scroll_height
     *        |                 200px    |  .  . 400px
     *        |                          |  .  .
     *        |                          |  .  .
     *        |                          |  .  .
     *        |                          |  .  .
     *  600px +--------------------------+  -  -
     *
     *  `percent_scroll` can be calculated from this value and `scrollTop`,
     *  which we can then apply to the new calculated height to preserve scroll
     *  position when the height has changed since previous render.
     *
     *    0px +--------------------------+  -
     *        |                          |  .
     *        |                          |  .
     *        |                          |  . scrollable area
     *  300px +------------+             |  .
     *        |            |             |  .
     *  - - - |  viewport  | - - - - - - |  - total_scroll_height
     *        |            |             |    400px
     *  500px +------------+             |
     *        |                          |
     *  600px +--------------------------+
     *
     * @param {*} nrows
     * @param {*} reset_scroll_position
     * @returns
     * @memberof DatagridVirtualTableViewModel
     */
    _calculate_row_range(nrows, reset_scroll_position) {
        const {height} = this._container_size;
        const row_height = this._column_sizes.row_height || 19;
        const header_levels = this._view_cache.config.column_pivots.length + 1;
        const total_scroll_height = Math.max(1, this._virtual_panel.offsetHeight - this.offsetHeight);
        const percent_scroll = this.scrollTop / total_scroll_height;
        const virtual_panel_row_height = height / row_height;
        const relative_nrows = !reset_scroll_position ? this._nrows || 0 : nrows;
        const scroll_rows = Math.max(0, relative_nrows + (header_levels - virtual_panel_row_height));
        let start_row = Math.ceil(scroll_rows * percent_scroll);
        let end_row = start_row + virtual_panel_row_height + 1;
        return {start_row, end_row};
    }

    /**
     * Calculates `start_col` and `end_col` for the viewport - most of the
     * details of which are actually calculated in `_max_column`, the equivalent
     * of `total_scroll_height` from `_calculate_row_range`.
     *
     * @returns
     * @memberof DatagridVirtualTableViewModel
     */
    _calculate_column_range() {
        const total_scroll_width = Math.max(1, this._virtual_panel.offsetWidth - this._container_size.width);
        const percent_left = this.scrollLeft / total_scroll_width;
        const max_scroll_column = this._max_scroll_column() + 0.5;
        let start_col = Math.floor(max_scroll_column * percent_left);
        let end_col = start_col + (this.table_model.num_columns() || 1) + 1;
        return {start_col, end_col};
    }

    /**
     * Calculates the minimum possible starting column index for which the last
     * column is completely visible (e.g. not occluded by the container clip).
     * This is assumed to be the # of columns unil the column widths are
     * calculated as they are scrolled into view by the user, which requires
     * special synchronization with _update_virtual_panel_width`
     * as the scrollable width will changes as the user scrolls left to right.
     *
     * Once `_column_sizes.indices` has enough column widths populated from
     * user scrolling, it calulates the cumulative sum of column widths from
     * last visible column backwards, until the sum is larger than the viewport
     * px width, which is 1 below the max scroll column
     *
     *               width = 290   = 210     = 100    = 0
     *   0px               V       V         V        500px
     *   +-----------------+-------+---------+--------+
     *   | ..ol B) (Col C) | Col D | Col E   | Col F  |
     *   |                 | 80px  | 110px   | 100px  |
     *   |                 |       |         |        |
     *
     * @returns
     * @memberof DatagridVirtualTableViewModel
     */
    _max_scroll_column() {
        let width = 0;
        if (this._view_cache.config.row_pivots.length > 0) {
            width = this._column_sizes.indices[0];
        }
        let max_scroll_column = this._view_cache.column_paths.length;
        while (width < this._container_size.width && max_scroll_column >= 0) {
            max_scroll_column--;
            width += this._column_sizes.indices[max_scroll_column] || 60;
        }
        const psp_offset = this._view_cache.config.row_pivots.length > 0;
        return Math.min(this._view_cache.column_paths.length - (psp_offset ? 2 : 1), max_scroll_column + (psp_offset ? 0 : 1));
    }

    /**
     * Determines whether the viewport is identical in row and column axes to
     * the previous viewport rendered, for throttling identical render requests,
     * e.g. when the logical (row-wise) viewport does not change, but the pixel
     * viewport has moved a few px.
     *
     * @param {*} {start_col, end_col, start_row, end_row}
     * @returns
     * @memberof DatagridVirtualTableViewModel
     */
    _validate_viewport({start_col, end_col, start_row, end_row}) {
        const invalid_column = this._start_col !== start_col;
        const invalid_row = this._start_row !== start_row || this._end_row !== end_row || this._end_col !== end_col;
        this._start_col = start_col;
        this._end_col = end_col;
        this._start_row = start_row;
        this._end_row = end_row;
        return {invalid_column, invalid_row};
    }

    /**
     * A helper method to determine whether to perform a double-buffer render
     * based on settings and render type.
     *
     * @param {*} {invalid_schema, invalid_row, invalid_column}
     * @returns
     * @memberof DatagridVirtualTableViewModel
     */
    _needs_swap({invalid_row, invalid_column}) {
        return (DOUBLE_BUFFER_RECREATE && this._invalid_schema) || (DOUBLE_BUFFER_COLUMN && (invalid_column || this._invalid_schema)) || (DOUBLE_BUFFER_ROW && (invalid_row || this._invalid_schema));
    }

    /**
     * Step 1 of a double-buffer render, swaps in a duplicate table and appends
     * the real table to the hidden shadow DOM for mutation.
     *
     * @param {*} args
     * @memberof DatagridVirtualTableViewModel
     */
    _swap_in(args) {
        this.dispatchEvent(new CustomEvent("perspective-datagrid-before-update", {bubbles: true, detail: this}));
        if (!this._virtual_scrolling_disabled) {
            if (this._needs_swap(args)) {
                if (this._sticky_container === this.table_model.table.parentElement) {
                    this._sticky_container.replaceChild(this.table_model.table.cloneNode(true), this.table_model.table);
                }
                this._table_staging.appendChild(this.table_model.table);
            } else {
                if (this._sticky_container !== this.table_model.table.parentElement) {
                    this._sticky_container.replaceChild(this.table_model.table, this._sticky_container.children[0]);
                }
            }
        }
    }

    /**
     * Step 2 of a double-buffer render, swap the original table back into the
     * light DOM.
     *
     * @param {*} args
     * @memberof DatagridVirtualTableViewModel
     */
    _swap_out(args) {
        if (!this._virtual_scrolling_disabled && this._needs_swap(args)) {
            this._sticky_container.replaceChild(this.table_model.table, this._sticky_container.children[0]);
        }
        this.dispatchEvent(new CustomEvent("perspective-datagrid-after-update", {bubbles: true, detail: this}));
    }

    /**
     * Updates the `virtual_panel` width based on view state.
     *
     * @param {*} invalid_schema
     * @memberof DatagridVirtualTableViewModel
     */
    _update_virtual_panel_width(invalid_schema) {
        if (invalid_schema) {
            if (this._virtual_scrolling_disabled) {
                this._virtual_panel.style.width = this._column_sizes.indices.reduce((x, y) => x + y, 0) + "px";
            } else {
                const total_scroll_width = Math.max(1, this._virtual_panel.offsetWidth - this._container_size.width);
                const percent_left = this.scrollLeft / total_scroll_width;
                const max_scroll_column = this._max_scroll_column();
                let cidx = 0,
                    virtual_width = 0;
                while (cidx < max_scroll_column) {
                    virtual_width += this._column_sizes.indices[cidx] || 60;
                    cidx++;
                }
                const panel_width = this._container_size.width + virtual_width;
                this._virtual_panel.style.width = panel_width + "px";
                this.scrollLeft = percent_left * virtual_width;
            }
        }
    }

    /**
     * Updates the `virtual_panel` height based on the view state.
     *
     * @param {*} nrows
     * @memberof DatagridVirtualTableViewModel
     */
    _update_virtual_panel_height(nrows) {
        const {row_height = 19} = this._column_sizes;
        const header_height = this.table_model.header.cells.length * row_height;
        let virtual_panel_px_size;
        if (this._virtual_scrolling_disabled) {
            virtual_panel_px_size = nrows * row_height + header_height;
        } else {
            const {height} = this._container_size;
            const zoom_factor = this.offsetHeight / (height - header_height);
            virtual_panel_px_size = Math.min(BROWSER_MAX_HEIGHT, nrows * row_height * zoom_factor);
        }
        this._virtual_panel.style.height = `${virtual_panel_px_size}px`;
    }

    /**
     * Infer options for `draw()` from the previous render state, given a new
     * perspective `config`.
     *
     * @param {*} config
     * @returns
     * @memberof DatagridVirtualTableViewModel
     */
    infer_options(config) {
        config = Object.assign({}, config);
        if (!this._view_cache) {
            return {};
        }
        const old_config = Object.assign({}, this._view_cache.config);
        delete old_config["sort"];
        delete config["sort"];
        return {reset_scroll_position: !isEqual(config, old_config)};
    }

    /**
     * Draws this virtual panel, given an object of render options that allow
     * the implementor to fine tune the individual render frames based on the
     * interaction and previous render state.
     *
     * `reset_scroll_position` will not prevent the viewport from moving as
     * `draw()` may change the dmiensions of the virtual_panel (and thus,
     * absolute scroll offset).  This calls `reset_scroll`, which will
     * trigger `_on_scroll` and ultimately `draw()` again;  however, this call
     * to `draw()` will be for the same viewport and will not actually cause
     * a render.
     *
     * @param {*} [options]
     * @param {boolean} [options.reset_scroll_position=false]
     * @param {boolean} [options.preserve_width=false]
     * @param {boolean} [options.invalid_viewport=false]
     * @returns
     * @memberof DatagridVirtualTableViewModel
     */
    @throttlePromise
    async draw(options = {}) {
        const __debug_start_time__ = DEBUG && performance.now();
        const {reset_scroll_position = false, preserve_width = false, invalid_viewport = false} = options;

        if (this._view_cache.column_paths === undefined) {
            return;
        }

        if (reset_scroll_position) {
            this.reset_scroll();
        }

        const nrows = await this._view_cache.view.num_rows();

        if (this._virtual_scrolling_disabled) {
            this._container_size = {width: Infinity, height: Infinity};
        } else {
            this._container_size = (!this._invalid_schema && this._container_size) || {
                width: this._table_clip.offsetWidth,
                height: this._table_clip.offsetHeight
            };
        }

        const viewport = this._calculate_viewport(nrows, reset_scroll_position);
        const swap_args = this._validate_viewport(viewport);
        const {invalid_row, invalid_column} = swap_args;
        this._update_virtual_panel_height(nrows);

        if (this._invalid_schema || invalid_row || invalid_column || invalid_viewport) {
            this._swap_in(swap_args);
            const last_cells = await this.table_model.draw(this._container_size, this._view_cache, this._selected_id, preserve_width, viewport);
            this._swap_out(swap_args);
            this.table_model.autosize_cells(last_cells);
            if (!preserve_width) {
                this._update_virtual_panel_width(this._invalid_schema || invalid_column || invalid_viewport);
            }
            this._invalid_schema = false;
        }

        if (DEBUG) {
            log_perf(performance.now() - __debug_start_time__);
        }
    }
}
