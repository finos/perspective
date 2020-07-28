/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import highcharts from "highcharts";
import highchartsMore from "highcharts/highcharts-more";
import heatmap from "highcharts/modules/heatmap";
import boost from "highcharts/modules/boost";
import treemap from "highcharts/modules/treemap";
import sunburst from "highcharts/modules/sunburst";
import grouped_categories from "highcharts-grouped-categories";

// cache prototypes
let axisProto = highcharts.Axis.prototype,
    // cache original methods
    protoAxisRender = axisProto.render,
    UNDEFINED = void 0;

highchartsMore(highcharts);
heatmap(highcharts);
treemap(highcharts);
sunburst(highcharts);
grouped_categories(highcharts);
boost(highcharts);

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
                // #58: use tickWidth/tickColor instead of
                // lineWidth/lineColor:
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
