/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import Highcharts from 'highcharts';

import "../less/highcharts.less";

import {COLORS_10, COLORS_20} from "./externals.js";
import {color_axis} from "./color_axis.js";
import {make_tree_data, make_y_data, make_xy_data, make_xyz_data} from "./series.js";
import {set_boost, set_axis, set_category_axis, set_both_axis, default_config, set_tick_size} from "./config.js";

export const draw = (mode) => async function (el, view, task) {
    const row_pivots = this._view_columns('#row_pivots perspective-row:not(.off)');
    const col_pivots = this._view_columns('#column_pivots perspective-row:not(.off)');
    const aggregates = this._get_view_aggregates();
    const hidden = this._get_view_hidden(aggregates);

    const [js, schema, tschema] = await Promise.all([view.to_json(), view.schema(), this._table.schema()]);

    if (task.cancelled) {
        return;
    }

    if (!this._charts) {
        this._charts = [];
    }

    if (this.hasAttribute('updating') && this._charts.length > 0) {
        for (let chart of this._charts) {
            try {
                chart.destroy();
            } catch (e) {
                console.warn("Scatter plot destroy() call failed - this is probably leaking memory");
            }
        }
        this._charts = [];
    }

    let configs = [],
        xaxis_name = aggregates.length > 0 ? aggregates[0].column : undefined,
        xaxis_type = schema[xaxis_name],
        yaxis_name = aggregates.length > 1 ? aggregates[1].column : undefined,
        yaxis_type = schema[yaxis_name],
        xtree_name = row_pivots.length > 0 ? row_pivots[row_pivots.length - 1] : undefined,
        xtree_type = tschema[xtree_name],
        ytree_name = col_pivots.length > 1 ? col_pivots[col_pivots.length - 1] : undefined,
        ytree_type = tschema[ytree_name],
        num_aggregates = aggregates.length - hidden.length;

    if (mode === 'scatter') {
        let config = configs[0] = default_config.call(this, aggregates, mode, js, col_pivots);
        let [series, xtop, colorRange, ytop] = make_xy_data(js, schema, aggregates.map(x => x.column), row_pivots, col_pivots, hidden);
        config.legend.floating = series.length <= 20;
        config.legend.enabled = col_pivots.length > 0;
        config.series = series;
        config.colors = series.length <= 10 ? COLORS_10 : COLORS_20;
        if (colorRange[0] !== Infinity) {
            if (aggregates.length <= 3) {
                config.chart.type = 'coloredScatter';
            } else {
                config.chart.type = 'coloredBubble';
            }
            color_axis.call(this, config, colorRange);
        }
        if (num_aggregates < 3) {
            set_boost(config, xaxis_type, yaxis_type);
        }
        set_both_axis(config, 'xAxis', xaxis_name, xaxis_type, xtree_type, xtop);
        set_both_axis(config, 'yAxis', yaxis_name, yaxis_type, ytree_type, ytop);
        set_tick_size.call(this, config);
    } else if (mode === 'heatmap') {
        let config = configs[0] = default_config.call(this, aggregates, mode, js, col_pivots);
        let [series, top, ytop, colorRange] = make_xyz_data(js, row_pivots, hidden);
        config.series = [{
            name: null,
            data: series,
            nullColor: 'none'
        }];
        config.legend.enabled = true;
        config.legend.floating = false;

        color_axis.call(this, config, colorRange);
        set_boost(config, xaxis_type, yaxis_type);
        set_category_axis(config, 'xAxis', xtree_type, top);
        set_category_axis(config, 'yAxis', ytree_type, ytop);

    } else if (mode === "treemap" || mode === "sunburst") {
        let [charts, , colorRange] = make_tree_data(js, row_pivots, hidden, aggregates, mode === "treemap");
        for (let series of charts) {
            let config = default_config.call(this, aggregates, mode, js, col_pivots);
            config.series = [series];
            if (charts.length > 1) {
                config.title.text = series.title;
            }
            config.plotOptions.series.borderWidth = 1;
            config.legend.floating = false;
            if (colorRange) {
                color_axis.call(this, config, colorRange);
            }
            configs.push(config);
        }
    } else if (mode === 'line') {
        let config = configs[0] = default_config.call(this, aggregates, mode, js, col_pivots);
        let [series, xtop, , ytop] = make_xy_data(js, schema, aggregates.map(x => x.column), row_pivots, col_pivots, hidden);
        const colors = series.length <= 10 ? COLORS_10 : COLORS_20;
        config.legend.floating = series.length <= 20;
        config.legend.enabled = col_pivots.length > 0;
        config.series = series;
        config.plotOptions.scatter.marker = {enabled: false, radius: 0};
        config.colors = colors;
        if (set_boost(config, xaxis_type, yaxis_type)) {
            delete config.chart['type'];
        }
        set_both_axis(config, 'xAxis', xaxis_name, xaxis_type, xtree_type, xtop);
        set_both_axis(config, 'yAxis', yaxis_name, yaxis_type, ytree_type, ytop);
    } else {
        let config = configs[0] = default_config.call(this, aggregates, mode, js, col_pivots);
        let [series, top, ] = make_y_data(js, row_pivots, hidden);
        config.series = series;
        config.colors = series.length <= 10 ? COLORS_10 : COLORS_20;        
        config.legend.enabled = col_pivots.length > 0 || series.length > 1;
        config.legend.floating = series.length <= 20;
        config.plotOptions.series.dataLabels = {
            allowOverlap: false,
            padding: 10
        }
        set_category_axis(config, 'xAxis', xtree_type, top);
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
    }

    if (this._charts.length > 0) {
        let idx = 0;
        for (let chart of this._charts) {
            let config = configs[idx++];
            if (mode === 'scatter') {
                let conf = {
                    series: config.series,
                    plotOptions: {}
                };
                set_tick_size.call(this, conf);
                chart.update(conf);
            } else if (mode.indexOf('line') > -1) {
                chart.update({
                    series: config.series
                });
            } else {
                let opts = {series: config.series, xAxis: config.xAxis, yAxis: config.yAxis};
                chart.update(opts);
            }
        }
    } else {
        this._charts = [];
        for (let e of Array.prototype.slice.call(el.children)) { el.removeChild(e); }
        for (let config of configs) {
            let chart = document.createElement('div');
            chart.className = 'chart';
            el.appendChild(chart);
            this._charts.push(() => Highcharts.chart(chart, config));
        }

        this._charts = this._charts.map(x => x());
    }

    if (!this._charts.every(x => document.contains(x.renderTo))) {
        for (let e of Array.prototype.slice.call(el.children)) { el.removeChild(e); }
        this._charts.map(x => el.appendChild(x.renderTo));
    }

    // TODO resize bug in Highcharts?
    if (configs.length > 1) {
       this._charts.map(x => x.reflow());
    }
}

