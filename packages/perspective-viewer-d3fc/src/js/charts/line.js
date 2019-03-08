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
import * as mainAxis from "../axis/mainAxis";
import {seriesColours} from "../series/seriesColours";
import {lineSeries} from "../series/lineSeries";
import {splitData} from "../data/splitData";
import {colourLegend} from "../legend/legend";
import {filterData} from "../legend/filter";
import {withGridLines} from "../gridlines/gridlines";

import chartSvgCartesian from "../d3fc/chart/svg/cartesian";
import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import {tooltipPointSeries} from "../series/tooltipSeries";
import {getSVGPlotAreaValues} from "../utils/utils";
import {getClosestDataPoint} from "../data/getClosestDataPoint";

function lineChart(container, settings) {
    const data = splitData(settings, filterData(settings));
    const colour = seriesColours(settings);
    let tooltipData = [];
    //tooltipData = [{key: "gold", crossValue: "2008", mainValue: 125}];

    const legend = colourLegend()
        .settings(settings)
        .scale(colour);

    const point = tooltipPointSeries(settings, colour);

    const line = lineSeries(settings, colour).orient("vertical");

    const multi = fc
        .seriesSvgMulti()
        .series([point, line])
        .mapping((data, index, series) => {
            switch (series[index]) {
                case line:
                    return data;
                case point:
                    return tooltipData;
            }
        });

    const series = fc.seriesSvgRepeat().series(multi);

    const paddingStrategy = hardLimitZeroPadding()
        .pad([0.1, 0.1])
        .padUnit("percent");

    const xScale = crossAxis.scale(settings);
    const chart = chartSvgCartesian(xScale, mainAxis.scale(settings))
        .xDomain(crossAxis.domain(settings)(data))
        .yDomain(mainAxis.domain(settings).paddingStrategy(paddingStrategy)(data))
        .yOrient("left")
        .yNice()
        .plotArea(withGridLines(series).orient("vertical"));

    crossAxis.styleAxis(chart, "x", settings);
    mainAxis.styleAxis(chart, "y", settings);

    chart.xPaddingInner && chart.xPaddingInner(1);
    chart.xPaddingOuter && chart.xPaddingOuter(0.5);

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xScale);

    // render
    container.datum(data).call(zoomChart);
    container.call(legend);

    const {xOffset, yOffset, clientHeight} = getSVGPlotAreaValues(container);

    const pointer = fc.pointer().on("point", event => {
        if (event.length) {
            const yScale = d3
                .scaleLinear()
                .domain(zoomChart.chart().yDomain())
                .range([clientHeight, 0])
                .nice();

            const xPos = event[0].x - xOffset;
            const yPos = event[0].y - yOffset;

            tooltipData = getClosestDataPoint(data, xScale, yScale, xPos, yPos);

            container.datum(data).call(zoomChart);
        }
    });

    container.call(pointer);
}

lineChart.plugin = {
    type: "d3_y_line",
    name: "[d3fc] Y Line Chart",
    max_size: 25000
};

export default lineChart;
