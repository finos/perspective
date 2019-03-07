/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as crossAxis from "../axis/crossAxis";
import {heatmapSeries} from "../series/heatmapSeries";
import {seriesColourRange} from "../series/seriesRange";
import {heatmapData} from "../data/heatmapData";
import {filterData} from "../legend/filter";
import chartSvgCartesian from "../d3fc/chart/svg/cartesian";
import {withGridLines} from "../gridlines/gridlines";
import {colourRangeLegend} from "../legend/colourRangeLegend";
import zoomableChart from "../zoom/zoomableChart";

function heatmapChart(container, settings) {
    const data = heatmapData(settings, filterData(settings));

    const colour = seriesColourRange(settings, data, "colorValue");
    const series = heatmapSeries(settings, colour);

    const legend = colourRangeLegend().scale(colour);

    const xScale = crossAxis.scale(settings);
    const yScale = crossAxis.scale(settings, "splitValues");
    const chart = chartSvgCartesian(xScale, yScale)
        .xDomain(crossAxis.domain(settings)(data))
        .yDomain(
            crossAxis
                .domain(settings)
                .settingName("splitValues")
                .valueName("mainValue")(data)
                .reverse()
        )
        .yOrient("left")
        .plotArea(withGridLines(series));

    crossAxis.styleAxis(chart, "x", settings, "crossValues");
    crossAxis.styleAxis(chart, "y", settings, "splitValues");

    chart.xPaddingInner && chart.xPaddingInner(0);
    chart.xPaddingOuter && chart.xPaddingOuter(0);
    chart.yPaddingInner && chart.yPaddingInner(0);
    chart.yPaddingOuter && chart.yPaddingOuter(0);

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xScale)
        .yScale(yScale);

    // render
    container.datum(data).call(zoomChart);
    container.call(legend);
}
heatmapChart.plugin = {
    type: "d3_heatmap",
    name: "[d3fc] Heatmap",
    max_size: 25000
};

export default heatmapChart;
