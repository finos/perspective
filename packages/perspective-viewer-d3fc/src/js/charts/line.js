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
import * as mainAxis from "../axis/mainAxis";
import {seriesColours} from "../series/seriesColours";
import {lineSeries} from "../series/lineSeries";
import {splitData} from "../data/splitData";
import {legend, filterData} from "../legend/legend";

function lineChart(container, settings) {
    const data = splitData(settings, filterData(settings));
    const colour = seriesColours(settings);
    legend(container, settings, colour);

    const series = fc.seriesSvgRepeat().series(lineSeries(settings, colour).orient("vertical"));

    const chart = fc
        .chartSvgCartesian(crossAxis.scale(settings), mainAxis.scale(settings))
        .xDomain(crossAxis.domain(settings, data))
        .xLabel(crossAxis.label(settings))
        .yDomain(mainAxis.domain(settings, data))
        .yOrient("left")
        .yLabel(mainAxis.label(settings))
        .plotArea(series);

    chart.xAlign && chart.xPadding(1);

    // render
    container.datum(data).call(chart);
}
lineChart.plugin = {
    type: "d3_y_line",
    name: "[d3fc] Y Line Chart",
    maxRenderSize: 25000
};

export default lineChart;
