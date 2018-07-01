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
                useGPUTranslations: types.indexOf('date') === -1,
                usePreAllocated: types.indexOf('date') === -1
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
        type: type === "date" ? "datetime" : undefined,
        startOnTick: false,
        endOnTick: false,
        title: {
            style: {color: '#666666', fontSize: "14px"},
            text: name
        },
    };
    if (axis === 'yAxis') {
        Object.assign(opts, {labels : {overflow: 'justify'}});
    }
    Object.assign(config, {[axis]: opts});
}

export function set_category_axis(config, axis, type, top) {
    if (type === 'date') {
        Object.assign(config, {
            [axis]: {
                categories: top.categories.map(x => new Date(x).toLocaleString('en-us',  { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })),
                labels: {
                    enabled: (top.categories.length > 0),
                    autoRotation: [-5]
                },
            }
        });             
    } else {
        let opts = {
            categories: top.categories,
            labels: {
                enabled: (top.categories.length > 0),
                padding: 0,
                autoRotation: [-10, -20, -30, -40, -50, -60, -70, -80, -90],
            }
        }
        if (axis === 'yAxis') {
            Object.assign(opts, {
                title: null,
                tickWidth: 1,
                reversed: true,
            });
        } 
        Object.assign(config, {[axis]: opts});
    }
};

export function default_config(aggregates, mode, js, col_pivots) {

    let type = 'scatter';
    if (mode === 'y_line') {
        type = 'line';
    } else if (mode === 'y_area') {
        type = 'area';
    } else if (mode.indexOf('bar') > -1) {
        type = 'column';
    } else if (mode == 'treemap') {
        type = 'treemap';
    } else if (mode == 'sunburst') {
        type = 'sunburst';
    } else if (mode === 'scatter') {
        if (aggregates.length <= 3) {
            type = 'scatter';
        } else {
            type = 'bubble';
        }
    } else if (mode === 'heatmap') {
        type = 'heatmap';
    }

    // let new_radius = 0;
    // if (mode === 'scatter') {
    //     new_radius = Math.min(8, Math.max(4, Math.floor((this.clientWidth + this.clientHeight) / Math.max(300, series[0].data.length / 3))));
    // }
        
    return {
        chart: {
            type: type,
            inverted: mode.indexOf('horizontal') > -1,
            animation: false,
            zoomType: mode === 'scatter' ? 'xy' : 'x',
            resetZoomButton: {
                position: {
                    align: 'left',
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
            text: null,
        },
        legend: {
            align: 'right',
            verticalAlign: 'top',
            y: 10,
            layout: 'vertical',
            enabled: false,
            itemStyle: {
                fontWeight: 'normal'
            }
        },
        boost: {
            enabled: false
        },
        plotOptions: {
            area: {
                stacking: 'normal',
                marker: {enabled: false, radius: 0}
            },
            line: {
                marker: {enabled: false, radius: 0}
            },
            coloredScatter: {
                // marker: {radius: new_radius},
                tooltip: {
                    headerFormat: '<span>{point.key}</span><br/><span>{series.name}</span><br/>'
                }
            },
            scatter: {
                // marker: {radius: new_radius},
                tooltip: {
                    headerFormat: '<span>{point.key}</span><br/><span>{series.name}</span><br/>'
                }
            },
            column: {
                stacking: 'normal',
                states: {
                    hover: {
                        brightness: -0.1,
                        borderColor: '#000000'
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
}
