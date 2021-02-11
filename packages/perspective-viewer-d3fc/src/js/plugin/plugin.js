/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {registerPlugin} from "@finos/perspective-viewer/src/js/utils.js";
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
            registerPlugin(chart.plugin.type, {
                ...DEFAULT_PLUGIN_SETTINGS,
                ...chart.plugin,
                create: drawChart(chart),
                resize: resizeChart,
                delete: deleteChart,
                save,
                restore
            });
        }
    });
}

function drawChart(chart) {
    return async function(el, view, task, end_col, end_row) {
        let jsonp;
        const realValues = JSON.parse(this.getAttribute("columns"));

        if (end_col && end_row) {
            jsonp = view.to_json({end_row, end_col, leaves_only: true});
        } else if (end_col) {
            jsonp = view.to_json({end_col, leaves_only: true});
        } else if (end_row) {
            jsonp = view.to_json({end_row, leaves_only: true});
        } else {
            jsonp = view.to_json({leaves_only: true});
        }

        let [table_schema, computed_schema, view_schema, json, config] = await Promise.all([this._table.schema(false), view.computed_schema(false), view.schema(false), jsonp, view.get_config()]);

        if (task.cancelled) {
            return;
        }

        /**
         * Retrieve a tree axis column from the table and computed schemas,
         * returning a String type or `undefined`.
         * @param {String} column a column name
         */
        const get_pivot_column_type = function(column) {
            let type = table_schema[column];
            if (!type) {
                type = computed_schema[column];
            }
            return type;
        };

        const {columns, row_pivots, column_pivots, filter} = config;
        const filtered = row_pivots.length > 0 ? json.filter(col => col.__ROW_PATH__ && col.__ROW_PATH__.length == row_pivots.length) : json;
        const dataMap = (col, i) => (!row_pivots.length ? {...col, __ROW_PATH__: [i]} : col);
        const mapped = filtered.map(dataMap);

        let settings = {
            realValues,
            crossValues: row_pivots.map(r => ({name: r, type: get_pivot_column_type(r)})),
            mainValues: columns.map(a => ({name: a, type: view_schema[a]})),
            splitValues: column_pivots.map(r => ({name: r, type: get_pivot_column_type(r)})),
            filter,
            data: mapped
        };

        createOrUpdateChart.call(this, el, chart, settings);
    };
}

function getOrCreatePluginElement() {
    let perspective_d3fc_element;
    this[PRIVATE] = this[PRIVATE] || {};
    if (!this[PRIVATE].chart) {
        perspective_d3fc_element = this[PRIVATE].chart = document.createElement("perspective-d3fc-chart");
    } else {
        perspective_d3fc_element = this[PRIVATE].chart;
    }
    return perspective_d3fc_element;
}

function createOrUpdateChart(div, chart, settings) {
    const perspective_d3fc_element = getOrCreatePluginElement.call(this);

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

function save() {
    if (this[PRIVATE] && this[PRIVATE].chart) {
        const perspective_d3fc_element = this[PRIVATE].chart;
        return perspective_d3fc_element.getSettings();
    }
}

function restore(config) {
    const perspective_d3fc_element = getOrCreatePluginElement.call(this);
    perspective_d3fc_element.setSettings(config);
}

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector;
}
