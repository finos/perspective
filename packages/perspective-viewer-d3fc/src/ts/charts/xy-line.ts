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
import { transposeData } from "../data/transposeData";
import { AxisFactoryContent, axisFactory } from "../axis/axisFactory";
import { chartSvgFactory } from "../axis/chartFactory";
import { symbolTypeFromGroups } from "../series/pointSeriesCanvas";
import { lineSeries } from "../series/lineSeries";
import { xySplitData } from "../data/xySplitData";
import { seriesColorsFromGroups } from "../series/seriesColors";
import { colorGroupLegend } from "../legend/legend";
import { filterDataByGroup } from "../legend/filter";
import withGridLines from "../gridlines/gridlines";
import { hardLimitZeroPadding } from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";
import { HTMLSelection, Settings } from "../types";

function xyLine(container: HTMLSelection, settings: Settings) {
    const data = transposeData(
        xySplitData(settings, filterDataByGroup(settings)),
    );

    const color = seriesColorsFromGroups(settings);
    const symbols = symbolTypeFromGroups(settings);

    let legend = null;
    if (color.domain().length >= 2) {
        legend = colorGroupLegend()
            .settings(settings)
            .scale(symbols)
            .color(color);
    }

    const series = fc
        .seriesSvgRepeat()
        .series(lineSeries(settings, color))
        .orient("horizontal");

    const paddingStrategy = hardLimitZeroPadding()
        .pad([0.1, 0.1])
        .padUnit("percent");

    const xAxisFactory = axisFactory(settings)
        .settingName("mainValues")
        .settingValue(settings.mainValues[0].name)
        .valueName("crossValue")
        .memoValue(settings.axisMemo[0])
        .paddingStrategy(paddingStrategy);

    const yAxisFactory = axisFactory(settings)
        .settingName("mainValues")
        .settingValue(settings.mainValues[1].name)
        .valueName("mainValue")
        .memoValue(settings.axisMemo[1])
        .orient("vertical")
        .paddingStrategy(paddingStrategy);

    const yAxis: AxisFactoryContent = yAxisFactory(data);
    const xAxis: AxisFactoryContent = xAxisFactory(data);

    const plotSeries = withGridLines(series, settings).orient("vertical");

    const chart = chartSvgFactory(xAxis, yAxis)
        .xLabel(settings.mainValues[0].name)
        .yLabel(settings.mainValues[1].name)
        .plotArea(plotSeries);

    chart.xNice && chart.xNice();
    chart.yNice && chart.yNice();

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xAxis.scale)
        .yScale(yAxis.scale);

    const toolTip = nearbyTip()
        .settings(settings)
        .xScale(xAxis.scale)
        .yScale(yAxis.scale)
        .color(color)
        .data(data);

    container.datum(data).call(zoomChart);
    container.call(toolTip);
    if (legend) {
        container.call(legend);
    }
}

xyLine.plugin = {
    name: "X/Y Line",
    category: "X/Y Chart",
    max_cells: 50000,
    max_columns: 50,
    render_warning: true,
    initial: {
        type: "number",
        count: 2,
        names: ["X Axis", "Y Axis", "Tooltip"],
    },
    selectMode: "toggle",
};

export default xyLine;
