/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import * as crossAxis from "../axis/crossAxis";
import {heatmapSeries} from "../series/heatmapSeries";
import {seriesColorRange} from "../series/seriesRange";
import {heatmapData} from "../data/heatmapData";
import {filterData} from "../legend/filter";
import withGridLines from "../gridlines/gridlines";
import {colorRangeLegend} from "../legend/colorRangeLegend";
import zoomableChart from "../zoom/zoomableChart";

function heatmapChart(container, settings) {
    const data = heatmapData(settings, filterData(settings));

    const color = seriesColorRange(settings, data, "colorValue");
    const series = heatmapSeries(settings, color);

    const legend = colorRangeLegend().scale(color);

    const xDomain = crossAxis.domain(settings)(data);
    const xScale = crossAxis.scale(settings);
    const xAxis = crossAxis.axisFactory(settings).domain(xDomain)();

    const yDomain = crossAxis
        .domain(settings)
        .settingName("splitValues")
        .valueName("mainValue")(data)
        .reverse();
    const yScale = crossAxis.scale(settings, "splitValues");
    const yAxis = crossAxis
        .axisFactory(settings)
        .settingName("splitValues")
        .orient("vertical")
        .domain(yDomain)();

    const chart = fc
        .chartSvgCartesian({
            xScale,
            yScale,
            xAxis,
            yAxis
        })
        .xDomain(xDomain)
        .xLabel(crossAxis.label(settings))
        .xAxisHeight(xAxis.size)
        .xDecorate(xAxis.decorate)
        .yDomain(yDomain)
        .yLabel(crossAxis.label(settings, "splitValues"))
        .yAxisWidth(yAxis.size)
        .yDecorate(yAxis.decorate)
        .yOrient("left")
        .plotArea(withGridLines(series));

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
