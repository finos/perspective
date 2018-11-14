/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import highcharts from "highcharts";
import highchartsMore from "highcharts-more";
import heatmap from "highcharts/modules/heatmap";
import boost from "highcharts/modules/boost";
import treemap from "highcharts/modules/treemap";
import sunburst from "highcharts/modules/sunburst";
import grouped_categories from "highcharts-grouped-categories";

const Highcharts = highcharts;

// cache prototypes
let axisProto = Highcharts.Axis.prototype,
    // cache original methods
    protoAxisRender = axisProto.render,
    UNDEFINED = void 0;

highchartsMore(highcharts);
heatmap(highcharts);
treemap(highcharts);
sunburst(highcharts);
grouped_categories(highcharts);
boost(highcharts);

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

    // Pushes part of grid to path
    function walk(arr, key, fn) {
        var l = arr.length,
            children;

        while (l--) {
            children = arr[l][key];

            if (children) {
                walk(children, key, fn);
            }
            fn(arr[l]);
        }
    }
    axisProto.render = function() {
        // clear grid path
        if (this.isGrouped) {
            this.labelsGridPath = [];
        }

        // cache original tick length
        if (this.originalTickLength === UNDEFINED) {
            this.originalTickLength = this.options.tickLength;
        }

        // use default tickLength for not-grouped axis
        // and generate grid on grouped axes,
        // use tiny number to force highcharts to hide tick
        this.options.tickLength = this.isGrouped ? 0.001 : this.originalTickLength;

        protoAxisRender.call(this);

        if (!this.isGrouped) {
            if (this.labelsGrid) {
                this.labelsGrid.attr({
                    visibility: "hidden"
                });
            }
            return false;
        }

        var axis = this,
            options = axis.options,
            visible = axis.hasVisibleSeries || axis.hasData,
            grid = axis.labelsGrid,
            d = axis.labelsGridPath,
            tickWidth = axis.tickWidth;

        // render grid path for the first time
        if (!grid) {
            grid = axis.labelsGrid = axis.chart.renderer
                .path()
                .attr({
                    // #58: use tickWidth/tickColor instead of lineWidth/lineColor:
                    strokeWidth: tickWidth, // < 4.0.3
                    "stroke-width": tickWidth, // 4.0.3+ #30
                    stroke: options.tickColor || "" // for styled mode (tickColor === undefined)
                })
                .add(axis.axisGroup);
            // for styled mode - add class
            if (!options.tickColor) {
                grid.addClass("highcharts-tick");
            }
        }

        // draw grid path
        grid.attr({
            d: d,
            visibility: visible ? "visible" : "hidden"
        });

        axis.labelGroup.attr({
            visibility: visible ? "visible" : "hidden"
        });

        walk(axis.categoriesTree, "categories", function(group) {
            var tick = group.tick;

            if (!tick) {
                return false;
            }
            if (tick.startAt + tick.leaves - 1 < axis.min || tick.startAt > axis.max) {
                tick.label.hide();
                tick.destroyed = 0;
            } else {
                tick.label.attr({
                    visibility: visible ? "visible" : "hidden"
                });
            }
            return true;
        });
        return true;
    };
})(Highcharts);
