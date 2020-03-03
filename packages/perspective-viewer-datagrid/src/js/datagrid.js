/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {throttlePromise, registerPlugin} from "@finos/perspective-viewer/dist/esm/utils.js";
import {get_type_config} from "@finos/perspective/dist/esm/config";
import CONTAINER_STYLE from "../less/container.less";
import MATERIAL_STYLE from "../less/material.less";

// Output runtime debug info like FPS.
const DEBUG = false;

// Double buffer when the viewport scrolls columns, rows or when the
// view is recreated.  Reduces render draw-in on some browsers, at the
// expense of performance.
const DOUBLE_BUFFER_COLUMN = true;
const DOUBLE_BUFFER_ROW = false;
const DOUBLE_BUFFER_RECREATE = true;

// The largest size virtual <div> in (px) that Chrome can support without
// glitching.
const BROWSER_MAX_HEIGHT = 10000000;

/******************************************************************************
 *
 * Utilities
 *
 */

const PRIVATE = Symbol("Private Datagrid");

const METADATA_MAP = new WeakMap();

/**
 * A class method decorate for memoizing method results.  Only works on one
 * arg.
 */
function memoize(_target, _property, descriptor) {
    const cache = new Map();
    const func = descriptor.value;
    descriptor.value = new_func;
    return descriptor;
    function new_func(arg) {
        if (cache.has(arg)) {
            return cache.get(arg);
        } else {
            const res = func.call(this, arg);
            cache.set(arg, res);
            return res;
        }
    }
}

// Profiling

let LOG = [];

function _log_fps() {
    const avg = LOG.reduce((x, y) => x + y, 0) / LOG.length;
    const rfps = LOG.length / 5;
    const vfps = 1000 / avg;
    const nframes = LOG.length;
    console.log(`${avg.toFixed(2)} ms/frame   ${rfps} rfps   ${vfps.toFixed(2)} vfps   (${nframes} frames in 5s)`);
    LOG = [];
}

function _start_profiling_loop() {
    if (DEBUG) {
        setInterval(_log_fps.bind(this), 5000);
    }
}

// Tree Header Renderer
// TODO factor out

function _tree_header(td, path, is_leaf, is_open) {
    let name;
    if (path.length > 0) {
        name = path[path.length - 1];
    } else {
        name = "TOTAL";
    }
    if (is_leaf) {
        let html = "";
        for (let i = 0; i < path.length; i++) {
            html += `<span style="margin-left:5px;margin-right:15px;border-left:1px solid #eee;height:19px"></span>`;
        }
        td.innerHTML = `<div style="display:flex;align-items:center">${html}<span style="margin-left:20px">${name}</span></div>`;
    } else {
        const icon = is_open ? "remove" : "add";
        let html = "";
        for (let i = 0; i < path.length; i++) {
            html += `<span style="margin-left:5px;margin-right:15px;border-left:1px solid #eee;height:19px"></span>`;
        }
        td.innerHTML = `<div style="display:flex;align-items:center">${html}<span class="pd-row-header-icon">${icon}</span><span>${name}</span></div>`;
    }
    td.classList.add("pd-group-header");
}

/******************************************************************************
 *
 * View Model
 *
 */

class ViewModel {
    constructor(pinned_widths, container, table) {
        this.pinned_widths = pinned_widths;
        this._container = container;
        this.table = table;
        this.cells = [];
        this.rows = [];
    }

    num_rows() {
        return this.cells.length;
    }

    @memoize
    format(type) {
        const config = get_type_config(type);
        const format_function = {
            float: Intl.NumberFormat,
            integer: Intl.NumberFormat,
            datetime: Intl.DateTimeFormat,
            date: Intl.DateTimeFormat
        }[config.type || type];
        if (format_function) {
            const func = new format_function("en-us", config.format);
            return {
                format(td, path) {
                    td.textContent = func.format(path);
                }
            };
        } else if (type === undefined) {
            return {format: _tree_header};
        }
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

/**
 * <thead> view model.  This model accumulates state in the form of
 * pinned_widths, which leverages <tables> autosize behavior across
 * virtual pages.
 *
 * @class DatagridHeaderViewModel
 */
class DatagridHeaderViewModel extends ViewModel {
    _draw_group_th(offset_cache, d, column_name) {
        const {tr, row_container} = this._get_row(d);
        const th = this._get_cell("th", row_container, offset_cache[d], tr);
        offset_cache[d] += 1;
        th.className = "";
        th.removeAttribute("colspan");
        th.textContent = column_name;
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

    _draw_th(column, column_name, type, th) {
        th.column_path = column;
        th.column_name = column_name;
        th.column_type = type;
        const pin_width = this.pinned_widths[`${column}|${type}`];
        th.classList.add(type);
        if (pin_width) {
            th.style.minWidth = pin_width;
        } else {
            th.style.minWidth = "";
        }
    }

    draw(header_levels, column, type, {group_header_cache = [], offset_cache = []} = {}) {
        let parts = column.split("|");
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
                    th = this._draw_group_th(offset_cache, d, column_name);
                    group_header_cache[d] = [column_name, th];
                    is_new_group = true;
                }
            } else {
                if (is_new_group) {
                    this._redraw_previous(offset_cache, d);
                }
                th = this._draw_group_th(offset_cache, d, column_name);
            }
        }
        this._draw_th(column, column_name, type, th);
        if (header_levels === 1 && type === undefined) {
            th.classList.add("pd-group-header");
        }
        return {group_header_cache, offset_cache};
    }

    clean({offset_cache}) {
        this._clean_columns(offset_cache);
        this._clean_rows(offset_cache.length);
    }
}

function column_path_2_type(schema, column) {
    let parts = column.split("|");
    return schema[parts[parts.length - 1]];
}

/**
 * <tbody> view model.
 *
 * @class DatagridBodyViewModel
 */
class DatagridBodyViewModel extends ViewModel {
    _get_or_create_metadata(td) {
        if (METADATA_MAP.has(td)) {
            return METADATA_MAP.get(td);
        } else {
            const metadata = {};
            METADATA_MAP.set(td, metadata);
            return metadata;
        }
    }

    _draw_td(ridx, cidx, val, type, depth, is_open, ridx_offset) {
        const {tr, row_container} = this._get_row(ridx);
        const td = this._get_cell("td", row_container, cidx, tr);
        const metadata = this._get_or_create_metadata(td);

        if (metadata.value !== val) {
            td.className = type;
            const formatter = this.format(type);
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

        return td;
    }

    draw(container_height, column_name, cidx, column_data, type, depth, ridx_offset) {
        let ridx = 0;
        let td;
        for (const val of column_data) {
            const next = column_data[ridx + 1];
            td = this._draw_td(ridx++, cidx, val, type, depth, next?.length > val?.length, ridx_offset);
            if (ridx * 19 > container_height) {
                break;
            }
        }
        const offsetWidth = td.offsetWidth;
        this.pinned_widths[`${column_name}|${type}`] = offsetWidth + "px";
        return {offsetWidth: offsetWidth, cidx, ridx};
    }

    clean({ridx, cidx}) {
        this._clean_columns(cidx);
        this._clean_rows(ridx);
    }
}

/**
 * <table> view model.  In order to handle unknown column width when `draw()`
 * is called, this model will iteratively fetch more data to fill in columns
 * until the page is complete, and makes some column viewport estimations
 * when this information is not availble.
 *
 * @class DatagridTableViewModel
 */
class DatagridTableViewModel {
    constructor(table_clip, pinned_widths) {
        const table = document.createElement("table");
        table.setAttribute("cellspacing", 0);

        const thead = document.createElement("thead");
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        table.appendChild(tbody);

        this.table = table;
        this.pinned_widths = pinned_widths;
        this.header = new DatagridHeaderViewModel(pinned_widths, table_clip, thead);
        this.body = new DatagridBodyViewModel(pinned_widths, table_clip, tbody);
        this.fragment = document.createDocumentFragment();
    }

    num_columns() {
        return this.header._get_row(Math.max(0, this.header.rows.length - 1)).row_container.length;
    }

    async draw(container_width, container_height, view, header_levels, row_levels, column_paths, schemap, viewport) {
        const column_datap = view.to_columns(viewport);
        const visible_columns = column_paths.slice(viewport.start_col);
        const schema = await schemap;
        const columns_data = await column_datap;
        let cont_body,
            cont_head,
            cidx = 0,
            width = 0;

        if (column_paths[0] === "__ROW_PATH__") {
            cont_head = this.header.draw(header_levels, "");
            cont_body = this.body.draw(container_height, "", cidx, columns_data["__ROW_PATH__"], undefined, row_levels, viewport.start_row);
            width += cont_body.offsetWidth;
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
                        throw new Error(`Missing column ${column_name}; contains ${Object.keys(new_col).join(", ")}`);
                    }
                    columns_data[column_name] = new_col[column_name];
                }
                const column_data = columns_data[column_name];
                const type = column_path_2_type(schema, column_name);

                cont_head = this.header.draw(header_levels, column_name, type, cont_head);
                cont_body = this.body.draw(container_height, column_name, cidx, column_data, type, undefined, viewport.start_row);
                width += cont_body.offsetWidth;
                cidx++;

                if (width > container_width) {
                    break;
                }
            }
        } finally {
            this.body.clean({ridx: cont_body?.ridx || 0, cidx});
            this.header.clean(cont_head);
        }
    }
}

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
 * @class DatagridVirtualTableViewModel
 */
class DatagridVirtualTableViewModel extends HTMLElement {
    constructor() {
        super();
        this._create_dom_model();
        _start_profiling_loop();
    }

    set_element(elem) {
        this.elem = elem;
    }

    get_meta(td) {
        return METADATA_MAP.get(td);
    }

    get_tds() {
        return this.table_model.body.cells.flat(1);
    }

    get_ths() {
        return this.table_model.body.cells.flat(1);
    }

    _create_dom_model() {
        // TODO singleton
        this.attachShadow({mode: "open"});
        const style = document.createElement("style");
        style.textContent = CONTAINER_STYLE + MATERIAL_STYLE;
        this.shadowRoot.appendChild(style);

        const virtual_panel = document.createElement("div");
        virtual_panel.classList.add("pd-virtual-panel");

        const table_clip = document.createElement("div");
        table_clip.classList.add("pd-scroll-table-clip");

        const container = document.createElement("div");
        container.classList.add("pd-scroll-container");
        container.appendChild(virtual_panel);
        container.appendChild(table_clip);
        container.addEventListener("scroll", this._on_scroll.bind(this), {passive: false});
        container.addEventListener("mousewheel", this._on_mousewheel.bind(this), {passive: false});

        const slot = document.createElement("slot");
        table_clip.appendChild(slot);

        this.shadowRoot.appendChild(container);

        const staging = document.createElement("div");
        staging.style.position = "absolute";
        staging.style.visibility = "hidden";
        container.appendChild(staging);

        const wrapper = document.createElement("div");
        wrapper.addEventListener("mousedown", this._on_click.bind(this));

        this.wrapper = wrapper;
        this.table_clip = table_clip;
        this.staging = staging;
        this._container = container;
        this.virtual_panel = virtual_panel;
    }

    _calculate_row_range(container_height, nrows, preserve_scroll_position) {
        const total_scroll_height = Math.max(1, this.virtual_panel.offsetHeight - container_height);
        const percent_scroll = this._container.scrollTop / total_scroll_height;
        const virtual_panel_row_height = Math.floor(container_height / 19);
        const relative_nrows = preserve_scroll_position ? this._nrows : nrows;
        let start_row = Math.floor(Math.max(0, relative_nrows + this.table_model.header.cells.length - virtual_panel_row_height) * percent_scroll);
        let end_row = start_row + virtual_panel_row_height;
        if (end_row - 1 > nrows) {
            const offset = end_row - 1 - nrows;
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

    _calculate_column_range(container_width, column_paths) {
        const total_scroll_width = Math.max(1, this.virtual_panel.offsetWidth - container_width);
        const percent_left = this._container.scrollLeft / total_scroll_width;

        // TODO estimate is wrong - calc in chunks
        let start_col = Math.floor((column_paths.length - 1) * percent_left);
        let end_col = start_col + (this.table_model.num_columns() || 1);

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

    _needs_swap(force_redraw, invalid_row, invalid_column) {
        return (DOUBLE_BUFFER_RECREATE && force_redraw) || (DOUBLE_BUFFER_COLUMN && (invalid_column || force_redraw)) || (DOUBLE_BUFFER_ROW && (invalid_row || force_redraw));
    }

    _swap_in(...args) {
        if (this._needs_swap(...args)) {
            if (this.staging !== this.table_model.table.parentElement) {
                this.wrapper.replaceChild(this.table_model.table.cloneNode(true), this.table_model.table);
                this.staging.appendChild(this.table_model.table);
            }
        } else {
            if (this.wrapper !== this.table_model.table.parentElement) {
                this.wrapper.replaceChild(this.table_model.table, this.wrapper.children[0]);
            }
        }
        this.elem.dispatchEvent(new CustomEvent("perspective-datagrid-before-update", {detail: this}));
    }

    _swap_out(...args) {
        if (this._needs_swap(...args)) {
            this.wrapper.replaceChild(this.table_model.table, this.wrapper.children[0]);
        }

        this.elem.dispatchEvent(new CustomEvent("perspective-datagrid-after-update", {detail: this}));
    }

    _update_virtual_panel_width(container_width, force_redraw, column_paths) {
        if (force_redraw || this.virtual_panel.style.width === "") {
            const px_per_column = container_width / this.table_model.num_columns();
            const virtual_width = px_per_column * column_paths.length;
            this.virtual_panel.style.width = Math.max(this.table_model.table.offsetWidth, virtual_width) + "px";
        }
    }

    _update_virtual_panel_height(nrows) {
        const virtual_panel_px_size = Math.min(BROWSER_MAX_HEIGHT, (nrows + this.table_model.header.cells.length) * 19);
        this.virtual_panel.style.height = `${virtual_panel_px_size}px`;
    }

    /**
     * @returns
     * @memberof DatagridViewModel
     */
    async _on_scroll(event) {
        event.preventDefault();
        event.stopPropagation();
        event.returnValue = false;
        await this.draw(this.view);
        this.elem.dispatchEvent(new CustomEvent("perspective-datagrid-scroll"));
    }

    /**
     * Mousewheel must precalculate in addition to `_on_scroll` to prevent
     * visual artifacts due to scrolling "inertia" on modern browsers/mobile.
     *
     * @param {*} event
     * @memberof DatagridViewModel
     */
    _on_mousewheel(event) {
        event.preventDefault();
        event.returnValue = false;
        const total_scroll_height = Math.max(1, this.virtual_panel.offsetHeight - this._container.offsetHeight);
        const total_scroll_width = Math.max(1, this.virtual_panel.offsetWidth - this._container.offsetWidth);
        this._container.scrollTop = Math.min(total_scroll_height, this._container.scrollTop + event.deltaY);
        this._container.scrollLeft = Math.min(total_scroll_width, this._container.scrollLeft + event.deltaX);
        this._on_scroll(event);
    }

    resize() {
        this._container_width = undefined;
        this._container_height = undefined;
        this._nrows = undefined;
    }

    reset_scroll() {
        this.table_model.header.pinned_widths["|undefined"] = undefined;
        this._container.scrollTop = 0;
        this._container.scrollLeft = 0;
    }

    @throttlePromise
    async draw(view, force_redraw = false, preserve_scroll_position = false) {
        let start;
        if (DEBUG) {
            start = performance.now();
        }

        this.config = await view.get_config();

        const container_width = (this._container_width = this._container_width || this._container.offsetWidth);
        const container_height = (this._container_height = this._container_height || this._container.offsetHeight);

        const nrowsp = view.num_rows().catch(() => {});
        const column_pathsp = view.column_paths().catch(() => {});
        const schemap = view.schema().catch(() => {});
        const nrows = await nrowsp;
        const {start_row, end_row} = this._calculate_row_range(container_height, nrows, preserve_scroll_position);
        this._nrows = nrows;

        this._update_virtual_panel_height(nrows);

        if (nrows > 0) {
            const column_paths = await column_pathsp;
            let {start_col, end_col} = this._calculate_column_range(container_width, column_paths);
            const viewport = {start_col, end_col, start_row, end_row};
            let {invalid_row, invalid_column} = this._validate_viewport(viewport);
            if (force_redraw || invalid_row || invalid_column) {
                this._swap_in(force_redraw, invalid_row, invalid_column);
                const header_levels = this.config.column_pivots.length + 1;
                const row_levels = this.config.row_pivots.length;
                await this.table_model.draw(container_width, container_height, view, header_levels, row_levels, column_paths, schemap, viewport);
                this._swap_out(force_redraw, invalid_row, invalid_column);
                this._update_virtual_panel_width(container_width, force_redraw, column_paths);
            }
        }

        if (DEBUG) {
            LOG.push(performance.now() - start);
        }
    }

    attach(render_element) {
        if (render_element) {
            this.render_element = render_element;
        }
        if (!this.table_model) return;
        if (this.render_element) {
            if (this.render_element !== this.table_model.table.parentElement) {
                this.render_element.appendChild(this.wrapper);
            } else {
            }
        } else {
            this.appendChild(this.table_model.table);
        }
    }

    detach() {}

    async _on_click(event) {
        let element = event.target;
        while (element.tagName !== "TD" && event.tagName !== "TH") {
            element = element.parentElement;
            if (!this.wrapper.contains(element)) {
                return;
            }
        }
        const is_button = event.target.classList.contains("pd-row-header-icon");
        const metadata = METADATA_MAP.get(element);
        if (is_button) {
            if (metadata.is_open) {
                if (event.shiftKey) {
                    await this.view.set_depth(metadata.row_path.length - 1);
                } else {
                    await this.view.collapse(metadata.ridx);
                }
            } else if (metadata.is_open === false) {
                if (event.shiftKey) {
                    await this.view.set_depth(metadata.row_path.length);
                } else {
                    await this.view.expand(metadata.ridx);
                }
            }
            await this.draw(this.view, true, true);
        }
    }

    connectedCallback() {
        const pinned_widths = {};
        this.table_model = new DatagridTableViewModel(this.table_clip, pinned_widths);
        this.wrapper.appendChild(this.table_model.table);
        this.attach();
    }
}

window.customElements.define("perspective-datagrid", DatagridVirtualTableViewModel);

/******************************************************************************
 *
 * <perspective-viewer> integration
 *
 */

/**
 * <perspective-viewer> plugin.
 *
 * @class DatagridPlugin
 */
class DatagridPlugin {
    get name() {
        return "Datagrid";
    }

    get selectMode() {
        return "toggle";
    }

    get deselectMode() {
        return "pivots";
    }

    async update(div, view) {
        try {
            await div[PRIVATE].draw(view, true, true);
        } catch (e) {
            return;
        }
    }

    async create(div, view) {
        if (!div.hasOwnProperty(PRIVATE)) {
            const style = document.createElement("style");
            style.textContent = MATERIAL_STYLE;
            document.head.appendChild(style);
            div[PRIVATE] = document.createElement("perspective-datagrid");
            div[PRIVATE].set_element(this);
            div[PRIVATE].appendChild(document.createElement("slot"));
            div[PRIVATE].attach(this);
            div.appendChild(div[PRIVATE]);
        }

        // TODO only on schema change
        div[PRIVATE].reset_scroll();
        div[PRIVATE].view = view;
        await div[PRIVATE].draw(view, true);
    }

    async resize() {
        if (this.view && this._datavis[PRIVATE]) {
            this._datavis[PRIVATE].resize();
            await this._datavis[PRIVATE].draw(this.view);
        }
    }
}

registerPlugin("datagrid", new DatagridPlugin());
