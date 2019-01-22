/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export function set_boost(config, series, ...types) {
    const count = config.series[0].data ? config.series[0].data.length * config.series.length : config.series.length;
    if (count > 5000) {
        Object.assign(config, {
            boost: {
                useGPUTranslations: types.indexOf("datetime") === -1 && types.indexOf("date") === -1,
                usePreAllocated: types.indexOf("datetime") === -1 && types.indexOf("date") === -1
            }
        });
        config.plotOptions.series.boostThreshold = 1;
        config.plotOptions.series.turboThreshold = 0;
        return true;
    }
}

export function set_tick_size(config) {
    let new_radius = Math.min(6, Math.max(3, Math.floor((this.clientWidth + this.clientHeight) / Math.max(300, config.series[0].data.length / 3))));
    config.plotOptions.coloredScatter = {marker: {radius: new_radius}};
    config.plotOptions.scatter = {marker: {radius: new_radius}};
}

export function set_both_axis(config, axis, name, type, tree_type, top) {
    if (type === "string") {
        set_category_axis(config, axis, tree_type, top);
    } else {
        set_axis(config, axis, name, type);
    }
}

export function set_axis(config, axis, name, type) {
    let opts = {
        type: ["datetime", "date"].indexOf(type) > -1 ? "datetime" : undefined,
        startOnTick: false,
        endOnTick: false,
        title: {
            style: {color: "#666666", fontSize: "14px"},
            text: name
        }
    };
    if (axis === "yAxis") {
        Object.assign(opts, {labels: {overflow: "justify"}});
    }
    Object.assign(config, {[axis]: opts});
}

export function set_category_axis(config, axis, type, top) {
    if (type === "datetime") {
        Object.assign(config, {
            [axis]: {
                categories: top.categories.map(x => new Date(x).toLocaleString("en-us", {year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric"})),
                labels: {
                    enabled: top.categories.length > 0,
                    autoRotation: [-5]
                }
            }
        });
    } else if (type === "date") {
        Object.assign(config, {
            [axis]: {
                categories: top.categories.map(x => new Date(x).toLocaleString("en-us", {year: "numeric", month: "numeric", day: "numeric"})),
                labels: {
                    enabled: top.categories.length > 0,
                    autoRotation: [-5]
                }
            }
        });
    } else {
        let opts = {
            categories: top.categories,
            labels: {
                enabled: top.categories.length > 0,
                padding: 0,
                autoRotation: [-10, -20, -30, -40, -50, -60, -70, -80, -90]
            }
        };
        if (axis === "yAxis") {
            Object.assign(opts, {
                title: null,
                tickWidth: 1,
                reversed: true
            });
        }
        Object.assign(config, {[axis]: opts});
    }
}

export function default_config(aggregates, mode) {
    let type = "scatter";
    let hover_type = "xy";
    if (mode === "y_line") {
        hover_type = "y";
        type = "line";
    } else if (mode === "y_area") {
        hover_type = "y";
        type = "area";
    } else if (mode === "y_scatter") {
        hover_type = "y";
        type = "scatter";
    } else if (mode.indexOf("bar") > -1) {
        hover_type = "y";
        type = "column";
    } else if (mode == "treemap") {
        hover_type = "hierarchy";
        type = "treemap";
    } else if (mode == "sunburst") {
        hover_type = "hierarchy";
        type = "sunburst";
    } else if (mode === "scatter") {
        hover_type = "xy";
        if (aggregates.length <= 3) {
            type = "scatter";
        } else {
            type = "bubble";
        }
    } else if (mode === "heatmap") {
        hover_type = "xyz";
        type = "heatmap";
    }

    const that = this,
        config = that._view._config;

    const axis_titles = get_axis_titles(config.aggregate);
    const pivot_titles = get_pivot_titles(config.row_pivot, config.column_pivot);

    return {
        chart: {
            type: type,
            inverted: mode.indexOf("horizontal") > -1,
            animation: false,
            zoomType: mode === "scatter" ? "xy" : "x",
            resetZoomButton: {
                position: {
                    align: "left"
                }
            }
        },
        navigation: {
            buttonOptions: {
                enabled: false
            }
        },
        credits: {enabled: false},
        title: {
            text: null
        },
        legend: {
            align: "right",
            verticalAlign: "top",
            y: 10,
            layout: "vertical",
            enabled: false,
            itemStyle: {
                fontWeight: "normal"
            }
        },
        boost: {
            enabled: false
        },

        plotOptions: {
            area: {
                stacking: "normal",
                marker: {enabled: false, radius: 0}
            },
            line: {
                marker: {enabled: false, radius: 0}
            },
            coloredScatter: {
                // marker: {radius: new_radius},
            },
            scatter: {
                // marker: {radius: new_radius},
            },
            column: {
                stacking: "normal",
                states: {
                    hover: {
                        // add ajax
                        brightness: -0.1,
                        borderColor: "#000000"
                    }
                }
            },
            heatmap: {
                nullColor: "rgba(0,0,0,0)"
            },
            series: {
                animation: false,
                nullColor: "rgba(0,0,0,0)",
                boostThreshold: 0,
                turboThreshold: 60000,
                borderWidth: 0,
                connectNulls: true,
                lineWidth: mode.indexOf("line") === -1 ? 0 : 1.5,
                states: {
                    hover: {
                        lineWidthPlus: 0
                    }
                },
                events: {
                    legendItemClick: function() {
                        console.log(this);
                    },
                    click: function() {
                        console.log(this);
                    }
                }
            }
        }
    };
}

function get_axis_titles(aggs) {
    let titles = [];

    for (let i = 0; i < aggs.length; i++) {
        let axis_title = aggs[i].column;
        titles.push(axis_title);
    }
    return titles;
}

function get_pivot_titles(row_pivots, column_pivots) {
    return {
        row: row_pivots,
        column: column_pivots
    };
}
