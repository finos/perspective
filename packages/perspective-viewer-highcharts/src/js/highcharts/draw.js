/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import Highcharts from "highcharts";

import style from "../../less/highcharts.less";
import template from "../../html/highcharts.html";

import {COLORS_10, COLORS_20} from "./externals.js";
import {color_axis} from "./color_axis.js";
import {make_tree_data, make_y_data, make_xy_data, make_xyz_data, make_xy_column_data} from "./series.js";
import {set_boost, set_category_axis, set_both_axis, default_config, set_tick_size} from "./config.js";
import {bindTemplate} from "@finos/perspective-viewer/dist/esm/utils";
import detectIE from "detectie";

export const PRIVATE = Symbol("Highcharts private");

function get_or_create_element(div) {
    let perspective_highcharts_element;
    this[PRIVATE] = this[PRIVATE] || {};
    if (!this[PRIVATE].chart) {
        perspective_highcharts_element = this[PRIVATE].chart = document.createElement("perspective-highcharts");
    } else {
        perspective_highcharts_element = this[PRIVATE].chart;
    }

    if (!document.body.contains(perspective_highcharts_element)) {
        div.innerHTML = "";
        div.appendChild(perspective_highcharts_element);
    }
    return perspective_highcharts_element;
}

export const draw = (mode, set_config, restyle) =>
    async function(el, view, task, end_col, end_row) {
        if (set_config) {
            this._config = await view.get_config();
            if (task.cancelled) {
                return;
            }
        }

        const config = await view.get_config();

        const row_pivots = config.row_pivots;
        const col_pivots = config.column_pivots;
        const columns = config.columns;

        const [schema, tschema] = await Promise.all([view.schema(false), this._table.schema(false, false)]);
        let element;

        if (task.cancelled) {
            return;
        }

        let configs = [],
            xaxis_name = columns.length > 0 ? columns[0] : undefined,
            xaxis_type = schema[xaxis_name],
            yaxis_name = columns.length > 1 ? columns[1] : undefined,
            yaxis_type = schema[yaxis_name],
            xtree_name = row_pivots.length > 0 ? row_pivots[row_pivots.length - 1] : undefined,
            xtree_type = tschema[xtree_name],
            ytree_name = col_pivots.length > 0 ? col_pivots[col_pivots.length - 1] : undefined,
            ytree_type = tschema[ytree_name],
            num_aggregates = columns.length;

        try {
            if (mode === "scatter") {
                let cols;
                if (end_col || end_row) {
                    cols = await view.to_columns({end_col, end_row, leaves_only: true});
                } else {
                    cols = await view.to_columns();
                }
                const config = (configs[0] = default_config.call(this, columns, mode));
                const [series, xtop, colorRange, ytop] = make_xy_column_data(cols, schema, columns, row_pivots, col_pivots);

                config.legend.floating = series.length <= 20;
                config.legend.enabled = col_pivots.length > 0;
                config.series = series;
                config.colors = series.length <= 10 ? COLORS_10 : COLORS_20;
                if (colorRange[0] !== Infinity) {
                    if (columns.length <= 3) {
                        config.chart.type = "coloredScatter";
                    } else {
                        config.chart.type = "coloredBubble";
                    }
                    color_axis.call(this, config, colorRange, restyle);
                }
                if (num_aggregates < 3) {
                    set_boost(config, xaxis_type, yaxis_type);
                }
                set_both_axis(config, "xAxis", xaxis_name, xaxis_type, xaxis_type, xtop);
                set_both_axis(config, "yAxis", yaxis_name, yaxis_type, yaxis_type, ytop);
                set_tick_size.call(this, config);
            } else if (mode === "heatmap") {
                let js;
                if (end_col || end_row) {
                    js = await view.to_json({end_col, end_row, leaves_only: false});
                } else {
                    js = await view.to_json();
                }
                let config = (configs[0] = default_config.call(this, columns, mode));
                let [series, top, ytop, colorRange] = make_xyz_data(js, row_pivots, ytree_type);
                config.series = [
                    {
                        name: null,
                        data: series,
                        nullColor: "none"
                    }
                ];
                config.legend.enabled = true;
                config.legend.floating = false;

                color_axis.call(this, config, colorRange, restyle);
                set_boost(config, xaxis_type, yaxis_type);
                set_category_axis(config, "xAxis", xtree_type, top);
                set_category_axis(config, "yAxis", ytree_type, ytop);
            } else if (mode === "treemap" || mode === "sunburst") {
                let js;
                if (end_col || end_row) {
                    js = await view.to_json({end_col, end_row, leaves_only: false});
                } else {
                    js = await view.to_json();
                }
                let [charts, , colorRange] = make_tree_data(js, row_pivots, columns, mode === "treemap");
                for (let series of charts) {
                    let config = default_config.call(this, columns, mode);
                    config.series = [series];
                    if (charts.length > 1) {
                        config.title.text = series.title;
                    }
                    config.plotOptions.series.borderWidth = 1;
                    config.legend.floating = false;
                    if (colorRange) {
                        color_axis.call(this, config, colorRange, restyle);
                    }
                    configs.push(config);
                }
            } else if (mode === "line") {
                let s;
                let config = (configs[0] = default_config.call(this, columns, mode));

                if (col_pivots.length === 0) {
                    let cols;
                    if (end_col || end_row) {
                        cols = await view.to_columns({end_col, end_row, leaves_only: true});
                    } else {
                        cols = await view.to_columns();
                    }
                    s = await make_xy_column_data(cols, schema, columns, row_pivots, col_pivots);
                } else {
                    let js;
                    if (end_col || end_row) {
                        js = await view.to_json({end_col, end_row, leaves_only: false});
                    } else {
                        js = await view.to_json();
                    }
                    s = await make_xy_data(js, schema, columns, row_pivots, col_pivots);
                }

                const series = s[0];
                const xtop = s[1];
                const ytop = s[3];

                const colors = series.length <= 10 ? COLORS_10 : COLORS_20;
                config.legend.floating = series.length <= 20;
                config.legend.enabled = col_pivots.length > 0;
                config.series = series;
                config.plotOptions.scatter.marker = {enabled: false, radius: 0};
                config.colors = colors;
                if (set_boost(config, xaxis_type, yaxis_type)) {
                    delete config.chart["type"];
                }
                set_both_axis(config, "xAxis", xaxis_name, xaxis_type, xaxis_type, xtop);
                set_both_axis(config, "yAxis", yaxis_name, yaxis_type, yaxis_type, ytop);
            } else {
                let config = (configs[0] = default_config.call(this, columns, mode));
                let cols;
                if (end_col || end_row) {
                    cols = await view.to_columns({end_col, end_row, leaves_only: false});
                } else {
                    cols = await view.to_columns();
                }

                let [series, top] = make_y_data(cols, row_pivots);
                config.series = series;
                config.colors = series.length <= 10 ? COLORS_10 : COLORS_20;
                config.legend.enabled = col_pivots.length > 0 || series.length > 1;
                config.legend.floating = series.length <= 20;
                config.plotOptions.series.dataLabels = {
                    allowOverlap: false,
                    padding: 10
                };
                if (mode.indexOf("scatter") > -1 || mode.indexOf("line") > -1) {
                    set_boost(config, xaxis_type, yaxis_type);
                }
                set_category_axis(config, "xAxis", xtree_type, top);
                Object.assign(config, {
                    yAxis: {
                        startOnTick: false,
                        endOnTick: false,
                        title: {
                            text: columns.join(",  "),
                            style: {color: "#666666", fontSize: "14px"}
                        },
                        labels: {overflow: "justify"}
                    }
                });
            }
        } finally {
            element = get_or_create_element.call(this, el);
            if (restyle || this.hasAttribute("updating")) {
                element.delete();
            }
        }

        element.render(mode, configs, this);
    };

@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class HighchartsElement extends HTMLElement {
    constructor() {
        super();
        this._charts = [];
    }

    connectedCallback() {
        this._container = this.shadowRoot.querySelector("#container");
    }

    render(mode, configs, callee) {
        if (this._charts.length > 0 && this._charts.length === configs.length) {
            let idx = 0;
            for (let cidx = 0; cidx < this._charts.length; cidx++) {
                const chart = this._charts[cidx];
                let config = configs[idx++];
                if (config.boost) {
                    let target = chart.renderTo;
                    try {
                        chart.destroy();
                    } catch (e) {
                        console.warn("Scatter plot destroy() call failed - this is probably leaking memory");
                    }
                    this._charts[cidx] = Highcharts.chart(target, config);
                } else if (mode === "scatter") {
                    let conf = {
                        series: config.series,
                        plotOptions: {}
                    };
                    set_tick_size.call(callee, conf);
                    chart.update(conf);
                } else {
                    let opts = {series: config.series, xAxis: config.xAxis, yAxis: config.yAxis};
                    chart.update(opts);
                }
            }
        } else {
            this.delete();
            for (let config of configs) {
                let chart = document.createElement("div");
                chart.className = "chart";
                this._container.appendChild(chart);
                this._charts.push(() => Highcharts.chart(chart, config));
            }

            for (let i = 0; i < this._charts.length; i++) {
                this._charts[i] = this._charts[i]();
            }
        }

        if (!this._charts.every(x => this._container.contains(x.renderTo))) {
            this.remove();
            this._charts.map(x => this._container.appendChild(x.renderTo));
        }

        // TODO resize bug in Highcharts?
        if (configs.length > 1) {
            this.resize();
        }

        if (detectIE()) {
            setTimeout(() => this.resize());
        }
    }

    resize() {
        if (this._charts && this._charts.length > 0) {
            this._charts.map(x => x.reflow());
        }
    }

    remove() {
        this._charts = [];
        for (let e of Array.prototype.slice.call(this._container.children)) {
            if (e.tagName === "DIV") {
                this._container.removeChild(e);
            }
        }
    }

    delete() {
        for (let chart of this._charts) {
            try {
                chart.destroy();
            } catch (e) {
                console.warn("Scatter plot destroy() call failed - this is probably leaking memory");
            }
        }
        this.remove();
    }
}
