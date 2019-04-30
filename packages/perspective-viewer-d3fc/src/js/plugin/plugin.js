/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import charts from "../charts/charts";
import "./polyfills/index";
import "./template";

export const PRIVATE = Symbol("D3FC chart");

const DEFAULT_PLUGIN_SETTINGS = {
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select"
};

export function register(...plugins) {
    plugins = new Set(plugins.length > 0 ? plugins : charts.map(chart => chart.plugin.type));
    charts.forEach(chart => {
        if (plugins.has(chart.plugin.type)) {
            global.registerPlugin(chart.plugin.type, {
                ...DEFAULT_PLUGIN_SETTINGS,
                ...chart.plugin,
                create: drawChart(chart),
                resize: resizeChart,
                delete: deleteChart
            });
        }
    });
}

function drawChart(chart) {
    return async function(el, view, task) {
        const [tschema, schema, json, config] = await Promise.all([this._table.schema(), view.schema(), view.to_json(), view.get_config()]);
        if (task.cancelled) {
            return;
        }
        const aggregates = config.columns;
        const row_pivots = config.row_pivots;
        const col_pivots = config.column_pivots;
        const filter = config.filter;

        const filtered = row_pivots.length > 0 ? json.filter(col => col.__ROW_PATH__ && col.__ROW_PATH__.length == row_pivots.length) : json;
        const dataMap = (col, i) => (!row_pivots.length ? {...col, __ROW_PATH__: [i]} : col);

        let settings = {
            crossValues: row_pivots.map(r => ({name: r, type: tschema[r]})),
            mainValues: aggregates.map(a => ({name: a, type: schema[a]})),
            splitValues: col_pivots.map(r => ({name: r, type: tschema[r]})),
            filter,
            data: filtered.map(dataMap)
        };

        createOrUpdateChart.call(this, el, chart, settings);
    };
}

function createOrUpdateChart(div, chart, settings) {
    let perspective_d3fc_element;
    this[PRIVATE] = this[PRIVATE] || {};
    if (!this[PRIVATE].chart) {
        perspective_d3fc_element = this[PRIVATE].chart = document.createElement("perspective-d3fc-chart");
    } else {
        perspective_d3fc_element = this[PRIVATE].chart;
    }

    if (!document.body.contains(perspective_d3fc_element)) {
        div.innerHTML = "";
        div.appendChild(perspective_d3fc_element);
    }

    perspective_d3fc_element.render(chart, settings);
}

function resizeChart() {
    if (this[PRIVATE] && this[PRIVATE].chart) {
        const perspective_d3fc_element = this[PRIVATE].chart;
        perspective_d3fc_element.resize();
    }
}

function deleteChart() {
    if (this[PRIVATE] && this[PRIVATE].chart) {
        const perspective_d3fc_element = this[PRIVATE].chart;
        perspective_d3fc_element.delete();
    }
}

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector;
}
