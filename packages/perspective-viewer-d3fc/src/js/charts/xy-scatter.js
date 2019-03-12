/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import * as mainAxis from "../axis/mainAxis";
import {pointSeriesCanvas, symbolTypeFromGroups} from "../series/pointSeriesCanvas";
import {pointData} from "../data/pointData";
import {seriesColorsFromGroups} from "../series/seriesColors";
import {seriesLinearRange, seriesColorRange} from "../series/seriesRange";
import {symbolLegend} from "../legend/legend";
import {colorRangeLegend} from "../legend/colorRangeLegend";
import {filterDataByGroup} from "../legend/filter";
import {withCanvasGridLines} from "../gridlines/gridlines";
import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";

function xyScatter(container, settings) {
    const data = pointData(settings, filterDataByGroup(settings));
    const symbols = symbolTypeFromGroups(settings);
    const useGroupColors = settings.mainValues.length <= 2;
    let color = null;
    let legend = null;

    if (useGroupColors) {
        color = seriesColorsFromGroups(settings);

        legend = symbolLegend()
            .settings(settings)
            .scale(symbols)
            .color(useGroupColors ? color : null);
    } else {
        color = seriesColorRange(settings, data, "colorValue");
        legend = colorRangeLegend().scale(color);
    }

    const size = settings.mainValues.length > 3 ? seriesLinearRange(settings, data, "size").range([10, 10000]) : null;

    const series = fc
        .seriesCanvasMulti()
        .mapping((data, index) => data[index])
        .series(data.map(series => pointSeriesCanvas(settings, series.key, size, color, symbols)));

    const domainDefault = () => mainAxis.domain(settings).paddingStrategy(hardLimitZeroPadding().pad([0.1, 0.1]));

    const xScale = mainAxis.scale(settings);
    const yScale = mainAxis.scale(settings);

    const chart = fc
        .chartCanvasCartesian(xScale, yScale)
        .xDomain(domainDefault().valueName("x")(data))
        .xLabel(settings.mainValues[0].name)
        .yDomain(domainDefault().valueName("y")(data))
        .yLabel(settings.mainValues[1].name)
        .yOrient("left")
        .yNice()
        .xNice()
        .plotArea(withCanvasGridLines(series));

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xScale)
        .yScale(yScale)
        .canvas(true);

    const toolTip = nearbyTip()
        .chart(chart)
        .settings(settings)
        .canvas(true)
        .xScale(xScale)
        .xValueName("x")
        .yValueName("y")
        .yScale(yScale)
        .color(useGroupColors && color)
        .data(data);
    container.call(toolTip);

    // render
    container.datum(data).call(zoomChart);
    if (legend) container.call(legend);
}
xyScatter.plugin = {
    type: "d3_xy_scatter",
    name: "[d3fc] X/Y Scatter",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2
    }
};

export default xyScatter;
