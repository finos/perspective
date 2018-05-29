/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import highcharts from 'highcharts';
const Highcharts = highcharts;

import "../less/highcharts.less";

import {COLORS_10, COLORS_20} from "./externals.js";
import {color_axis} from "./color_axis.js";
import {make_tree_data, make_y_data, make_xy_data, make_xyz_data} from "./series.js";
import {set_boost, set_axis, set_category_axis, default_config} from "./config.js";

export const draw = (mode) => async function(el, view, task) {
    const row_pivots = this._view_columns('#row_pivots perspective-row:not(.off)');
    const col_pivots = this._view_columns('#column_pivots perspective-row:not(.off)');
    const aggregates = this._get_view_aggregates();
    const hidden = this._get_view_hidden(aggregates);

    const [js, schema, tschema] = await Promise.all([view.to_json(), view.schema(), this._table.schema()]);

    if (task.cancelled) {
        return;
    }

    if (this.hasAttribute('updating') && this._chart) {
        chart = this._chart
        this._chart = undefined;
        try {
            chart.destroy();
        } catch (e) {
            console.warn("Scatter plot destroy() call failed - this is probably leaking memory");
        }
    }

    let config = default_config(aggregates, mode, js, col_pivots),
        xaxis_name = aggregates.length > 0 ? aggregates[0].column : undefined,
        xaxis_type = schema[xaxis_name],
        yaxis_name = aggregates.length > 1 ? aggregates[1].column : undefined,
        yaxis_type = schema[yaxis_name],
        xtree_name = row_pivots.length > 0 ? row_pivots[row_pivots.length - 1] : undefined,
        xtree_type = tschema[xaxis_name],
        ytree_name = col_pivots.length > 1 ? col_pivots[col_pivots.length - 1] : undefined,
        ytree_type = tschema[yaxis_name];

    if (mode === 'scatter') {
        let [series, top, colorRange] = make_xy_data(js, row_pivots, col_pivots, hidden);
        const colors = series.length <= 10 ? COLORS_10 : COLORS_20;
        config.legend.floating = series.length <= 20;
        let num_cols = Object.keys(js[0]).filter(x => x !== '__ROW_PATH__').length - hidden.length;
        config.legend.enabled = num_cols > 3 || col_pivots.length > 0;
        config.series = series;
        if (colorRange[0] !== Infinity) {
            if (aggregates.length <= 3) {
                config.chart.type = 'coloredScatter';
            } else {
                config.chart.type = 'coloredBubble';
            }
            color_axis.bind(this)(config, colorRange);
        }
        if (aggregates.length < 3) {
            set_boost(config);
        }
        config.colors = [colors[0]];
        set_axis(config, 'xAxis', xaxis_name, xaxis_type);
        set_axis(config, 'yAxis', yaxis_name, yaxis_type);
    } else if (mode === 'heatmap') {
        let [series, top, ytop, colorRange] = make_xyz_data(js, row_pivots, hidden);
        config.series = series;
        config.legend.enabled = true;

        color_axis.call(this, config, colorRange)
        set_boost(config);

        set_category_axis(config, 'xAxis', xtree_type, top);
        set_category_axis(config, 'yAxis', ytree_type, ytop);

        Object.assign(config, {
            series: [{
                name: null,
                data: series,
                nullColor: 'none'
            }],
            boost: {
                useGPUTranslations: true
            }
        });

        config.legend.floating = false;
    } else if (mode === "treemap" || mode === "sunburst") {
        let [series, top, colorRange] = make_tree_data(js, row_pivots, hidden, aggregates);
        config.series = series;
        if (colorRange) {
            color_axis.call(this, config, colorRange);
        }
        config.plotOptions.series.borderWidth = 1;
        config.legend.floating = false;
    } else if (mode === 'line') {
        let [series, top, colorRange] = make_xy_data(js, row_pivots, col_pivots, hidden);
        const colors = series.length <= 10 ? COLORS_10 : COLORS_20;
        config.legend.floating = series.length <= 20;
        let num_cols = Object.keys(js[0]).filter(x => x !== '__ROW_PATH__').length - hidden.length;
        config.legend.enabled = num_cols > 2 || col_pivots.length > 0;
        config.series = series;
        config.plotOptions.scatter.marker = {enabled: false, radius: 0};
        config.colors = colors;
        set_axis(config, 'xAxis', xaxis_name, xaxis_type);
        set_axis(config, 'yAxis', yaxis_name, yaxis_type);
    } else {
        let [series, top, colorRange] = make_y_data(js, row_pivots, hidden);
        config.series = series;
        config.colors = series.length <= 10 ? COLORS_10 : COLORS_20;        
        set_category_axis(config, 'xAxis', xtree_type, top);
        config.legend.enabled = col_pivots.length > 0 || series.length > 1;
        config.legend.floating = series.length <= 20;
        Object.assign(config, {
            yAxis: {
                startOnTick: false,
                endOnTick: false,
                title: {
                    text: aggregates.map(x => x.column).join(",  "),
                    style: {'color': '#666666', 'fontSize': "14px"}
                },
                labels: {overflow: 'justify'}
            }
        });
        config.plotOptions.series.dataLabels = {
            allowOverlap: false,
            padding: 10
        }
    }

    if (this._chart) {
        if (mode === 'scatter') {
            let new_radius = Math.min(6, Math.max(2, Math.floor((this._chart.chartWidth + this._chart.chartHeight) / Math.max(300, config.series[0].data.length / 3))));
            this._chart.update({
                series: config.series,
                plotOptions: {
                    coloredScatter: {marker: {radius: new_radius}},
                    scatter: {marker: {radius: new_radius}}
                }
            });
        } else if (mode.indexOf('line') > -1) {
            this._chart.update({
                series: config.series
            });
        } else {
            let opts = {series: config.series, xAxis: config.xAxis, yAxis: config.yAxis};
            this._chart.update(opts);
        }
    } else {
        var chart = document.createElement('div');
        chart.className = 'chart';
        for (let e of Array.prototype.slice.call(el.children)) { el.removeChild(e); }
        el.appendChild(chart);
        this._chart = Highcharts.chart(chart, config);
    }

    if (!document.contains(this._chart.renderTo)) {
        for (let e of Array.prototype.slice.call(el.children)) { el.removeChild(e); }
        el.appendChild(this._chart.renderTo);
    }
}

