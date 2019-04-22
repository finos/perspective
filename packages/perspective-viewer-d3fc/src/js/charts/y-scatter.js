/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import {axisFactory} from "../axis/axisFactory";
import {AXIS_TYPES} from "../axis/axisType";
import {chartSvgFactory} from "../axis/chartFactory";
import {seriesColors} from "../series/seriesColors";
import {categoryPointSeries, symbolType} from "../series/categoryPointSeries";
import {groupData} from "../data/groupData";
import {symbolLegend} from "../legend/legend";
import {filterData} from "../legend/filter";
import withGridLines from "../gridlines/gridlines";
import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";

function yScatter(container, settings) {
    const data = groupData(settings, filterData(settings));
    const symbols = symbolType(settings);
    const color = seriesColors(settings);

    const legend = symbolLegend()
        .settings(settings)
        .scale(symbols)
        .color(color);

    const series = fc
        .seriesSvgMulti()
        .mapping((data, index) => data[index])
        .series(data.map(series => categoryPointSeries(settings, series.key, color, symbols)));

    const paddingStrategy = hardLimitZeroPadding()
        .pad([0.05, 0.05])
        .padUnit("percent");

    const xAxis = axisFactory(settings)
        .excludeType(AXIS_TYPES.linear)
        .settingName("crossValues")
        .valueName("crossValue")(data);
    const yAxis = axisFactory(settings)
        .settingName("mainValues")
        .valueName("mainValue")
        .orient("vertical")
        .paddingStrategy(paddingStrategy)(data);

    const chart = chartSvgFactory(xAxis, yAxis).plotArea(withGridLines(series).orient("vertical"));

    chart.yNice && chart.yNice();

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xAxis.scale);

    const toolTip = nearbyTip()
        .settings(settings)
        .xScale(xAxis.scale)
        .yScale(yAxis.scale)
        .color(color)
        .data(data);

    // render
    container.datum(data).call(zoomChart);
    container.call(toolTip);
    if (legend) {
        container.call(legend);
    }
}
yScatter.plugin = {
    type: "d3_y_scatter",
    name: "Y Scatter Chart",
    max_size: 25000
};

export default yScatter;
