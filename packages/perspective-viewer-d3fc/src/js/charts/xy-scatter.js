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
import {chartCanvasFactory} from "../axis/chartFactory";
import {pointSeriesCanvas, symbolTypeFromGroups} from "../series/pointSeriesCanvas";
import {pointData} from "../data/pointData";
import {seriesColorsFromGroups} from "../series/seriesColors";
import {seriesLinearRange, seriesColorRange} from "../series/seriesRange";
import {symbolLegend} from "../legend/legend";
import {colorRangeLegend} from "../legend/colorRangeLegend";
import {filterDataByGroup} from "../legend/filter";
import withGridLines from "../gridlines/gridlines";
import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";

function xyScatter(container, settings) {
    const data = pointData(settings, filterDataByGroup(settings));
    const symbols = symbolTypeFromGroups(settings);
    const useGroupColors = settings.realValues.length <= 2 || settings.realValues[2] === null;
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

    const size = settings.realValues[3] ? seriesLinearRange(settings, data, "size").range([10, 10000]) : null;

    const series = fc
        .seriesCanvasMulti()
        .mapping((data, index) => data[index])
        .series(data.map(series => pointSeriesCanvas(settings, series.key, size, color, symbols)));

    const axisDefault = () =>
        axisFactory(settings)
            .settingName("mainValues")
            .paddingStrategy(hardLimitZeroPadding())
            .pad([0.1, 0.1]);

    const xAxis = axisDefault()
        .settingValue(settings.mainValues[0].name)
        .valueName("x")(data);
    const yAxis = axisDefault()
        .orient("vertical")
        .settingValue(settings.mainValues[1].name)
        .valueName("y")(data);

    const chart = chartCanvasFactory(xAxis, yAxis)
        .xLabel(settings.mainValues[0].name)
        .yLabel(settings.mainValues[1].name)
        .plotArea(withGridLines(series, settings).canvas(true));

    chart.xNice && chart.xNice();
    chart.yNice && chart.yNice();

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xAxis.scale)
        .yScale(yAxis.scale)
        .canvas(true);

    const toolTip = nearbyTip()
        .settings(settings)
        .canvas(true)
        .xScale(xAxis.scale)
        .xValueName("x")
        .yValueName("y")
        .yScale(yAxis.scale)
        .color(useGroupColors && color)
        .size(size)
        .data(data);

    // render
    container.datum(data).call(zoomChart);
    container.call(toolTip);
    if (legend) container.call(legend);
}

xyScatter.plugin = {
    name: "X/Y Scatter",
    max_cells: 50000,
    max_columns: 50,
    render_warning: true,
    initial: {
        type: "number",
        count: 2,
        names: ["X Axis", "Y Axis", "Color", "Size", "Tooltip"]
    },
    selectMode: "toggle"
};

export default xyScatter;
