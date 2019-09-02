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
const {cloneDeep} = require("lodash");

import {bindTemplate} from "@finos/perspective-viewer/dist/esm/utils.js";

const TEMPLATE = require("../html/hypergrid.html");

import style from "../less/hypergrid.less";
import {get_styles, clear_styles} from "./styles.js";
import {set_formatters} from "./formatters.js";
import {treeLineRendererPaint} from "./hypergrid-tree-cell-renderer";

const COLUMN_HEADER_FONT = "12px Helvetica, sans-serif";
const GROUP_LABEL_FONT = "12px Open Sans, sans-serif";

const base_grid_properties = {
    autoSelectRows: false,
    cellPadding: 5,
    cellSelection: false,
    columnSelection: false,
    rowSelection: false,
    checkboxOnlyRowSelections: false,
    columnClip: true,
    columnHeaderFont: COLUMN_HEADER_FONT,
    columnHeaderForegroundSelectionFont: '12px "Arial", Helvetica, sans-serif',
    columnsReorderable: false,
    defaultRowHeight: 24,
    editable: false,
    editOnKeydown: true,
    editor: "textfield",
    editorActivationKeys: ["alt", "esc"],
    enableContinuousRepaint: false,
    fixedColumnCount: 0,
    fixedRowCount: 0,
    fixedLinesHWidth: 1,
    fixedLinesVWidth: 1,
    font: '12px "Arial", Helvetica, sans-serif',
    foregroundSelectionFont: '12px "Arial", Helvetica, sans-serif',
    gridLinesH: false,
    gridLinesV: true, // except: due to groupedHeaderPlugin's `clipRuleLines: true` option, only header row displays these lines
    gridLinesUserDataArea: false, // restricts vertical rule line rendering to header row only
    halign: "left",
    headerTextWrapping: false,
    hoverColumnHighlight: {enabled: false},
    hoverRowHighlight: {
        enabled: true,
        backgroundColor: "#555"
    },
    hoverCellHighlight: {
        enabled: true,
        backgroundColor: "#333"
    },
    noDataMessage: "",
    minimumColumnWidth: 50,
    multipleSelections: false,
    renderFalsy: false,
    rowHeaderFont: "12px Arial, Helvetica, sans-serif",
    rowHeaderForegroundSelectionFont: '12px "Arial", Helvetica, sans-serif',
    rowResize: true,
    scrollbarHoverOff: "visible",
    rowHeaderCheckboxes: false,
    rowHeaderNumbers: false,
    showFilterRow: true,
    showHeaderRow: true,
    showTreeColumn: false,
    singleRowSelectionMode: false,
    sortColumns: [],
    sortOnDoubleClick: true,
    treeRenderer: "TreeCell",
    treeHeaderFont: "12px Arial, Helvetica, sans-serif",
    treeHeaderForegroundSelectionFont: '12px "Arial", Helvetica, sans-serif',
    useBitBlit: false,
    vScrollbarClassPrefix: "",
    voffset: 0
};

const light_theme_overrides = {
    backgroundColor: "#ffffff",
    color: "#666",
    lineColor: "#AAA",
    // font: '12px Arial, Helvetica, sans-serif',
    font: '12px "Open Sans", Helvetica, sans-serif',
    foregroundSelectionFont: "12px amplitude-regular, Helvetica, sans-serif",
    foregroundSelectionColor: "#666",
    backgroundSelectionColor: "rgba(162, 183, 206, 0.3)",
    selectionRegionOutlineColor: "rgb(45, 64, 85)",
    columnHeaderColor: "#666",
    columnHeaderHalign: "left", // except: group header labels always 'center'; numbers always 'right' per `setPSP`
    columnHeaderBackgroundColor: "#fff",
    columnHeaderForegroundSelectionColor: "#333",
    columnHeaderBackgroundSelectionColor: "#40536d",
    rowHeaderForegroundSelectionFont: "12px Arial, Helvetica, sans-serif",
    treeHeaderColor: "#666",
    treeHeaderBackgroundColor: "#fff",
    treeHeaderForegroundSelectionColor: "#333",
    treeHeaderBackgroundSelectionColor: "#40536d",
    hoverCellHighlight: {
        enabled: true,
        backgroundColor: "#eeeeee"
    },
    hoverRowHighlight: {
        enabled: true,
        backgroundColor: "#f6f6f6"
    }
};

function generateGridProperties(overrides) {
    return Object.assign({}, cloneDeep(base_grid_properties), cloneDeep(overrides));
}

bindTemplate(TEMPLATE, style)(
    class HypergridElement extends HTMLElement {
        set_data(data, schema, tschema, row_pivots, columns) {
            const hg_data = psp2hypergrid(data, schema, tschema, row_pivots, columns);
            if (this.grid) {
                this.grid.behavior.setPSP(hg_data);
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

                // window.g = this.grid; window.p = g.properties; // for debugging convenience in console

                this.grid.installPlugins([
                    perspectivePlugin,
                    [
                        groupedHeaderPlugin,
                        {
                            paintBackground: null, // no group header label decoration
                            columnHeaderLines: false, // only draw vertical rule lines between group labels
                            groupConfig: [
                                {
                                    halign: "center", // center group labels
                                    font: GROUP_LABEL_FONT
                                }
                            ]
                        }
                    ]
                ]);

                // Broken in fin-hypergrid-grouped-header 0.1.2
                let _old_paint = this.grid.cellRenderers.items.GroupedHeader.paint;
                this.grid.cellRenderers.items.GroupedHeader.paint = function(gc, config) {
                    this.visibleColumns = config.grid.renderer.visibleColumns;
                    return _old_paint.call(this, gc, config);
                };

                const grid_properties = generateGridProperties(light_theme_overrides);

                grid_properties["showRowNumbers"] = grid_properties["showCheckboxes"] || grid_properties["showRowNumbers"];
                this.grid.addProperties(grid_properties);
                const styles = get_styles(this);
                this.grid.addProperties(styles[""]);

                set_formatters(this.grid);

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

async function grid_create(div, view, task) {
    this[PRIVATE] = this[PRIVATE] || {};
    const hypergrid = this.hypergrid;
    if (hypergrid) {
        hypergrid.behavior.dataModel._view = undefined;
    }

    const config = await view.get_config();

    if (task.cancelled) {
        return;
    }

    const colPivots = config.column_pivots;
    const rowPivots = config.row_pivots;
    const window = {
        start_row: 0,
        end_row: Math.max(colPivots.length + 1, rowPivots.length + 1)
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
    let columns = Object.keys(json);

    dataModel.setIsTree(rowPivots.length > 0);
    dataModel.setDirty(nrows);
    dataModel._view = view;
    dataModel._config = config;
    dataModel._viewer = this;

    dataModel.pspFetch = async range => {
        range.end_row += this.hasAttribute("settings") ? 8 : 2;
        range.end_col += rowPivots && rowPivots.length > 0 ? 1 : 0;
        let next_page = await dataModel._view.to_columns(range);
        if (columns.length === 0) {
            columns = Object.keys(await view.to_columns(window));
        }
        dataModel.data = [];
        const rows = page2hypergrid(next_page, rowPivots, columns);
        const data = dataModel.data;
        const base = range.start_row;
        rows.forEach((row, offset) => (data[base + offset] = row));
    };

    perspectiveHypergridElement.set_data(json, schema, tschema, rowPivots, columns);
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
