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
import {METADATA_MAP} from "./constants";
import {DatagridVirtualTableViewModel} from "./scroll_panel";
import {getCellConfig} from "./utils";

/**
 *
 *
 * @class DatagridViewEventModel
 * @extends {DatagridVirtualTableViewModel}
 */
export class DatagridViewEventModel extends DatagridVirtualTableViewModel {
    register_listeners() {
        this.addEventListener("scroll", this._on_scroll.bind(this), {passive: false});
        this.addEventListener("mousewheel", this._on_mousewheel.bind(this), {passive: false});
        this.addEventListener("mousedown", this._on_click.bind(this));
        this.addEventListener("dblclick", this._on_dblclick.bind(this));
    }

    /**
     * @returns
     * @memberof DatagridViewModel
     */
    async _on_scroll(event) {
        event.stopPropagation();
        event.returnValue = false;
        await this.draw();
        this.dispatchEvent(new CustomEvent("perspective-datagrid-scroll"));
    }

    /**
     * Mousewheel must precalculate in addition to `_on_scroll` to prevent
     * visual artifacts due to scrolling "inertia" on modern browsers/mobile.
     *
     * @param {*} event
     * @memberof DatagridViewModel
     */
    _on_mousewheel(event) {
        if (this._virtual_scrolling_disabled) {
            return;
        }
        event.preventDefault();
        event.returnValue = false;
        const {offsetWidth, offsetHeight, scrollTop, scrollLeft} = this;
        const total_scroll_height = Math.max(1, this._virtual_panel.offsetHeight - offsetHeight);
        const total_scroll_width = Math.max(1, this._virtual_panel.offsetWidth - offsetWidth);
        this.scrollTop = Math.min(total_scroll_height, scrollTop + event.deltaY);
        this.scrollLeft = Math.min(total_scroll_width, scrollLeft + event.deltaX);
        this._on_scroll(event);
    }

    /**
     * Handles double-click header width override reset.
     *
     * @param {*} event
     * @returns
     * @memberof DatagridVirtualTableViewModel
     */
    async _on_dblclick(event) {
        let element = event.target;
        while (element.tagName !== "TD" && element.tagName !== "TH") {
            element = element.parentElement;
            if (!this._sticky_container.contains(element)) {
                return;
            }
        }
        const is_resize = event.target.classList.contains("pd-column-resize");
        const metadata = METADATA_MAP.get(element);
        if (is_resize) {
            await new Promise(setTimeout);
            delete this._column_sizes.override[metadata.size_key];
            delete this._column_sizes.auto[metadata.size_key];
            delete this._column_sizes.indices[metadata.cidx];
            element.style.minWidth = "";
            element.style.maxWidth = "";
            for (const row of this.table_model.body.cells) {
                const td = row[metadata.cidx];
                td.style.minWidth = "";
                td.style.maxWidth = "";
                td.classList.remove("pd-cell-clip");
            }
            await this.draw({invalid_viewport: true});
        }
    }

    /**
     * Dispatches all click events to other handlers, depending on
     * `event.target`.
     *
     * @param {*} event
     * @returns
     * @memberof DatagridVirtualTableViewModel
     */
    async _on_click(event) {
        if (event.button !== 0) {
            return;
        }

        let element = event.target;
        while (element.tagName !== "TD" && element.tagName !== "TH") {
            element = element.parentElement;
            if (!this._sticky_container.contains(element)) {
                return;
            }
        }

        const is_button = event.target.classList.contains("pd-row-header-icon");
        const is_resize = event.target.classList.contains("pd-column-resize");
        const metadata = METADATA_MAP.get(element);
        if (is_button) {
            await this._on_toggle(event, metadata);
        } else if (is_resize) {
            this._on_resize_column(event, element, metadata);
        } else if (metadata?.is_column_header) {
            await this._on_sort(event, metadata);
        } else if (this.parentElement.hasAttribute("selectable")) {
            await this._on_row_select(metadata);
        }
    }

    /**
     * Datagrid event for column resize.
     *
     * @param {*} event
     * @param {*} element
     * @param {*} metadata
     * @memberof DatagridVirtualTableViewModel
     */
    _on_resize_column(event, element, metadata) {
        const start = event.pageX;
        element = this.table_model.header.get_column_header(metadata.vcidx);
        const width = this._column_sizes.indices[metadata.cidx];
        const move = event => this._on_resize_column_move(event, element, start, width, metadata);
        const up = async () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            const override_width = this._column_sizes.override[metadata.size_key];
            this._column_sizes.indices[metadata.cidx] = override_width;
            await this.draw({invalid_viewport: true});
        };
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
    }

    /**
     * Datagrid event for mouse movement when resizing a column.
     *
     * @param {*} event
     * @param {*} th
     * @param {*} start
     * @param {*} width
     * @param {*} metadata
     * @memberof DatagridVirtualTableViewModel
     */
    @throttlePromise
    async _on_resize_column_move(event, th, start, width, metadata) {
        await new Promise(setTimeout);
        const diff = event.pageX - start;
        const override_width = width + diff;
        this._column_sizes.override[metadata.size_key] = override_width;

        // If the column is smaller, new columns may need to be fetched, so
        // redraw, else just update the DOM widths as if redrawn.
        if (diff < 0) {
            await this.draw({invalid_viewport: true, preserve_width: true});
        } else {
            th.style.minWidth = override_width + "px";
            th.style.maxWidth = override_width + "px";
            const auto_width = this._column_sizes.auto[metadata.size_key];
            for (const row of this.table_model.body.cells) {
                const td = row[metadata.vcidx];
                td.style.maxWidth = td.style.minWidth = override_width + "px";
                td.classList.toggle("pd-cell-clip", auto_width > override_width);
            }
        }
    }
    /**
     * Get the id of the selected row
     *
     * @memberof DatagridVirtualTableViewModel
     */
    _get_selected() {
        return this._selected_id;
    }
    /**
     * sets the selected row to the `selected_id`. The row for the id
     * will be highlighted if it's in the viewport
     *
     * @param {*} selected_id
     * @memberof DatagridVirtualTableViewModel
     */
    _set_selected(selected_id) {
        this._selected_id = selected_id;
    }
    /**
     * Clears selected row
     *
     * @memberof DatagridVirtualTableViewModel
     */
    _clear_selected() {
        delete this._selected_id;
    }

    /**
     * Datagrid event which handles row selection.
     *
     * @param {*} metadata
     * @returns
     * @memberof DatagridVirtualTableViewModel
     */
    async _on_row_select(metadata) {
        const is_deselect = isEqual(metadata.id, this._selected_id);
        let filters = [];
        if (is_deselect) {
            this._clear_selected();
            await this.draw({invalid_viewport: true});
        } else {
            this._set_selected(metadata.id);
            await this.draw({invalid_viewport: true});
            filters = await getCellConfig(this._view_cache, metadata.ridx, metadata.cidx);
            filters = filters.config.filters;
        }

        this.dispatchEvent(
            new CustomEvent("perspective-select", {
                bubbles: true,
                composed: true,
                detail: {
                    selected: !is_deselect,
                    config: {filters}
                }
            })
        );
    }

    /**
     * Toggles a tree row between 'open' and 'closed' states, or toggles all
     * tree rows at this depth when the shift key is also pressed.
     *
     * @param {*} event
     * @param {*} metadata
     * @memberof DatagridVirtualTableViewModel
     */
    async _on_toggle(event, metadata) {
        if (metadata.is_open) {
            if (event.shiftKey) {
                await this._view_cache.view.set_depth(metadata.row_path.length - 1);
            } else {
                await this._view_cache.view.collapse(metadata.ridx);
            }
        } else if (metadata.is_open === false) {
            if (event.shiftKey) {
                await this._view_cache.view.set_depth(metadata.row_path.length);
            } else {
                await this._view_cache.view.expand(metadata.ridx);
            }
        }
        await this.draw({invalid_viewport: true});
    }

    /**
     * Datagrid event which handles sorting.  There are 3 control states:
     *
     *  - Already sorted by `metadata.column_name`, increment sort clause to
     *    next sort state.
     *  - Not sorted, shift key, append new sort clause to existing.
     *  - Not sorted, set as new sort clause.
     *
     * @param {*} event
     * @param {*} metadata
     * @memberof DatagridVirtualTableViewModel
     */
    async _on_sort(event, metadata) {
        let sort = this._view_cache.config.sort.slice();
        const current_idx = sort.findIndex(x => x[0] === metadata.column_name);
        if (current_idx > -1) {
            const sort_dir = sort[current_idx][1];
            const new_sort = this.parentElement._increment_sort(sort_dir, false, event.altKey);
            sort[current_idx] = [metadata.column_name, new_sort];
        } else {
            let sort_dir = event.altKey ? "asc abs" : "asc";
            const new_sort = [metadata.column_name, sort_dir];
            if (event.shiftKey) {
                sort.push(new_sort);
            } else {
                sort = [new_sort];
            }
        }
        this.parentElement.setAttribute("sort", JSON.stringify(sort));
    }
}
