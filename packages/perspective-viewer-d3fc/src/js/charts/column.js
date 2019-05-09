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
import {chartSvgFactory} from "../axis/chartFactory";
import {AXIS_TYPES} from "../axis/axisType";
import {barSeries} from "../series/barSeries";
import {seriesColors} from "../series/seriesColors";
import {groupAndStackData} from "../data/groupData";
import {colorLegend} from "../legend/legend";
import {filterData} from "../legend/filter";
import withGridLines from "../gridlines/gridlines";
import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";

function columnChart(container, settings) {
    const data = groupAndStackData(settings, filterData(settings));
    const color = seriesColors(settings);

    const legend = colorLegend()
        .settings(settings)
        .scale(color);

    const bars = barSeries(settings, color).orient("vertical");
    const series = fc
        .seriesSvgMulti()
        .mapping((data, index) => data[index])
        .series(data.map(() => bars));

    const xAxis = axisFactory(settings)
        .excludeType(AXIS_TYPES.linear)
        .settingName("crossValues")
        .valueName("crossValue")(data);
    const yAxis = axisFactory(settings)
        .settingName("mainValues")
        .valueName("mainValue")
        .excludeType(AXIS_TYPES.ordinal)
        .orient("vertical")
        .include([0])
        .paddingStrategy(hardLimitZeroPadding())(data);

    const chart = chartSvgFactory(xAxis, yAxis).plotArea(withGridLines(series).orient("vertical"));

    if (chart.xPaddingInner) {
        chart.xPaddingInner(0.5);
        chart.xPaddingOuter(0.25);
        bars.align("left");
    }
    chart.yNice && chart.yNice();

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xAxis.scale);

    // render
    container.datum(data).call(zoomChart);
    container.call(legend);
}
columnChart.plugin = {
    type: "d3_y_bar",
    name: "Y Bar Chart",
    max_size: 25000
};

export default columnChart;
