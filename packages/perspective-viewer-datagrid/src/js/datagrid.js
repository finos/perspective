/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {registerPlugin} from "@finos/perspective-viewer/dist/esm/utils.js";
import {get_type_config} from "@finos/perspective/dist/esm/config";

const DEBUG = true;

const DOUBLE_BUFFER = true;

// The largest size virtual <div> in (px) that Chrome can support without
// glitching.
const CHROME_FUCKUP_LIMIT = 10000000;

const PRIVATE = Symbol("Private Datagrid");

const CONTAINER_STYLE = `
div.pd-scroll-container {
    position:absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    bottom: 12px;
    overflow:auto;
}
div.pd-virtual-panel {
    position:absolute;
    top:0;
    left:0;
    right:0;
    pointer-events:none;
}
div.pd-scroll-table-clip {
    position:absolute;
    overflow:hidden;
    width:100%;
    height:100%
}
slot {
    position:absolute;
    overflow:hidden;
}`.replace(/\s+?/, " ");

const TYPE_STYLE = `
th {
    text-align: center;
}
thead tr:last-child th.float, tbody td.float {
    text-align: right;
}
thead tr:last-child th.integer, tbody td.integer {
    text-align: right;
    color: #1a7da1;
}
thead tr:last-child th.string, tbody td.string {
    text-align: left;
}`.replace(/\s+?/, " ");

const TABLE_STYLE = `
.pd-group-header {
    border-right: 1px solid #aaa;
}
td {
    white-space: nowrap;
    font-size: 12px;
    padding-right: 8px;
}
tr:last-child th {
    border-bottom: 1px solid #aaa;
}
th { 
    white-space: nowrap;
    font-size: 12px;
    padding-right: 8px;
}
tr:not(:last-child) th {
    border-right: 1px solid #aaa;
}
tr:hover{
    background-color:#eee;
    transition:none
}
tr{
    transition:background-color 0.2s ease-in;
}
table * {
    box-sizing: border-box;
}
table {
    position:absolute;
    overflow:hidden;
}`.replace(/\s+?/, " ");

/******************************************************************************
 *
 * Utilities
 *
 */

/**
 * Debounce class async method deocator locks and conflates methods calls.
 *
 */
function debounce(_target, _property, descriptor) {
    const func = descriptor.value;
    descriptor.value = new_func;
    return descriptor;

    async function new_func(...args) {
        if (this.lock) {
            try {
                await this.lock;
            } catch (e) {
                // TODO handle `task`
                console.error(e);
            }
        }
        if (this.lock) {
            return;
        }
        try {
            this.lock = func.call(this, ...args);
            await this.lock;
            this.lock = undefined;
        } catch (e) {
            // TODO handle `task`
            console.error(e);
        } finally {
            this.lock = undefined;
        }
    }
}

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

function _log_fps() {
    const avg = this._log.reduce((x, y) => x + y, 0) / this._log.length;
    console.log([`${avg.toFixed(2)} ms/frame`, `${this._log.length / 5} rfps`, `${(1000 / avg).toFixed(2)} vfps`, `(${this._log.length} frames in 5s)`].join("   "));
    this._log = [];
}

function _tree_header(td, path) {
    if (path.length > 0) {
        const name = path[path.length - 1];
        //const len = Math.max(0, path.length) * 24;
        td.innerHTML = `${name}`;
    } else {
        td.innerHTML = "TOTAL";
    }
    td.classList.add("pd-group-header");
}

/******************************************************************************
 *
 * View Model
 *
 */

class ViewModel {
    @memoize
    _format(type) {
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
                    td.innerHTML = func.format(path);
                }
            };
        } else if (type === undefined) {
            return {format: _tree_header};
        }
    }

    constructor(container, table) {
        //    super();
        this._container = container;
        this.table = table;
        this.cells = [];
        this.rows = [];
        this.cells = [];
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
    constructor(pinned_widths, ...args) {
        super(...args);
        this.pinned_widths = pinned_widths;
    }

    pin_cell_widths() {
        let {tr} = this._get_row(this.rows.length - 1);
        for (let i = 0; i < tr.children.length; i++) {
            const th = tr.children[i];
            const name = th.column_name;
            const new_width = Math.min(1000, th.offsetWidth) + "px";
            this.pinned_widths[name] = new_width;
        }
    }

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
        //th.classList.add(type);
        if (this.pinned_widths[column_name]) {
            th.style.minWidth = this.pinned_widths[column_name];
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
    _draw_td(ridx, cidx, val, type) {
        const {tr, row_container} = this._get_row(ridx);
        const td = this._get_cell("td", row_container, cidx, tr);
        td.className = type;
        if (val === undefined || val === null) {
            td.textContent = "-";
        } else {
            const formatter = this._format(type);
            if (formatter) {
                formatter.format(td, val);

                // TODO hack
                td.value = Array.isArray(val) ? val[val.length - 1] : val;
                td.row_path = val;
            } else {
                td.textContent = val;
                td.value = val;
            }
        }

        return td;
    }

    draw(container_height, cidx, column_data, type) {
        let ridx = 0;
        let td;

        for (const val of column_data) {
            td = this._draw_td(ridx++, cidx, val, type);

            // TODO slice rows external
            if (ridx * 19 > container_height) {
                break;
            }
        }
        return {offsetWidth: td.offsetWidth, cidx, ridx};
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
        table.style.display = "none";

        const thead = document.createElement("thead");
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        table.appendChild(tbody);

        this.table = table;
        this.header = new DatagridHeaderViewModel(pinned_widths, table_clip, thead);
        this.body = new DatagridBodyViewModel(table_clip, tbody);
    }

    set_offscreen() {
        this._old = this.table.style.left;
        this.table.style.left = "-100000px";
        this.table.style.display = "";
    }

    set_active() {
        this.table.style.display = "";
        this.table.style.left = this._old;
    }

    set_inactive() {
        this.table.style.display = "none";
    }

    num_columns() {
        // TODO expensive
        return this.header._get_row(Math.max(0, this.header.rows.length - 1)).row_container.length;
    }

    width() {
        return this.table.offsetWidth;
    }

    async draw(container_width, container_height, view, header_levels, column_paths, schemap, viewport) {
        const column_datap = view.to_columns(viewport);

        // TODO use start index instead
        const visible_columns = column_paths.slice(viewport.start_col);
        const schema = await schemap;
        const columns_data = await column_datap;
        let cont_body,
            cont_head,
            cidx = 0,
            width = 0;

        if (column_paths[0] === "__ROW_PATH__") {
            cont_head = this.header.draw(header_levels, "");
            cont_body = this.body.draw(container_height, cidx, columns_data["__ROW_PATH__"]);
            width += cont_body.offsetWidth;
            cidx++;
        }

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
            cont_body = this.body.draw(container_height, cidx, column_data, type);
            width += cont_body.offsetWidth;
            cidx++;

            if (width > container_width) {
                break;
            }
        }

        this.body.clean({ridx: cont_body.ridx, cidx});
        this.header.clean(cont_head);

        this.header.pin_cell_widths();
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

        if (DEBUG) {
            this._log = [];
            setInterval(_log_fps.bind(this), 5000);
        }
    }

    set_element(elem) {
        this.elem = elem;
    }

    _create_dom_model() {
        // TODO singleton
        this.attachShadow({mode: "open"});
        const style = document.createElement("style");
        style.textContent = CONTAINER_STYLE;
        this.shadowRoot.appendChild(style);

        const virtual_panel = document.createElement("div");
        virtual_panel.classList.add("pd-virtual-panel");

        const table_clip = document.createElement("div");
        table_clip.classList.add("pd-scroll-table-clip");

        const container = document.createElement("div");
        container.classList.add("pd-scroll-container");
        container.appendChild(virtual_panel);
        container.appendChild(table_clip);
        container.addEventListener("scroll", this._on_scroll.bind(this));
        container.addEventListener("mousewheel", this._on_mousewheel.bind(this));

        const slot = document.createElement("slot");
        table_clip.appendChild(slot);

        this.shadowRoot.appendChild(container);

        this.table_clip = table_clip;
        this._container = container;
        this.virtual_panel = virtual_panel;
    }

    _calculate_row_range(container_height, nrows) {
        const total_scroll_height = Math.max(1, this.virtual_panel.offsetHeight - container_height);
        const percent_scroll = this._container.scrollTop / total_scroll_height;
        const virtual_panel_row_height = Math.floor(container_height / 19);
        const start_row = Math.floor(Math.max(0, nrows + this.table_model.header.cells.length - virtual_panel_row_height) * percent_scroll);
        const end_row = start_row + virtual_panel_row_height + 10;
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

    _swap_in(invalid_column) {
        if (DOUBLE_BUFFER && invalid_column) {
            const old = this.table_model;
            this.table_model = this.table_model2;
            this.table_model2 = old;
            this.table_model.set_offscreen();
            this.attach();
        }
        this.elem.dispatchEvent(new CustomEvent("perspective-datagrid-before-update"));
    }

    _swap_out(invalid_column) {
        this.elem.dispatchEvent(new CustomEvent("perspective-datagrid-after-update"));
        if (DOUBLE_BUFFER && invalid_column) {
            this.table_model2.set_inactive();
            this.detach();
            this.table_model.set_active();
        }
    }

    _update_virtual_panel_width(container_width, force_redraw, column_paths) {
        if (force_redraw || this.virtual_panel.style.width === "") {
            const px_per_column = container_width / this.table_model.num_columns();
            const virtual_width = px_per_column * column_paths.length;
            this.virtual_panel.style.width = Math.max(this.table_model.width(), virtual_width) + "px";
        }
    }

    /**
     * When `pd-scroll-container` scrolls, we need to move the `table`
     * immediately to match the viewport, then call `_on_scroll` to override
     * the Browser's default scrolling render.
     *
     * @returns
     * @memberof DatagridViewModel
     */
    async _on_scroll() {
        const {virtual_panel, _container, table_clip} = this;
        const total_scroll_height = Math.max(1, virtual_panel.offsetHeight - _container.offsetHeight);
        const new_top = Math.min(total_scroll_height, _container.scrollTop) + "px";

        const total_scroll_width = Math.max(1, virtual_panel.offsetWidth - _container.offsetWidth);
        const new_left = Math.min(total_scroll_width, _container.scrollLeft) + "px";

        if (table_clip.top !== new_top || table_clip.left !== new_left) {
            table_clip.style.top = new_top;
            table_clip.style.left = new_left;
            await this.draw(this.view);
            this.elem.dispatchEvent(new CustomEvent("perspective-datagrid-scroll"));
        }
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
        const total_scroll_height = Math.max(1, this.virtual_panel.offsetHeight - this._container.offsetHeight);
        const total_scroll_width = Math.max(1, this.virtual_panel.offsetWidth - this._container.offsetWidth);
        this._container.scrollTop = Math.min(total_scroll_height, this._container.scrollTop + event.deltaY);
        this._container.scrollLeft = Math.min(total_scroll_width, this._container.scrollLeft + event.deltaX);
        this._on_scroll();
    }

    resize() {
        this._container_width = undefined;
        this._container_height = undefined;
    }

    reset_scroll() {
        this._container.scrollTop = 0;
        this._container.scrollLeft = 0;
    }

    @debounce
    async draw(view, force_redraw = false) {
        let start;
        if (DEBUG) {
            start = performance.now();
        }

        this.view = view;
        this.config = await view.get_config();

        const container_width = (this._container_width = this._container_width || this._container.offsetWidth);
        const container_height = (this._container_height = this._container_height || this._container.offsetHeight);

        const nrowsp = view.num_rows();
        const column_pathsp = view.column_paths();
        const schemap = view.schema();
        const nrows = await nrowsp;
        const {start_row, end_row} = this._calculate_row_range(container_height, nrows);
        const virtual_panel_px_size = Math.min(CHROME_FUCKUP_LIMIT, (nrows + this.table_model.header.cells.length) * 19);
        this.virtual_panel.style.height = `${virtual_panel_px_size}px`;

        if (nrows > 0) {
            const column_paths = await column_pathsp;
            let {start_col, end_col} = this._calculate_column_range(container_width, column_paths);
            const viewport = {start_col, end_col, start_row, end_row};
            let {invalid_row, invalid_column} = this._validate_viewport(viewport);
            if (force_redraw || invalid_row || invalid_column) {
                this._swap_in(invalid_column);
                const header_levels = this.config.column_pivots.length + 1;
                await this.table_model.draw(container_width, container_height, view, header_levels, column_paths, schemap, viewport);

                this._swap_out(invalid_column);
                this._update_virtual_panel_width(container_width, force_redraw, column_paths);
            }
        }

        if (DEBUG) {
            this._log.push(performance.now() - start);
        }
    }

    attach(render_element) {
        if (render_element) {
            this.render_element = render_element;
        }
        if (!this.table_model) return;
        if (this.render_element) {
            this.render_element.appendChild(this.table_model.table);
        } else {
            this.appendChild(this.table_model.table);
        }
    }

    detach() {
        this.shadowRoot.appendChild(this.table_model2.table);
    }

    connectedCallback() {
        const pinned_widths = {};
        this.table_model = new DatagridTableViewModel(this.table_clip, pinned_widths);
        this.table_model.set_active();
        this.attach();

        if (DOUBLE_BUFFER) {
            this.table_model2 = new DatagridTableViewModel(this.table_clip, pinned_widths);
            this.detach();
        }
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
        await DatagridPlugin.prototype.create(div, view);
    }

    async create(div, view) {
        if (!div.hasOwnProperty(PRIVATE)) {
            const style = document.createElement("style");
            style.textContent = [TABLE_STYLE, TYPE_STYLE].join("");
            document.head.appendChild(style);
            div[PRIVATE] = document.createElement("perspective-datagrid");
            div[PRIVATE].set_element(this);
            div[PRIVATE].appendChild(document.createElement("slot"));
            div[PRIVATE].attach(this);

            div.appendChild(div[PRIVATE]);
        }

        // TODO only on schema change
        div[PRIVATE].reset_scroll();
        try {
            await div[PRIVATE].draw(view, true);
            div[PRIVATE]._failed = false;
        } catch (e) {
            return;
        }
    }

    async resize() {
        if (this._datavis[PRIVATE]?._failed) {
            console.warn("Attempting to render during failure, ignoring");
            return;
        }
        if (this.view)
            try {
                this._datavis[PRIVATE].resize();
                await this._datavis[PRIVATE].draw(this.view);
            } catch (e) {
                this._datavis[PRIVATE]._failed = true;
                return;
            }
    }
}

registerPlugin("datagrid", new DatagridPlugin());
