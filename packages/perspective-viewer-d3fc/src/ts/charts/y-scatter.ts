// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import * as fc from "d3fc/index.js";
import { AxisFactoryContent, axisFactory } from "../axis/axisFactory";
import { AXIS_TYPES } from "../axis/axisType";
import { chartSvgFactory } from "../axis/chartFactory";
import { axisSplitter } from "../axis/axisSplitter";
import { seriesColors } from "../series/seriesColors";
import { categoryPointSeries, symbolType } from "../series/categoryPointSeries";
import { groupData } from "../data/groupData";
import { symbolLegend } from "../legend/legend";
import { filterData } from "../legend/filter";
import withGridLines from "../gridlines/gridlines";
import { hardLimitZeroPadding } from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";
import { HTMLSelection, Settings } from "../types";

function yScatter(container: HTMLSelection, settings: Settings) {
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
        .series(
            data.map((series) =>
                categoryPointSeries(settings, series.key, color, symbols),
            ),
        );

    const paddingStrategy = hardLimitZeroPadding()
        .pad([0.05, 0.05])
        .padUnit("percent");

    const xAxis: AxisFactoryContent = axisFactory(settings)
        .excludeType(AXIS_TYPES.linear)
        .settingName("crossValues")
        .valueName("crossValue")(data);
    const yAxisFactory = axisFactory(settings)
        .settingName("mainValues")
        .valueName("mainValue")
        .memoValue(settings.axisMemo[1])
        .orient("vertical")
        .paddingStrategy(paddingStrategy);

    // Check whether we've split some values into a second y-axis
    const splitter = axisSplitter(settings, data).color(color);

    const yAxis1: AxisFactoryContent = yAxisFactory(splitter.data());

    // No grid lines if splitting y-axis
    const plotSeries = splitter.haveSplit()
        ? series
        : withGridLines(series, settings).orient("vertical");

    const chart = chartSvgFactory(xAxis, yAxis1)
        .axisSplitter(splitter)
        .plotArea(plotSeries);

    chart.yNice && chart.yNice();

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xAxis.scale);

    const toolTip = nearbyTip()
        .settings(settings)
        .xScale(xAxis.scale)
        .yScale(yAxis1.scale)
        .color(color)
        .data(data);

    if (splitter.haveSplit()) {
        // Create the y-axis data for the alt-axis
        const yAxis2 = yAxisFactory(splitter.altData());
        chart.altAxis(yAxis2);
        // Give the tooltip the information (i.e. 2 datasets with different
        // scales)
        toolTip.data(splitter.data()).altDataWithScale({
            yScale: yAxis2.scale,
            data: splitter.altData(),
        });
    }

    // render
    container.datum(splitter.data()).call(zoomChart);
    container.call(toolTip);
    if (legend) {
        container.call(legend);
    }
}

yScatter.plugin = {
    name: "Y Scatter",
    category: "Y Chart",
    max_cells: 4000,
    max_columns: 50,
    render_warning: true,
    initial: {
        names: ["Y Axis"],
    },
};

export default yScatter;
