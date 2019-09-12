/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const Hypergrid = require("fin-hypergrid");
const Base = require("fin-hypergrid/src/Base");
const groupedHeaderPlugin = require("fin-hypergrid-grouped-header-plugin");

const perspectivePlugin = require("./perspective-plugin");
const PerspectiveDataModel = require("./PerspectiveDataModel");
const {psp2hypergrid, page2hypergrid} = require("./psp-to-hypergrid");

import {bindTemplate} from "@finos/perspective-viewer/dist/esm/utils.js";

const TEMPLATE = require("../html/hypergrid.html");

import style from "../less/hypergrid.less";
import {get_styles, clear_styles, default_grid_properties} from "./styles.js";
import {set_formatters} from "./formatters.js";
import {set_editors} from "./editors.js";
import {treeLineRendererPaint} from "./hypergrid-tree-cell-renderer";

bindTemplate(TEMPLATE, style)(
    class HypergridElement extends HTMLElement {
        set_data(data, schema, tschema, row_pivots, columns, force = false) {
            const hg_data = psp2hypergrid(data, schema, tschema, row_pivots, columns);
            if (this.grid) {
                this.grid.behavior.setPSP(hg_data, force);
            } else {
                this._hg_data = hg_data;
            }
        }

        connectedCallback() {
            if (!this.grid) {
                const host = this.shadowRoot.querySelector("#mainGrid");

                host.setAttribute("hidden", true);
                this.grid = new Hypergrid(host, {DataModel: PerspectiveDataModel});
                this.grid.canvas.stopResizeLoop();
                host.removeAttribute("hidden");
                this.grid.get_styles = () => get_styles(this);

                const grid_properties = default_grid_properties();
                this.grid.installPlugins([perspectivePlugin, [groupedHeaderPlugin, grid_properties.groupedHeader]]);

                // Broken in fin-hypergrid-grouped-header 0.1.2
                let _old_paint = this.grid.cellRenderers.items.GroupedHeader.paint;
                this.grid.cellRenderers.items.GroupedHeader.paint = function(gc, config) {
                    this.visibleColumns = config.grid.renderer.visibleColumns;
                    return _old_paint.call(this, gc, config);
                };

                this.grid.addProperties(grid_properties);
                const styles = get_styles(this);
                this.grid.addProperties(styles[""]);

                set_formatters(this.grid);
                set_editors(this.grid);

                // Add tree cell renderer
                this.grid.cellRenderers.add("TreeCell", Base.extend({paint: treeLineRendererPaint}));

                if (this._hg_data) {
                    this.grid.behavior.setPSP(this._hg_data);
                    delete this._hgdata;
                }
            }
        }
    }
);

const PRIVATE = Symbol("Hypergrid private");

async function grid_update(div, view, task) {
    const nrows = await view.num_rows();

    if (task.cancelled) {
        return;
    }
    const dataModel = this.hypergrid.behavior.dataModel;
    dataModel.setDirty(nrows);
    dataModel._view = view;
    dataModel._table = this._table;
    this.hypergrid.canvas.paintNow();
}

function style_element() {
    if (this[PRIVATE]) {
        const element = this[PRIVATE].grid;
        clear_styles(element);
        const styles = get_styles(element);
        if (element.grid) {
            element.grid.addProperties(styles[""]);
        }
        element.grid.behavior.createColumns();
        element.grid.canvas.paintNow();
    }
}
/**
 * Create a new <perspective-hypergrid> web component, and attach it to the DOM.
 *
 * @param {HTMLElement} div Attachment point.
 */
async function getOrCreateHypergrid(div) {
    let perspectiveHypergridElement;
    if (!this.hypergrid) {
        perspectiveHypergridElement = this[PRIVATE].grid = document.createElement("perspective-hypergrid");
        perspectiveHypergridElement.setAttribute("tabindex", 1);
        Object.defineProperty(this, "hypergrid", {
            configurable: true,
            get: () => (this[PRIVATE].grid ? this[PRIVATE].grid.grid : undefined)
        });
    } else {
        perspectiveHypergridElement = this[PRIVATE].grid;
    }

    if (!perspectiveHypergridElement.isConnected) {
        div.innerHTML = "";
        div.appendChild(perspectiveHypergridElement);
        await new Promise(resolve => setTimeout(resolve));
        perspectiveHypergridElement.grid.canvas.resize(false, true);
    }
    return perspectiveHypergridElement;
}

async function grid_create(div, view, task, max_rows, max_cols, force) {
    this[PRIVATE] = this[PRIVATE] || {};
    const hypergrid = this.hypergrid;
    if (hypergrid) {
        hypergrid.behavior.dataModel._view = undefined;
        hypergrid.behavior.dataModel._table = undefined;
    }

    const config = await view.get_config();

    if (task.cancelled) {
        return;
    }

    const colPivots = config.column_pivots;
    const rowPivots = config.row_pivots;
    const window = {
        start_row: 0,
        end_row: Math.max(colPivots.length + 1, rowPivots.length + 1),
        index: true
    };

    const [nrows, json, schema, tschema] = await Promise.all([view.num_rows(), view.to_columns(window), view.schema(), this._table.schema()]);

    if (task.cancelled) {
        return;
    }

    let perspectiveHypergridElement = await getOrCreateHypergrid.call(this, div);

    if (task.cancelled) {
        return;
    }

    const dataModel = this.hypergrid.behavior.dataModel;
    let columns = Object.keys(json).filter(x => x !== "__INDEX__");

    dataModel.setIsTree(rowPivots.length > 0);
    dataModel.setDirty(nrows);
    dataModel._view = view;
    dataModel._table = this._table;
    dataModel._config = config;
    dataModel._viewer = this;

    dataModel.pspFetch = async range => {
        range.end_row += this.hasAttribute("settings") ? 8 : 2;
        range.end_col += rowPivots && rowPivots.length > 0 ? 1 : 0;
        range.index = true;
        let next_page = await dataModel._view.to_columns(range);
        if (columns.length === 0) {
            columns = Object.keys(await view.to_columns(window));
        }
        dataModel.data = [];
        const rows = page2hypergrid(next_page, rowPivots, columns);
        const base = range.start_row;
        const data = dataModel.data;
        rows.forEach((row, offset) => (data[base + offset] = row));
    };

    perspectiveHypergridElement.set_data(json, schema, tschema, rowPivots, columns, force);
    this.hypergrid.renderer.computeCellsBounds(true);
    await this.hypergrid.canvas.resize(true);
    this.hypergrid.canvas.paintNow();
    this.hypergrid.canvas.paintNow();
}

global.registerPlugin("hypergrid", {
    name: "Grid",
    create: grid_create,
    selectMode: "toggle",
    update: grid_update,
    deselectMode: "pivots",
    styleElement: style_element,
    resize: async function() {
        if (this.hypergrid) {
            this.hypergrid.canvas.checksize();
            this.hypergrid.canvas.paintNow();
            let nrows = await this._view.num_rows();
            this.hypergrid.behavior.dataModel.setDirty(nrows);
            this.hypergrid.canvas.paintNow();
        }
    },
    delete: function() {
        if (this.hypergrid) {
            this.hypergrid.terminate();
            this.hypergrid.div = undefined;
            this.hypergrid.canvas.div = undefined;
            this.hypergrid.canvas.canvas = undefined;
            this.hypergrid.sbVScroller = undefined;
            this.hypergrid.sbHScroller = undefined;
            delete this[PRIVATE]["grid"];
        }
    }
});
