/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "./polyfills/index";
import charts from "../charts/charts";
import { initialiseStyles } from "../series/colorStyles";
import style from "../../less/chart.less";

import * as d3 from "d3";

const DEFAULT_PLUGIN_SETTINGS = {
    initial: {
        type: "number",
        count: 1,
    },
    selectMode: "select",
};

const styleWithD3FC = `${style}${getD3FCStyles()}`;
const EXCLUDED_SETTINGS = [
    "crossValues",
    "mainValues",
    "realValues",
    "splitValues",
    "filter",
    "data",
    "size",
    "colorStyles",
    "textStyles",
    "agg_paths",
    "treemaps",
];

function getD3FCStyles() {
    const headerStyles = document
        .querySelector("head")
        .querySelectorAll("style");
    const d3fcStyles = [];
    headerStyles.forEach((s) => {
        if (s.innerText.indexOf("d3fc-") !== -1) {
            d3fcStyles.push(s.innerText);
        }
    });
    return d3fcStyles.join("");
}

function register_element(plugin_name) {
    customElements.get("perspective-viewer").registerPlugin(plugin_name);
}

export function register(...plugins) {
    plugins = new Set(
        plugins.length > 0 ? plugins : charts.map((chart) => chart.plugin.name)
    );
    charts.forEach((chart) => {
        if (plugins.has(chart.plugin.name)) {
            const name = chart.plugin.name
                .toLowerCase()
                .replace(/[ \t\r\n\/]*/g, "");
            const plugin_name = `perspective-viewer-d3fc-${name}`;
            customElements.define(
                plugin_name,
                class extends HTMLElement {
                    constructor() {
                        super();
                        this._chart = null;
                        this._settings = null;
                        this.render_warning = true;
                    }

                    connectedCallback() {
                        if (!this._initialized) {
                            this.attachShadow({ mode: "open" });
                            this.shadowRoot.innerHTML = `<style>${styleWithD3FC}</style>`;
                            this.shadowRoot.innerHTML += `<div id="container" class="chart"></div>`;
                            this._container =
                                this.shadowRoot.querySelector(".chart");
                            this._initialized = true;
                        }
                    }

                    get name() {
                        return chart.plugin.name;
                    }

                    get category() {
                        return chart.plugin.category;
                    }

                    get select_mode() {
                        return chart.plugin.selectMode || "select";
                    }

                    get min_config_columns() {
                        return (
                            chart.plugin.initial?.count ||
                            DEFAULT_PLUGIN_SETTINGS.initial.count
                        );
                    }

                    get config_column_names() {
                        return (
                            chart.plugin.initial?.names ||
                            DEFAULT_PLUGIN_SETTINGS.initial.names
                        );
                    }

                    // get initial() {
                    //     return chart.plugin.initial
                    //        || DEFAULT_PLUGIN_SETTINGS.initial;
                    // }

                    get max_cells() {
                        return chart.plugin.max_cells || 4000;
                    }

                    set max_cells(x) {
                        chart.plugin.max_cells = x;
                    }

                    get max_columns() {
                        return chart.plugin.max_columns || 50;
                    }

                    set max_columns(x) {
                        chart.plugin.max_columns = x;
                    }

                    async render() {
                        var canvas = document.createElement("canvas");
                        var container =
                            this.shadowRoot.querySelector("#container");
                        canvas.width = container.offsetWidth;
                        canvas.height = container.offsetHeight;

                        const context = canvas.getContext("2d");
                        context.fillStyle =
                            window
                                .getComputedStyle(this)
                                .getPropertyValue("--plugin--background") ||
                            "white";
                        context.fillRect(0, 0, canvas.width, canvas.height);
                        const text_color = window
                            .getComputedStyle(this)
                            .getPropertyValue("color");

                        const svgs = Array.from(
                            this.shadowRoot.querySelectorAll(
                                "svg:not(#dragHandles)"
                            )
                        );

                        for (const svg of svgs.reverse()) {
                            var img = document.createElement("img");
                            // document.body.appendChild(img);
                            img.width = svg.parentNode.offsetWidth;
                            img.height = svg.parentNode.offsetHeight;

                            // Pretty sure this is a chrome bug - `drawImage()` call
                            // without this scales incorrectly.
                            const new_svg = svg.cloneNode(true);
                            if (!new_svg.hasAttribute("viewBox")) {
                                new_svg.setAttribute(
                                    "viewBox",
                                    `0 0 ${img.width} ${img.height}`
                                );
                            }

                            new_svg.setAttribute(
                                "xmlns",
                                "http://www.w3.org/2000/svg"
                            );

                            for (const text of new_svg.querySelectorAll(
                                "text"
                            )) {
                                text.setAttribute("fill", text_color);
                            }

                            var xml = new XMLSerializer().serializeToString(
                                new_svg
                            );

                            xml = xml.replace(/[^\x00-\x7F]/g, "");

                            const done = new Promise((x, y) => {
                                img.onload = x;
                                img.onerror = y;
                            });

                            try {
                                img.src = `data:image/svg+xml;base64,${btoa(
                                    xml
                                )}`;
                                await done;
                            } catch (e) {
                                const done = new Promise((x, y) => {
                                    img.onload = x;
                                    img.onerror = y;
                                });
                                img.src = `data:image/svg+xml;utf8,${xml}`;
                                await done;
                            }

                            context.drawImage(
                                img,
                                svg.parentNode.offsetLeft,
                                svg.parentNode.offsetTop,
                                img.width,
                                img.height
                            );
                        }

                        const canvases = Array.from(
                            this.shadowRoot.querySelectorAll("canvas")
                        );

                        for (const canvas of canvases.reverse()) {
                            context.drawImage(
                                canvas,
                                canvas.parentNode.offsetLeft,
                                canvas.parentNode.offsetTop,
                                canvas.width / window.devicePixelRatio,
                                canvas.height / window.devicePixelRatio
                            );
                        }

                        return await new Promise(
                            (x) => canvas.toBlob((blob) => x(blob)),
                            "image/png"
                        );
                    }

                    async draw(view, end_col, end_row) {
                        if (this.offsetParent === null) {
                            this._staged_view = [view, end_col, end_row];
                            return;
                        }

                        this._staged_view = undefined;
                        this.config = await this.parentElement.save();
                        await this.update(view, end_col, end_row, true);
                    }

                    async update(view, end_col, end_row, clear = false) {
                        if (this.offsetParent === null) {
                            return;
                        }

                        const viewer = this.parentElement;
                        // const realValues =
                        //     JSON.parse(viewer.getAttribute("columns"));
                        const realValues = this.config.columns;
                        const leaves_only = chart.plugin.name !== "Sunburst";

                        let [
                            table_schema,
                            expression_schema,
                            view_schema,
                            json,
                            config,
                        ] = await Promise.all([
                            viewer
                                .getTable()
                                .then((table) => table.schema(false)),
                            view.expression_schema(false),
                            view.schema(false),
                            view.to_json(end_col, end_row, leaves_only),
                            view.get_config(),
                        ]);

                        /**
                         * Retrieve a tree axis column from the table and
                         * expression schemas, returning a String type or
                         * `undefined`.
                         * @param {String} column a column name
                         */
                        const get_pivot_column_type = function (column) {
                            let type = table_schema[column];
                            if (!type) {
                                type = expression_schema[column];
                            }
                            return type;
                        };

                        const { columns, group_by, split_by, filter } = config;
                        const filtered =
                            group_by.length > 0
                                ? json.reduce(
                                      (acc, col) => {
                                          if (
                                              col.__ROW_PATH__ &&
                                              col.__ROW_PATH__.length ==
                                                  group_by.length
                                          ) {
                                              acc.agg_paths.push(
                                                  acc.aggs.slice()
                                              );
                                              acc.rows.push(col);
                                          } else {
                                              const len =
                                                  col.__ROW_PATH__.filter(
                                                      (x) => x !== undefined
                                                  ).length;
                                              acc.aggs[len] = col;
                                              acc.aggs = acc.aggs.slice(
                                                  0,
                                                  len + 1
                                              );
                                          }
                                          return acc;
                                      },
                                      { rows: [], aggs: [], agg_paths: [] }
                                  )
                                : { rows: json };
                        const dataMap = (col, i) =>
                            !group_by.length
                                ? { ...col, __ROW_PATH__: [i] }
                                : col;
                        const mapped = filtered.rows.map(dataMap);

                        let settings = {
                            realValues,
                            crossValues: group_by.map((r) => ({
                                name: r,
                                type: get_pivot_column_type(r),
                            })),
                            mainValues: columns.map((a) => ({
                                name: a,
                                type: view_schema[a],
                            })),
                            splitValues: split_by.map((r) => ({
                                name: r,
                                type: get_pivot_column_type(r),
                            })),
                            filter,
                            data: mapped,
                            agg_paths: filtered.agg_paths,
                        };

                        this._chart = chart;

                        const handler = {
                            set: (obj, prop, value) => {
                                if (!EXCLUDED_SETTINGS.includes(prop)) {
                                    this._container &&
                                        this._container.dispatchEvent(
                                            new Event(
                                                "perspective-plugin-update",
                                                {
                                                    bubbles: true,
                                                    composed: true,
                                                }
                                            )
                                        );
                                }
                                obj[prop] = value;
                                return true;
                            },
                        };

                        this._settings = new Proxy(
                            { ...this._settings, ...settings },
                            handler
                        );

                        // If only a right-axis Y axis remains, reset the alt
                        // axis list to default.
                        if (
                            this._settings.splitMainValues &&
                            this._settings.splitMainValues.length >=
                                columns.length
                        ) {
                            this._settings.splitMainValues = [];
                        }

                        initialiseStyles(this._container, this._settings);

                        if (clear) {
                            this._container.innerHTML = "";
                        }

                        this._draw();

                        await new Promise((resolve) =>
                            requestAnimationFrame(resolve)
                        );
                    }

                    async clear() {
                        if (this._container) {
                            this._container.innerHTML = "";
                        }
                    }

                    _draw() {
                        if (this.offsetParent !== null) {
                            const containerDiv = d3.select(this._container);
                            const chartClass = `chart ${name}`;
                            this._settings.size =
                                this._container.getBoundingClientRect();

                            if (this._settings.data.length > 0) {
                                this._chart(
                                    containerDiv.attr("class", chartClass),
                                    this._settings
                                );
                            } else {
                                containerDiv.attr(
                                    "class",
                                    `${chartClass} disabled`
                                );
                            }
                        }
                    }

                    /**
                     * TODO we need to `clear()` here unnecessarily due to a bug in the tremap module which
                     * causes non-cleared redraws duplicate column labels when calculating column name
                     * resize/repositions - see `treemapLabel.js`.
                     */
                    async resize(view) {
                        if (this.offsetParent !== null) {
                            if (this._settings?.data !== undefined) {
                                this._draw();
                            } else {
                                const [view, end_col, end_row] =
                                    this._staged_view;
                                this._staged_view = undefined;
                                this.draw(view, end_col, end_row);
                            }
                        }
                    }

                    async restyle(...args) {
                        let settings = this._settings;
                        if (settings) {
                            delete settings["colorStyles"];
                            delete settings["textStyles"];
                            await this.draw(...args);
                        }
                    }

                    async delete() {
                        this._container.innerHTML = "";
                    }

                    getContainer() {
                        return this._container;
                    }

                    save() {
                        const settings = { ...this._settings };
                        EXCLUDED_SETTINGS.forEach((s) => {
                            delete settings[s];
                        });
                        return settings;
                    }

                    restore(settings) {
                        const new_settings = {};
                        for (const name of EXCLUDED_SETTINGS) {
                            new_settings[name] = this._settings?.[name];
                        }
                        this._settings = { ...new_settings, ...settings };
                        this._draw();
                    }
                }
            );

            customElements
                .whenDefined("perspective-viewer")
                .then(() => register_element(plugin_name));
        }
    });
}

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector;
}
