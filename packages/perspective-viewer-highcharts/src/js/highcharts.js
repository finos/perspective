/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import '@jpmorganchase/perspective-common';

import highcharts from 'highcharts';

const Highcharts = highcharts;

import {COLORS_10, COLORS_20} from "./heatmap.js";

const chroma = require('chroma-js');

function _make_scatter_tick(row, columns, is_string, colorRange) {
    var tick = {};
    tick.x = row[columns[0]];
    tick.x = (tick.x === undefined || tick.x === "" || isNaN(tick.x)  ? null : tick.x);
    tick.y = 0;
    if (columns.length > 1) {
        tick.y = row[columns[1]];
        tick.y = (tick.y === undefined || tick.y === "" || isNaN(tick.y) ? null : tick.y);
    }

    // Color by
    if (columns.length > 2) {
        let color = row[columns[2]];
        if (typeof color === "string") {
            if (!(color in is_string)) {
                is_string[color] = COLORS_20[Object.keys(is_string).length];
            }
            tick.marker = {
                lineColor: is_string[color],
                fillColor: is_string[color]
            };
        } else {
            if (!isNaN(color)) {
                colorRange[0] = Math.min(colorRange[0], color);
                colorRange[1] = Math.max(colorRange[1], color);
            }
            tick.colorValue = color;
        }
    }
    // size by
    if (columns.length > 3) {
        tick.z = isNaN(row[columns[3]]) ? 1 : row[columns[3]];
    }
    return tick;
}

function _make_series(js, pivots, col_pivots, mode, hidden) {
    var depth = pivots.length; //(color[0] === '' ? 1 : 0);
    var top = {name: "", depth:0, categories: []};
    var label = top;

    var series = [], leaf_size = 0;
    let colorRange = [Infinity, -Infinity];
    let is_string = {};
    let columns, is_stacked;

    let scale = chroma.scale('RdYlBu');

    for (let row of visible_rows(js, hidden)) {

        // If this is the first row, record some structural properties from it.
        if (!columns || !is_stacked) {
            columns = Object.keys(js[0]).filter(prop => prop !== "__ROW_PATH__");
            is_stacked = columns.map(value =>
                value.substr(value.lastIndexOf(',') + 1, value.length)
            ).filter((value, index, self) =>
                self.indexOf(value) === index
            ).length > 1;
        }

        var path = row.__ROW_PATH__;
        if (!path) {
            path = [''];
        }

        var d = path.length;
        if (d == 0) {
            // Skip the root
        } else if (d < depth) {

            // Add new label
            label = {
                name: path[d-1],
                depth: d,
                categories: []
            }

            // Find the correct parent
            var parent = top;
            for (var lidx=0; lidx < (d-1); lidx++) {
                for (var cidx=0; cidx<parent.categories.length; cidx++) {
                    if (parent.categories[cidx].name == path[lidx]) {
                        parent = parent.categories[cidx];
                        break;
                    }
                }
            }
            parent.categories.push(label);
        } else {
            var sname = path[d-1];
            label.categories.push(sname);
            if ((mode === 'scatter' || mode === 'line') && columns.length > 0) {
                if (col_pivots.length === 0) {
                    var sname = 'x';
                    var s;
                    for (var sidx = 0; sidx < series.length; sidx++) {
                        if (series[sidx].name == sname) {
                            s = series[sidx];
                            break;
                        }
                    }
                    if (sidx == series.length) {
                        s = {
                            name: sname,
                            connectNulls: true,
                            data: [],
                        };
                        while (s.data.length < leaf_size) {
                            s.data.push(0);
                        }
                        series.push(s)
                    }
                    s.data.push(_make_scatter_tick(row, columns, is_string, colorRange));
                } else {
                    let prev, group = [];
                    for (let prop of columns) {
                        var sname = prop.split(',');
                        var gname = sname[sname.length - 1];
                        sname = sname.slice(0, sname.length - 1).join(", ") || " ";
                        var s;
                        if (prev === undefined) prev = sname;
                        for (var sidx = 0; sidx < series.length; sidx++) {
                            if (series[sidx].name == prev) {
                                s = series[sidx];
                                break;
                            }
                        }
                        if (sidx == series.length) {
                            s = {
                                name: prev,
                                connectNulls: true,
                                data: [],
                            };
                            while (s.data.length < leaf_size) {
                                s.data.push(0);
                            }
                            series.push(s)
                        }
                        if (prev === sname) {
                            group.push(prop);
                        } else {
                            prev = sname;
                            s.data.push(_make_scatter_tick(row, group, is_string, colorRange));
                            group = [prop];
                        }
                    }
                    s.data.push(_make_scatter_tick(row, group, is_string, colorRange));
                }
            } else {
                columns.map(prop => {
                    var sname = prop.split(',');
                    var gname = sname[sname.length - 1];
                    if (is_stacked) {
                        sname = sname.join(", ") || gname;
                    } else {
                        sname = sname.slice(0, sname.length - 1).join(", ") || " ";
                    }
                    var s;
                    for (var sidx=0; sidx<series.length; sidx++) {
                        if (series[sidx].name == sname && series[sidx].stack == gname) {
                            s = series[sidx];
                            break;
                        }
                    }
                    if (sidx == series.length) {
                        s = {
                            name: sname,
                            stack: gname,
                            connectNulls: true,
                            data: [],
                        };
                        while (s.data.length < leaf_size) {
                            s.data.push(0);
                        }
                        series.push(s)
                    }
                    var val = row[prop];
                    val = (val === undefined || val === "" ? null : val)
                    s.data.push(val);
                });
            }
        }
    }
    return [series, top, colorRange];
}

function* visible_rows(json, hidden) {
    let first = json[0];
    let to_delete = [];
    for (let key in first) {
        let split_key = key.split(',');
        if (hidden.indexOf(split_key[split_key.length - 1].trim()) >= 0) {
            to_delete.push(key);
        }
    }
    for (let row of json) {
        for (let h of to_delete) {
            delete row[h];
        }
        yield row;
    }
}

export function draw(mode) {
    return async function(el, view, hidden, redraw, task) {
        var row_pivots = this._view_columns('#row_pivots perspective-row:not(.off)');
        var col_pivots = this._view_columns('#column_pivots perspective-row:not(.off)');
        var aggregates = this._get_view_aggregates();

        let [js, schema] = await Promise.all([view.to_json(), view.schema()]);

        if (task.cancelled) {
            return;
        }

        let [series, top, colorRange] = _make_series.call(this, js, row_pivots, col_pivots, mode, hidden);

        var colors = COLORS_20;
        if (series.length <= 10) {
            colors = COLORS_10;
        }

        var type = 'scatter';
        if (mode.indexOf('bar') > -1) {
            type = 'column';
        } else if (mode === 'scatter') {
            if (aggregates.length <= 3) {
                type = 'scatter';
            } else {
                type = 'bubble';
            }
        }

        let new_radius = 0;
        if (mode === 'scatter') {
            new_radius = Math.min(8, Math.max(4, Math.floor((this.clientWidth + this.clientHeight) / 240)));
        }
        
        var config = {
            chart: {
                type: type,
                inverted: mode.indexOf('horizontal') > -1,
                animation: false,
                marginRight: (series.length > 20) ? 150 : 0,
                zoomType: mode === 'scatter' ? 'xy' : 'x',
            },
            navigation: {
                buttonOptions: {
                    enabled: false
                }
            },
            credits: {enabled: false},
            title: {
                text: null,
            },
            legend: {
                align: 'right',
                verticalAlign: 'top',
                y: 10,
                width: mode === "scatter" ? 30 : 140,
                layout: 'vertical',
                enabled: Object.keys(js[0]).length > 2 && mode !== 'scatter',

                itemStyle: {
                    fontWeight: 'normal'
                }
            },
            plotOptions: {
                coloredScatter: {marker: {radius: new_radius}},
                scatter: {marker: {radius: new_radius}},
                column: {
                    stacking: 'normal',
                    states: {
                        hover: {
                            brightness: -0.1,
                            borderColor: '#000000'
                        }
                    }
                },
                series: {
                    animation: false,
                    'turboThreshold': 60000,
                    borderWidth: 0,
                    connectNulls: true,
                    lineWidth: mode.indexOf('line') === -1 ? 0 : 1.5,
                    states: {
                        hover: {
                            lineWidthPlus: 0,
                        },
                    },
                    events: {
                        legendItemClick: function(event) {
                            //console.log(this);
                            //return false;
                        },
                        click: function(event) {
                            console.log(this);
                        }
                    }
                }
            },
            series: series,
            tooltip: {
                animation: false,
                backgroundColor: '#FFFFFF',
                borderColor: '#777777',
                followPointer: false,
                positioner: function (labelWidth, labelHeight, point) {
                    var chart = this.chart;
                    var tooltipX, tooltipY;
                    if (point.plotX + labelWidth > chart.plotWidth) {
                        tooltipX = point.plotX + chart.plotLeft - labelWidth;
                    } else {
                        tooltipX = point.plotX + chart.plotLeft;
                    }
                    tooltipY = point.plotY + chart.plotTop;
                    return {
                        x: tooltipX,
                        y: tooltipY
                    };
                }
            },
        }
        let xaxis_name = aggregates.length > 0 ? aggregates[0].column : undefined,
            xaxis_type = schema[xaxis_name],
            yaxis_name = aggregates.length > 1 ? aggregates[1].column : undefined,
            yaxis_type = schema[yaxis_name];

        if (mode === 'scatter') {

            if (colorRange[0] !== Infinity) {
                if (aggregates.length <= 3) {
                    config.chart.type = 'coloredScatter';
                } else {
                    config.chart.type = 'coloredBubble';
                }
                Object.assign(config, {
                    colorAxis: {
                        min: colorRange[0],
                        max: colorRange[1],
                        minColor: '#3060cf',
                        maxColor: '#c4463a',
                        showInLegend: false,
                        stops: [
                            [0, '#3060cf'],
                            [0.5, '#fffbbc'],
                            [0.9, '#c4463a'],
                            [1, '#c4463a']
                        ],
                        startOnTick: false,
                        endOnTick: false,
                    }
                });
            }
            Object.assign(config, {
                xAxis: {
                    type: xaxis_type === "date" ? "datetime" : undefined,
                    startOnTick: false,
                    endOnTick: false,
                    title: {
                        style: {'color': '#666666', 'fontSize': "14px"},
                        text: aggregates.length > 0 ? aggregates[0].column : undefined
                    }
                },
                yAxis: {
                    type: yaxis_type === "date" ? "datetime" : undefined,
                    startOnTick: false,
                    endOnTick: false,
                    title: {
                        text: aggregates.length > 1 ? aggregates[1].column : undefined,
                        style: {'color': '#666666', 'fontSize': "14px"}
                    },
                    labels: {overflow: 'justify'}
                }
            });
        } else if (mode.indexOf('line') !== -1) {
            Object.assign(config, {
                colors: colors,
                xAxis: {
                    type: xaxis_type === "date" ? "datetime" : undefined,
                    startOnTick: false,
                    endOnTick: false,
                    title: {
                        style: {'color': '#666666', 'fontSize': "14px"},
                        text: xaxis_name
                    }
                },
                yAxis: {
                    type: yaxis_type === "date" ? "datetime" : undefined,
                    startOnTick: false,
                    endOnTick: false,
                    title: {
                        text: yaxis_name,
                        style: {'color': '#666666', 'fontSize': "14px"}
                    },
                    labels: {overflow: 'justify'}
                }
            });
        } else {
            Object.assign(config, {
                colors: colors,
                xAxis: {
                    categories: top.categories,
                    labels: {
                        enabled: (top.categories.length > 0),
                        padding: 0,
                        autoRotation: [-10, -20, -30, -40, -50, -60, -70, -80, -90],
                    },
                },
                yAxis: {
                    startOnTick: false,
                    endOnTick: false,
                    title: {
                        text: aggregates.map(function (x) { return x.column; }).join(",  "),
                        style: {'color': '#666666', 'fontSize': "14px"}
                    },
                    labels: {overflow: 'justify'}
                }

            });
        }

        if (redraw && this._chart) {
            chart = this._chart
            this._chart = undefined;
            try {
                chart.destroy();
            } catch (e) {
                console.warn("Scatter plot destroy() call failed - this is probably leaking memory");
            }
        }

        if (this._chart) {
            if (mode === 'scatter') {
                let new_radius = Math.min(8, Math.max(4, Math.floor((this._chart.chartWidth + this._chart.chartHeight) / 240)));
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
                this._chart.update({
                    series: config.series,
                    xAxis: {
                        categories: top.categories,
                        labels: {
                            enabled: (top.categories.length > 0),
                            padding: 0,
                            autoRotation: [-10, -20, -30, -40, -50, -60, -70, -80, -90],
                        },
                    },
                });
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
    };
}

function resize(immediate) {
    if (immediate && this._chart) {
        this._chart.reflow();
    } else {
        if (this.resize_timer) {
            clearTimeout(this.resize_timer);
        }
        this.resize_timer = setTimeout(() => {
            if (this._chart && !document.hidden && this.offsetParent && document.contains(this)) {
                this.resize_timer = undefined;
                this._chart.reflow();
            }
        }, 50);
    }
}

function delete_chart() {
    if (this._chart) {
        this._chart.destroy();
        this._chart = undefined;
    }
}

global.registerPlugin("vertical", {
    name: "Bar Chart", 
    create: draw("vertical_bar"), 
    resize: resize, 
    selectMode: "select",
    delete: delete_chart
});

global.registerPlugin("horizontal", {
    name: "Bar Chart (inverted)", 
    create: draw("horizontal_bar"), 
    resize: resize, 
    selectMode: "select",
    delete: delete_chart
});

global.registerPlugin("line", {
    name: "Line Chart", 
    create: draw("line"), 
    resize: resize, 
    selectMode: "select",
    delete: delete_chart
});

global.registerPlugin("scatter", {
    name: "Scatter Chart", 
    create: draw('scatter'), 
    resize: resize, 
    selectMode: "select",
    delete: delete_chart
});

