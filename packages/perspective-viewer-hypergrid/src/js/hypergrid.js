/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import Hypergrid from "faux-hypergrid";
import Base from "faux-hypergrid/src/Base";
import Canvas from "faux-hypergrid/src/lib/Canvas";
import groupedHeaderPlugin from "fin-hypergrid-grouped-header-plugin";

import * as perspectivePlugin from "./perspective-plugin";
import PerspectiveDataModel from "./PerspectiveDataModel";
import {psp2hypergrid} from "./psp-to-hypergrid";

import {bindTemplate} from "@finos/perspective-viewer/dist/esm/utils.js";

import TEMPLATE from "../html/hypergrid.html";

import style from "../less/hypergrid.less";
import {get_styles, clear_styles, get_dynamic_styles, default_grid_properties} from "./styles.js";
import {set_formatters} from "./formatters.js";
import {set_editors} from "./editors.js";
import {treeLineRendererPaint} from "./hypergrid-tree-cell-renderer";

Canvas.prototype.stopResizeLoop();
Canvas.prototype.stopPaintLoop();

bindTemplate(
    TEMPLATE,
    style
)(
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
                Canvas.prototype.restartPaintLoop();
                this.grid = new Hypergrid(host, {DataModel: PerspectiveDataModel});
                Canvas.prototype.stopPaintLoop();
                host.removeAttribute("hidden");
                this.grid.get_styles = () => get_styles(this);
                this.grid.get_dynamic_styles = (...args) => get_dynamic_styles(this, ...args);

                const grid_properties = default_grid_properties();
                const styles = get_styles(this);
                grid_properties.renderer = ["SimpleCell", "Borders"];

                // Handle grouped header plugin bugs
                Object.assign(grid_properties.groupedHeader, styles[""].groupedHeader);
                if (typeof grid_properties.groupedHeader.flatHeight === "number") {
                    grid_properties.groupedHeader.flatHeight = grid_properties.groupedHeader.flatHeight.toString();
                }

                this.grid.installPlugins([perspectivePlugin, [groupedHeaderPlugin, grid_properties.groupedHeader]]);

                // Broken in fin-hypergrid-grouped-header 0.1.2
                let _old_paint = this.grid.cellRenderers.items.GroupedHeader.paint;
                this.grid.cellRenderers.items.GroupedHeader.paint = function(gc, config) {
                    this.visibleColumns = config.grid.renderer.visibleColumns;
                    return _old_paint.call(this, gc, config);
                };

                this.grid.addProperties(grid_properties);
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

const HYPERGRID_INSTANCE = Symbol("Hypergrid private");

async function grid_update(div, view, task) {
    const nrows = await view.num_rows();
    if (task.cancelled) {
        return;
    }
    const hypergrid = get_hypergrid.call(this);
    if (!hypergrid) {
        return;
    }
    const dataModel = hypergrid.behavior.dataModel;
    dataModel._view = view;
    dataModel._table = this._table;
    dataModel.setDirty(nrows);
    hypergrid.behaviorChanged();
    hypergrid.canvas.paintNow();
}

function style_element() {
    if (this[HYPERGRID_INSTANCE]) {
        const element = this[HYPERGRID_INSTANCE];
        clear_styles(element);
        const styles = get_styles(element);
        if (element.grid) {
            element.grid.addProperties(styles[""]);
        }
        element.grid.behavior.createColumns();
        element.grid.canvas.paintNow();
    }
}

function get_hypergrid() {
    return this[HYPERGRID_INSTANCE] ? this[HYPERGRID_INSTANCE].grid : undefined;
}

/**
 * Create a new <perspective-hypergrid> web component, and attach it to the DOM.
 *
 * @param {HTMLElement} div Attachment point.
 */
async function getOrCreateHypergrid(div) {
    let perspectiveHypergridElement;
    if (!get_hypergrid.call(this)) {
        perspectiveHypergridElement = this[HYPERGRID_INSTANCE] = document.createElement("perspective-hypergrid");
        perspectiveHypergridElement.setAttribute("tabindex", 1);
        perspectiveHypergridElement.addEventListener("blur", () => {
            if (perspectiveHypergridElement.grid && !perspectiveHypergridElement.grid._is_editing) {
                perspectiveHypergridElement.grid.selectionModel.clear(true); //keepRowSelections = true
                perspectiveHypergridElement.grid.paintNow();
            }
        });
    } else {
        perspectiveHypergridElement = this[HYPERGRID_INSTANCE];
    }

    if (!perspectiveHypergridElement.isConnected) {
        div.innerHTML = "";
        div.appendChild(perspectiveHypergridElement);
        await new Promise(resolve => setTimeout(resolve));
        perspectiveHypergridElement.grid.canvas.resize(false, true);
    }
    return perspectiveHypergridElement;
}

function suppress_paint(hypergrid, f) {
    const canvas = hypergrid.divCanvas;
    hypergrid.divCanvas = undefined;
    f();
    hypergrid.divCanvas = canvas;
}

async function grid_create(div, view, task, max_rows, max_cols, force) {
    let hypergrid = get_hypergrid.call(this);
    if (hypergrid) {
        hypergrid.behavior.dataModel._view = undefined;
        hypergrid.behavior.dataModel._table = undefined;
        suppress_paint(hypergrid, () => hypergrid.allowEvents(false));
    }

    const config = await view.get_config();

    if (task.cancelled) {
        return;
    }
    const colPivots = config.column_pivots;
    const rowPivots = config.row_pivots;
    const data_window = {
        start_row: 0,
        end_row: 1,
        id: rowPivots.length === 0 && colPivots.length === 0
    };

    const [nrows, json, schema, tschema, all_columns] = await Promise.all([view.num_rows(), view.to_columns(data_window), view.schema(), this._table.schema(), view.column_paths()]);

    if (task.cancelled) {
        return;
    }

    let perspectiveHypergridElement = await getOrCreateHypergrid.call(this, div);
    hypergrid = get_hypergrid.call(this);

    if (task.cancelled) {
        return;
    }

    const columns = all_columns.filter(x => x !== "__INDEX__");
    const dataModel = hypergrid.behavior.dataModel;
    dataModel._grid = hypergrid;

    dataModel.setIsTree(rowPivots.length > 0);
    dataModel.setDirty(nrows);
    dataModel.clearSelectionState();
    dataModel._view = view;
    dataModel._table = this._table;
    dataModel._config = config;
    dataModel._viewer = this;
    dataModel._columns = columns;
    dataModel._pad_window = this.hasAttribute("settings");

    hypergrid.renderer.needsComputeCellsBounds = true;
    suppress_paint(hypergrid, () => perspectiveHypergridElement.set_data(json, schema, tschema, rowPivots, columns, force));
    if (hypergrid.behavior.dataModel._outstanding) {
        await hypergrid.behavior.dataModel._outstanding.req;
    }

    await hypergrid.canvas.resize(true);
    hypergrid.allowEvents(true);
}

global.registerPlugin("hypergrid", {
    name: "Grid",
    create: grid_create,
    selectMode: "toggle",
    update: grid_update,
    deselectMode: "pivots",
    styleElement: style_element,
    resize: async function() {
        const hypergrid = get_hypergrid.call(this);
        if (hypergrid) {
            hypergrid.canvas.checksize();
            hypergrid.canvas.paintNow();
            let nrows = await this._view.num_rows();
            hypergrid.behavior.dataModel.setDirty(nrows);
            await hypergrid.canvas.resize(true);
            hypergrid.canvas.paintNow();
        }
    },
    delete: function() {
        const hypergrid = get_hypergrid.call(this);
        if (hypergrid) {
            hypergrid.terminate();
            hypergrid.div = undefined;
            hypergrid.canvas.div = undefined;
            hypergrid.canvas.canvas = undefined;
            hypergrid.sbVScroller = undefined;
            hypergrid.sbHScroller = undefined;
            delete this[HYPERGRID_INSTANCE];
        }
    }
});
