/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import Highcharts from "highcharts";

export const COLORS_10 = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
export const COLORS_20 = [
    "#1f77b4",
    "#aec7e8",
    "#ff7f0e",
    "#ffbb78",
    "#2ca02c",
    "#98df8a",
    "#d62728",
    "#ff9896",
    "#9467bd",
    "#c5b0d5",
    "#8c564b",
    "#c49c94",
    "#e377c2",
    "#f7b6d2",
    "#7f7f7f",
    "#c7c7c7",
    "#bcbd22",
    "#dbdb8d",
    "#17becf",
    "#9edae5"
];

Highcharts.setOptions({
    colors: COLORS_20
});

(function(H) {
    H.wrap(H.seriesTypes.scatter.prototype, "translate", function(translate) {
        translate.apply(this, Array.prototype.slice.call(arguments, 1));
        if (this.chart.userOptions.chart.type.slice(0, 7) === "colored") {
            this.translateColors.call(this);
        }
    });
    var seriesTypes = H.seriesTypes,
        merge = H.merge,
        extendClass = H.extendClass,
        defaultOptions = H.getOptions(),
        plotOptions = defaultOptions.plotOptions;
    var colorSeriesMixin = {
        optionalAxis: "colorAxis",
        colorKey: "colorValue",
        translateColors: seriesTypes.heatmap && seriesTypes.heatmap.prototype.translateColors
    };
    plotOptions.coloredColumn = merge(plotOptions.column, {});
    seriesTypes.coloredColumn = extendClass(
        seriesTypes.column,
        merge(colorSeriesMixin, {
            type: "coloredColumn",
            axisTypes: ["xAxis", "yAxis", "colorAxis"]
        })
    );
    plotOptions.coloredScatter = merge(plotOptions.scatter, {});
    seriesTypes.coloredScatter = extendClass(
        seriesTypes.scatter,
        merge(colorSeriesMixin, {
            type: "coloredScatter",
            axisTypes: ["xAxis", "yAxis", "colorAxis"]
        })
    );
    plotOptions.coloredBubble = merge(plotOptions.bubble, {});
    seriesTypes.coloredBubble = extendClass(
        seriesTypes.bubble,
        merge(colorSeriesMixin, {
            type: "coloredBubble",
            axisTypes: ["xAxis", "yAxis", "colorAxis"]
        })
    );

    // draw points and add setting colors
    H.wrap(H.seriesTypes.sunburst.prototype, "translate", function(p, positions) {
        p.call(this, positions);
        this.translateColors();
    });

    // copy method from heatmap for color mixin
    H.seriesTypes.sunburst.prototype.translateColors = function() {
        var series = this,
            nullColor = this.options.nullColor,
            colorAxis = this.colorAxis,
            colorKey = this.colorKey;

        H.each(this.data, function(point) {
            var value = point[colorKey],
                color;

            color =
                point.options.color ||
                (!point.value // LINE CHANGED
                    ? nullColor
                    : colorAxis && value !== undefined
                    ? colorAxis.toColor(value, point)
                    : point.color || series.color);

            if (color) {
                point.color = color;
            }
        });
    };

    // use "colorValue" to calculate color
    H.seriesTypes.sunburst.prototype.colorKey = "colorValue";
})(Highcharts);
