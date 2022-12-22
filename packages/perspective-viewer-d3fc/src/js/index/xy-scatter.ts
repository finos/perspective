/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import { register } from "../plugin/plugin.js";
import PluginElement from "../plugin/PluginElement";
import style from "../../less/chart.less"; // Why this no work?
// import { initialiseStyles } from "../series/colorStyles";
import { initializeStyles } from "../series/colorStyles";
// import xyScatterChart from "../charts/xy-scatter";
import * as fc from "d3fc";
import { axisFactory } from "../axis/axisFactory";
import { chartCanvasFactory } from "../axis/chartFactory";
import {
    pointSeriesCanvas,
    symbolTypeFromGroups,
} from "../series/pointSeriesCanvas";
import { pointData, seriesToPoints } from "../data/pointData";
import { seriesColorsFromGroups } from "../series/seriesColors";
import { seriesLinearRange, seriesColorRange } from "../series/seriesRange";
import { symbolLegend } from "../legend/legend";
import { colorRangeLegend } from "../legend/colorRangeLegend";
import { filterDataByGroup } from "../legend/filter";
import withGridLines from "../gridlines/gridlines";
import { hardLimitZeroPadding } from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";
import { interpolate_scale } from "../utils/chartUtils.js";

function getD3FCStyles() {
    const head = document.querySelector("head");
    const headerStyles = head?.querySelectorAll("style");
    const d3fcStyles: string[] = [];

    headerStyles?.forEach((s) => {
        if (s.innerText.indexOf("d3fc-") !== -1) {
            d3fcStyles.push(s.innerText);
        }
    });

    return d3fcStyles.join("");
}

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

type PluginSettings = {
    realValues: string[];
    crossValues: { name: string; type: string }[];
    mainValues: { name: string; type: string }[];
    splitValues: { name: string; type: string }[];
    filter: any[];
    data: any[];
    agg_paths: any[];
    size: any;
};

class XYScatterChart extends HTMLElement {
    static plugin_name = "perspective-viewer-d3fc-tester";

    #maxCells = 50000;

    #maxColumns = 50;

    #renderWarning = true;

    #settings: PluginSettings | null = null;

    #container: HTMLElement | null = null;

    #initialized = false;

    #staged_view: any[] | null = null;

    config: any = null;

    get name() {
        return "Tester";
        // return "X/Y Scatter";
    }

    get category() {
        return "X/Y Chart";
    }

    get select_mode() {
        return "toggle";
    }

    get min_config_columns() {
        return 2;
    }

    get config_column_names() {
        return ["X Axis", "Y Axis", "Color", "Size", "Label", "Tooltip"];
    }

    get max_cells() {
        return this.#maxCells;
    }

    set max_cells(max_cells: number) {
        this.#maxCells = max_cells;
    }

    get max_columns() {
        return this.#maxColumns;
    }

    set max_columns(max_columns: number) {
        this.#maxColumns = max_columns;
    }

    get render_warning() {
        return this.#renderWarning;
    }

    set render_warning(render_warning: boolean) {
        this.#renderWarning = render_warning;
    }

    connectedCallback() {
        if (!this.#initialized) {
            this.attachShadow({ mode: "open" });

            if (this.shadowRoot) {
                this.shadowRoot.innerHTML = `<style>${styleWithD3FC}</style>`;
                this.shadowRoot.innerHTML += `<div id="container" class="chart"></div>`;
                const c = this.shadowRoot.querySelector(".chart");
                this.#container = this.shadowRoot.querySelector(".chart");
                this.#initialized = true;
            }
        }
    }

    async render() {
        if (!this.shadowRoot) return;
        const canvas = document.createElement("canvas");
        const container: HTMLElement | null =
            this.shadowRoot.querySelector("#container");
        if (!container) return;

        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.fillStyle =
            window
                .getComputedStyle(this)
                .getPropertyValue("--plugin--background") || "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        const text_color = window
            .getComputedStyle(this)
            .getPropertyValue("color");

        const svgs = Array.from(
            this.shadowRoot.querySelectorAll("svg:not(#dragHandles)")
        );

        for (const svg of svgs.reverse()) {
            const img = document.createElement("img");
            const parentNode = svg.parentNode as HTMLElement | null;
            if (!parentNode) continue;

            img.width = parentNode.offsetWidth;
            img.height = parentNode.offsetHeight;

            // Pretty sure this is a chrome bug - `drawImage()` call
            // without this scales incorrectly.
            const new_svg = (svg as SVGElement).cloneNode(true) as SVGElement;
            if (!new_svg.hasAttribute("viewBox")) {
                new_svg.setAttribute(
                    "viewBox",
                    `0 0 ${img.width} ${img.height}`
                );
            }

            new_svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

            for (const text of new_svg.querySelectorAll("text")) {
                text.setAttribute("fill", text_color);
            }

            var xml = new XMLSerializer().serializeToString(new_svg);

            xml = xml.replace(/[^\x00-\x7F]/g, "");

            const done = new Promise((x, y) => {
                img.onload = x;
                img.onerror = y;
            });

            try {
                img.src = `data:image/svg+xml;base64,${btoa(xml)}`;
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
                parentNode.offsetLeft,
                parentNode.offsetTop,
                img.width,
                img.height
            );
        }

        const canvases = Array.from(this.shadowRoot.querySelectorAll("canvas"));

        for (const canvas of canvases.reverse()) {
            const parentNode = canvas.parentNode as HTMLElement | null;
            if (!parentNode) continue;

            context.drawImage(
                canvas,
                parentNode.offsetLeft,
                parentNode.offsetTop,
                canvas.width / window.devicePixelRatio,
                canvas.height / window.devicePixelRatio
            );
        }

        return await new Promise(
            (x) => canvas.toBlob((blob) => x(blob))
            // "image/png" // Huh?? Why does this have this extra argument?
        );
    }

    async draw(view, end_col, end_row) {
        if (this.offsetParent === null) {
            this.#staged_view = [view, end_col, end_row];
            return;
        }

        this.#staged_view = null;

        // How should I check the parentElement to have a save() method?
        // @ts-ignore
        this.config = await this.parentElement.save();
        await this.update(view, end_col, end_row, true);
    }

    async update(view, end_col, end_row, clear = false) {
        if (this.offsetParent === null) {
            return;
        }

        const viewer = this.parentElement; // What is the type of parentElement?
        console.log("viewer", viewer);
        // const realValues =
        //     JSON.parse(viewer.getAttribute("columns"));
        const realValues = this.config.columns;
        const leaves_only = true;

        console.time("old busted (json)");
        const json = await view.to_json({
            ...(end_col ? { end_col } : {}),
            ...(end_row ? { end_row } : {}),
            leaves_only,
        });
        console.timeEnd("old busted (json)");

        console.log("json", json);

        const getColOptions = {
            ...(end_row ? { end_row } : {}),
            id: true,
            leaves_only,
        };

        console.time("new hotness (cols)");
        const rows = await view.get_columns(realValues, getColOptions);

        console.timeEnd("new hotness (cols)");

        console.log("rows", rows);

        let [
            table_schema,
            expression_schema,
            view_schema,
            // json,
            config,
        ] = await Promise.all([
            // @ts-ignore
            viewer.getTable().then((table) => table.schema(false)), // TODO: type parentElement.
            view.expression_schema(false),
            view.schema(false),
            // view.to_json({
            //     ...(end_col ? { end_col } : {}),
            //     ...(end_row ? { end_row } : {}),
            //     leaves_only,
            // }),
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
                ? rows.reduce(
                      // ? json.reduce(
                      (acc, col) => {
                          // console.log("col", col);
                          if (
                              col.__ROW_PATH__ &&
                              col.__ROW_PATH__.length == group_by.length
                          ) {
                              acc.agg_paths.push(acc.aggs.slice());
                              acc.rows.push(col);
                          } else {
                              const len = col.__ROW_PATH__.filter(
                                  (x) => x !== undefined
                              ).length;
                              acc.aggs[len] = col;
                              acc.aggs = acc.aggs.slice(0, len + 1);
                          }
                          return acc;
                      },
                      { rows: [], aggs: [], agg_paths: [] }
                  )
                : { rows };
        // :  { rows: json };
        const dataMap = (col, i) =>
            !group_by.length ? { ...col, __ROW_PATH__: [i] } : col;
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

        const handler = {
            set: (obj, prop, value) => {
                if (!EXCLUDED_SETTINGS.includes(prop)) {
                    this.#container &&
                        this.#container.dispatchEvent(
                            new Event("perspective-plugin-update", {
                                bubbles: true,
                                composed: true,
                            })
                        );
                }
                obj[prop] = value;
                return true;
            },
        };

        console.log("update settings", settings);
        this.#settings = new Proxy({ ...this.#settings, ...settings }, handler);

        // If only a right-axis Y axis remains, reset the alt
        // axis list to default.
        if (
            this.#settings.splitMainValues &&
            this.#settings.splitMainValues.length >= columns.length
        ) {
            this.#settings.splitMainValues = [];
        }

        initializeStyles(this.#container, this.#settings);

        if (clear && this.#container) {
            this.#container.innerHTML = "";
        }

        this._draw(view);

        await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    async clear() {
        if (this.#container) {
            this.#container.innerHTML = "";
        }
    }

    _draw(view) {
        if (this.offsetParent !== null) {
            const containerDiv = d3.select(this.#container);
            const chartClass = `chart xyscatter`;
            if (!this.#container) return;
            this.#settings.size = this.#container.getBoundingClientRect();

            if (this.#settings.data.length > 0) {
                this.drawXYScatterChart(
                    view,
                    containerDiv.attr("class", chartClass),
                    this.#settings
                );
            } else {
                containerDiv.attr("class", `${chartClass} disabled`);
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
            if (this.#settings?.data !== undefined) {
                this._draw(view);
            } else {
                const [view, end_col, end_row] = this.#staged_view;
                this.#staged_view = null;
                this.draw(view, end_col, end_row);
            }
        }
    }

    async restyle(...args: [any /* View */, number, number]) {
        let settings = this.#settings;
        if (settings) {
            delete settings["colorStyles"];
            delete settings["textStyles"];
            await this.draw(...args);
        }
    }

    async delete() {
        if (this.#container) {
            this.#container.innerHTML = "";
        }
    }

    getContainer() {
        return this.#container;
    }

    save() {
        const settings = { ...this.#settings };
        EXCLUDED_SETTINGS.forEach((s) => {
            delete settings[s];
        });
        return settings;
    }

    restore(settings) {
        // @ts-ignore // TODO: Type parentElement as PerspectiveViewerElement.
        const view = this.parentElement?.getView();
        const new_settings = {};
        for (const name of EXCLUDED_SETTINGS) {
            new_settings[name] = this.#settings?.[name];
        }
        this.#settings = { ...new_settings, ...settings };

        if (view) {
            this._draw(view);
        }
    }

    drawXYScatterChart(view, container, settings) {
        // console.log(container);
        const data = [seriesToPoints(settings, filterDataByGroup(settings))];
        // const data = pointData(settings, filterDataByGroup(settings));

        const symbols = symbolTypeFromGroups(settings);
        const useGroupColors =
            settings.realValues.length <= 2 || settings.realValues[2] === null;
        let color = null;
        let legend = null;

        if (useGroupColors) {
            color = seriesColorsFromGroups(settings);

            legend = symbolLegend()
                .settings(settings)
                .scale(symbols)
                .color(useGroupColors ? color : null);
        } else {
            color = seriesColorRange(settings, data, "colorValue");
            legend = colorRangeLegend().scale(color);
        }

        const size = settings.realValues[3]
            ? seriesLinearRange(settings, data, "size").range([10, 10000])
            : null;

        const label = settings.realValues[4];

        const scale_factor = interpolate_scale(
            [600, 0.1],
            [1600, 1]
        )(container);
        const series = fc
            .seriesCanvasMulti()
            .mapping((data, index) => data[index])
            .series(
                data.map((series) =>
                    pointSeriesCanvas(
                        settings,
                        series.key,
                        size,
                        color,
                        label,
                        symbols,
                        scale_factor
                    )
                )
            );

        const axisDefault = () =>
            axisFactory(settings)
                .settingName("mainValues")
                // @ts-ignore // TODO: fix upstream types
                .paddingStrategy(hardLimitZeroPadding())
                .pad([0.1, 0.1]);

        const xAxis = axisDefault()
            .settingValue(settings.mainValues[0].name)
            .valueName("x")(data);
        const yAxis = axisDefault()
            .orient("vertical")
            .settingValue(settings.mainValues[1].name)
            .valueName("y")(data);

        const chart = chartCanvasFactory(xAxis, yAxis)
            .xLabel(settings.mainValues[0].name)
            .yLabel(settings.mainValues[1].name)
            .plotArea(withGridLines(series, settings).canvas(true));

        chart.xNice && chart.xNice();
        chart.yNice && chart.yNice();

        const zoomChart = zoomableChart()
            .chart(chart)
            .settings(settings)
            .xScale(xAxis.scale)
            .yScale(yAxis.scale)
            .canvas(true);

        const toolTip = nearbyTip()
            .scaleFactor(scale_factor)
            // @ts-ignore // TODO: fix upstream types
            .settings(settings)
            .canvas(true)
            .xScale(xAxis.scale)
            .xValueName("x")
            .yValueName("y")
            .yScale(yAxis.scale)
            .color(useGroupColors && color)
            .size(size)
            // .onPoint(async (stuff) => {
            //     console.log('stuff', stuff);
            //     // if (stuff[0]) {
            //     //     const p = await view.get_row_path(stuff[0].row.__ROW_ID__);
            //     //     stuff[0].row.__ROW_PATH__ = p;
            //     //     stuff[0].crossValue = p[0];
            //     // }

            //     return stuff;
            // })
            .data(data);

        // render
        container.datum(data).call(zoomChart);
        container.call(toolTip);
        if (legend) container.call(legend);
    }
}

export default XYScatterChart;

customElements.define(XYScatterChart.plugin_name, XYScatterChart);

customElements.whenDefined("perspective-viewer").then(() => {
    const PerspectiveViewer = customElements.get("perspective-viewer");

    if (PerspectiveViewer) {
        // @ts-ignore - Need to import PerspectiveViewer type.
        PerspectiveViewer.registerPlugin(XYScatterChart.plugin_name);
    }
});
