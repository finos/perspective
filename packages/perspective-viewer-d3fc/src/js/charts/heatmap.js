/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
import * as fc from "d3fc";
import * as crossAxis from "../axis/crossAxis";
//import * as otherAxis from "../axis/otherAxis";
import {heatmapSeries} from "../series/heatmapSeries";
import {heatmapData} from "../data/heatmapData";
import {filterData} from "../legend/filter";
import chartSvgCartesian from "../d3fc/chart/svg/cartesian";
import {withGridLines} from "../gridlines/gridlines";
import {legend} from "../legend/colorLegend";

function heatmapChart(container, settings) {
    const data = heatmapData(settings, filterData(settings));
    const colorInterpolate = d3.interpolateViridis;

    const series = heatmapSeries(settings, colorInterpolate);

    const extent = fc.extentLinear().accessors([d => d.colorValue]);

    const colourDomain = extent(data);
    legend(container, colorInterpolate, colourDomain);

    const chart = chartSvgCartesian(crossAxis.scale(settings), crossAxis.scale(settings, "splitValues"))
        .xDomain(crossAxis.domain(settings)(data))
        .yDomain(
            crossAxis
                .domain(settings)
                .settingName("splitValues")
                .valueName("mainValue")(data)
        )
        .yOrient("left")
        .plotArea(withGridLines(series));

    crossAxis.styleAxis(chart, "x", settings, "crossValues");
    crossAxis.styleAxis(chart, "y", settings, "splitValues");

    chart.xPaddingInner && chart.xPaddingInner(0);
    chart.xPaddingOuter && chart.xPaddingOuter(0);
    chart.yPaddingInner && chart.yPaddingInner(0);
    chart.yPaddingOuter && chart.yPaddingOuter(0);

    // render
    container.datum(data).call(chart);
}
heatmapChart.plugin = {
    type: "d3_heatmap",
    name: "[d3fc] Heatmap",
    max_size: 25000
};

export default heatmapChart;
