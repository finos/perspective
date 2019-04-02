/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import charts from "../charts/charts";
import "./template";

export const PRIVATE = Symbol("D3FC chart");

const DEFAULT_PLUGIN_SETTINGS = {
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select"
};

charts.forEach(chart => {
    global.registerPlugin(chart.plugin.type, {
        ...DEFAULT_PLUGIN_SETTINGS,
        ...chart.plugin,
        create: drawChart(chart),
        resize: resizeChart,
        delete: deleteChart
    });
});

function drawChart(chart) {
    return async function(el, view, task) {
        // FIXME: super tight coupling to private viewer methods
        const aggregates = this._get_view_aggregates();
        const hidden = this._get_view_hidden(aggregates);

        const [tschema, json, config] = await Promise.all([this._table.schema(), view.to_json(), view.get_config()]);
        if (task.cancelled) {
            return;
        }
        const row_pivots = config.row_pivot;
        const col_pivots = config.column_pivot;
        const filter = config.filter;

        const filtered = row_pivots.length > 0 ? json.filter(col => col.__ROW_PATH__ && col.__ROW_PATH__.length == row_pivots.length) : json;
        const dataMap = !row_pivots.length ? (col, i) => ({...removeHiddenData(col, hidden), __ROW_PATH__: [i]}) : col => removeHiddenData(col, hidden);

        const aggregateType = agg => getOpType(row_pivots, agg.op, tschema[agg.column]);

        let settings = {
            crossValues: row_pivots.map(r => ({name: r, type: tschema[r]})),
            mainValues: aggregates.map(a => ({name: a.column, type: aggregateType(a)})),
            splitValues: col_pivots.map(r => ({name: r, type: tschema[r]})),
            filter,
            data: filtered.map(dataMap)
        };

        createOrUpdateChart.call(this, el, chart, settings);
    };
}

function getOpType(groupBy, op, varType) {
    if (groupBy.length === 0) return varType;

    switch (op) {
        case "count":
        case "distinct count":
            return "integer";
        case "mean":
        case "mean by count":
            return "float";
    }
    return varType;
}

function removeHiddenData(col, hidden) {
    if (hidden && hidden.length > 0) {
        Object.keys(col).forEach(key => {
            const labels = key.split("|");
            if (hidden.includes(labels[labels.length - 1])) {
                delete col[key];
            }
        });
    }
    return col;
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
