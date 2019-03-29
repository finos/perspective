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

const Range = require("./Range");
const perspectivePlugin = require("./perspective-plugin");
const PerspectiveDataModel = require("./PerspectiveDataModel");
const treeLineRendererPaint = require("./hypergrid-tree-cell-renderer").treeLineRendererPaint;
const {psp2hypergrid} = require("./psp-to-hypergrid");

import {bindTemplate} from "@jpmorganchase/perspective-viewer/cjs/js/utils.js";

const TEMPLATE = require("../html/hypergrid.html");

import style from "../less/hypergrid.less";

const COLUMN_HEADER_FONT = "12px amplitude-regular, Helvetica, sans-serif";
const GROUP_LABEL_FONT = "12px Open Sans, sans-serif"; // overrides COLUMN_HEADER_FONT for group labels

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
    return Object.assign({}, base_grid_properties, overrides);
}

function null_formatter(formatter, null_value = "") {
    let old = formatter.format.bind(formatter);
    formatter.format = val => {
        if (typeof val === "string") {
            return val;
        }
        if (null_value === val) {
            return "-";
        }
        let x = old(val);
        if (x === "") {
            return "-";
        }
        return x;
    };

    return formatter;
}

bindTemplate(TEMPLATE, style)(
    class HypergridElement extends HTMLElement {
        set_data(data, hidden, schema, tschema, row_pivots) {
            const hg_data = psp2hypergrid(data, hidden, schema, tschema, row_pivots);
            if (this.grid) {
                this.grid.behavior.setPSP(hg_data);
            } else {
                this._hg_data = hg_data;
            }
        }

        get_style(name) {
            if (window.ShadyCSS) {
                return window.ShadyCSS.getComputedStyleValue(this, name);
            } else {
                return getComputedStyle(this).getPropertyValue(name);
            }
        }

        connectedCallback() {
            if (!this.grid) {
                const host = this.shadowRoot.querySelector("#mainGrid");

                host.setAttribute("hidden", true);
                this.grid = new Hypergrid(host, {DataModel: PerspectiveDataModel});
                this.grid.canvas.stopResizeLoop();
                host.removeAttribute("hidden");

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

                const grid_properties = generateGridProperties(Hypergrid._default_properties || light_theme_overrides);

                grid_properties["showRowNumbers"] = grid_properties["showCheckboxes"] || grid_properties["showRowNumbers"];
                grid_properties["treeHeaderBackgroundColor"] = grid_properties["backgroundColor"] = this.get_style("--hypergrid-tree-header--background");
                grid_properties["treeHeaderColor"] = grid_properties["color"] = this.get_style("--hypergrid-tree-header--color");
                grid_properties["columnHeaderBackgroundColor"] = this.get_style("--hypergrid-header--background");
                grid_properties["columnHeaderSeparatorColor"] = this.get_style("--hypergrid-separator--color");
                grid_properties["columnHeaderColor"] = this.get_style("--hypergrid-header--color");

                grid_properties["columnColorNumberPositive"] = this.get_style("--hypergrid-positive--color");
                grid_properties["columnColorNumberNegative"] = this.get_style("--hypergrid-negative--color");
                grid_properties["columnBackgroundColorNumberPositive"] = this.get_style("--hypergrid-positive--background");
                grid_properties["columnBackgroundColorNumberNegative"] = this.get_style("--hypergrid-negative--background");

                const font = `${this.get_style("--hypergrid--font-size")} ${this.get_style("--hypergrid--font-family")}`;
                const headerfont = `${this.get_style("--hypergrid-header--font-size")} ${this.get_style("--hypergrid-header--font-family")}`;

                grid_properties["columnHeaderFont"] = headerfont;
                grid_properties["font"] = font;
                grid_properties["rowHeaderFont"] = font;
                grid_properties["treeHeaderFont"] = font;

                grid_properties["hoverRowHighlight"]["backgroundColor"] = this.get_style("--hypergrid-row-hover--background");
                grid_properties["hoverRowHighlight"]["color"] = this.get_style("--hypergrid-row-hover--color");
                grid_properties["hoverCellHighlight"]["backgroundColor"] = this.get_style("--hypergrid-cell-hover--background");
                grid_properties["hoverCellHighlight"]["color"] = this.get_style("--hypergrid-cell-hover--color");

                this.grid.addProperties(grid_properties);

                this.grid.localization.header = {
                    format: value => this.grid.behavior.formatColumnHeader(value)
                };

                // Add tree cell renderer
                this.grid.cellRenderers.add("TreeCell", Base.extend({paint: treeLineRendererPaint}));

                const float_formatter = null_formatter(
                    new this.grid.localization.NumberFormatter("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })
                );
                this.grid.localization.add("FinanceFloat", float_formatter);

                const integer_formatter = null_formatter(new this.grid.localization.NumberFormatter("en-US", {}));
                this.grid.localization.add("FinanceInteger", integer_formatter);

                const datetime_formatter = null_formatter(
                    new this.grid.localization.DateFormatter("en-us", {
                        week: "numeric",
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric"
                    }),
                    -1
                );

                const date_formatter = null_formatter(
                    new this.grid.localization.DateFormatter("en-us", {
                        week: "numeric",
                        year: "numeric",
                        month: "numeric",
                        day: "numeric"
                    }),
                    -1
                );
                this.grid.localization.add("FinanceDatetime", datetime_formatter);
                this.grid.localization.add("FinanceDate", date_formatter);

                this.grid.localization.add("FinanceTree", {
                    format: function(val, type) {
                        const f = {
                            date: date_formatter,
                            datetime: datetime_formatter,
                            integer: integer_formatter,
                            float: float_formatter
                        }[type];
                        if (f) {
                            return f.format(val);
                        }
                        return val;
                    },
                    parse: x => x
                });

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

    if (!document.body.contains(perspectiveHypergridElement)) {
        div.innerHTML = "";
        div.appendChild(perspectiveHypergridElement);
        await new Promise(resolve => setTimeout(resolve));
    }
    return perspectiveHypergridElement;
}

async function grid_create(div, view, task) {
    this[PRIVATE] = this[PRIVATE] || {};

    const hidden = this._get_view_hidden();
    const config = await view.get_config();

    if (task.cancelled) {
        return;
    }

    const colPivots = config.column_pivot;
    const [nrows, json, schema, tschema] = await Promise.all([view.num_rows(), view.to_columns(Range.create(0, colPivots.length + 1)), view.schema(), this._table.schema()]);

    if (task.cancelled) {
        return;
    }

    let perspectiveHypergridElement = await getOrCreateHypergrid.call(this, div);

    if (task.cancelled) {
        return;
    }

    const dataModel = this.hypergrid.behavior.dataModel;
    const rowPivots = config.row_pivot;

    dataModel.setRowCount(nrows);
    dataModel.setIsTree(!!rowPivots.length);
    dataModel.setDirty(nrows);
    dataModel._view = view;
    dataModel._config = config;

    dataModel.pspFetch = async range => {
        range.end_row += this.hasAttribute("settings") ? 8 : 2;
        let next_page = await dataModel._view.to_columns(range);
        dataModel.data = [];
        const rows = psp2hypergrid(next_page, hidden, schema, tschema, rowPivots).rows;
        const data = dataModel.data;
        const base = range.start_row;
        rows.forEach((row, offset) => (data[base + offset] = row));
    };

    perspectiveHypergridElement.set_data(json, hidden, schema, tschema, rowPivots);
    this.hypergrid.canvas.paintNow();
    let running = true;
    while (nrows > 0 && running) {
        running = await new Promise(resolve => dataModel.fetchData(undefined, resolve));
        if (running) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    this.hypergrid.canvas.resize();
}

global.registerPlugin("hypergrid", {
    name: "Grid",
    create: grid_create,
    selectMode: "toggle",
    update: grid_update,
    deselectMode: "pivots",
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
