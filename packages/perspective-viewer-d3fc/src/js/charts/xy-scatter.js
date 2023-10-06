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

import * as fc from "d3fc";
import * as d3 from "d3";
import { axisFactory } from "../axis/axisFactory";
import { chartCanvasFactory } from "../axis/chartFactory";
import {
    pointSeriesCanvas,
    symbolTypeFromGroups,
} from "../series/pointSeriesCanvas";
import { pointData } from "../data/pointData";
import {
    seriesColorsFromField,
    seriesColorsFromGroups,
    seriesColorsFromDistinct,
    colorScale,
} from "../series/seriesColors";
import { seriesLinearRange, seriesColorRange } from "../series/seriesRange";
import { symbolLegend, colorLegend, colorGroupLegend } from "../legend/legend";
import { colorRangeLegend } from "../legend/colorRangeLegend";
import { filterDataByGroup } from "../legend/filter";
import withGridLines from "../gridlines/gridlines";
import { hardLimitZeroPadding } from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";

/**
 * Define a clamped scaling factor based on the container size for bubble plots.
 *
 * @param {Array} p1 a point as a tuple of `Number`
 * @param {Array} p2 a second point as a tuple of `Number`
 * @returns a function `container -> integer` which calculates a scaling factor
 * from the linear function (clamped) defgined by the input points
 */
function interpolate_scale([x1, y1], [x2, y2]) {
    const m = (y2 - y1) / (x2 - x1);
    const b = y2 - m * x2;
    return function (container) {
        const node = container.node();
        const shortest_axis = Math.min(node.clientWidth, node.clientHeight);
        return Math.min(y2, Math.max(y1, m * shortest_axis + b));
    };
}

function xyScatter(container, settings) {
    const data = pointData(settings, filterDataByGroup(settings));
    const symbols = symbolTypeFromGroups(settings);
    let color = null;
    let legend = null;

    const colorByField = 2;
    const colorByValue = settings.realValues[colorByField];
    let hasColorBy = colorByValue !== null && colorByValue !== undefined;
    let isColoredByString =
        settings.mainValues.find((x) => x.name === colorByValue)?.type ===
        "string";
    let hasSplitBy = settings.splitValues.length > 0;

    if (hasColorBy) {
        if (isColoredByString) {
            if (hasSplitBy) {
                color = seriesColorsFromDistinct(settings, data);
                // TODO: Legend should have cartesian product labels (ColorBy|SplitBy)
                // For now, just use monocolor legends.
                legend = symbolLegend().settings(settings).scale(symbols);
            } else {
                color = seriesColorsFromField(settings, colorByField);
                legend = colorLegend().settings(settings).scale(color);
            }
        } else {
            color = seriesColorRange(settings, data, "colorValue");
            legend = colorRangeLegend().scale(color);
        }
    } else {
        // always use default color
        color = colorScale().settings(settings).domain([""])();
        legend = symbolLegend().settings(settings).scale(symbols);
    }

    const size = settings.realValues[3]
        ? seriesLinearRange(settings, data, "size").range([10, 10000])
        : null;

    const label = settings.realValues[4];

    const scale_factor = interpolate_scale([600, 0.1], [1600, 1])(container);
    const series = fc
        .seriesCanvasMulti()
        .mapping((data, index) => data[index])
        .series(
            data.map((series) =>
                pointSeriesCanvas(
                    settings,
                    series.key,
                    size,
                    color,
                    label,
                    symbols,
                    scale_factor,
                ),
            ),
        );

    const axisDefault = () =>
        axisFactory(settings)
            .settingName("mainValues")
            .paddingStrategy(hardLimitZeroPadding())
            .pad([0.1, 0.1]);

    const xAxis = axisDefault()
        .settingValue(settings.mainValues[0].name)
        .memoValue(settings.axisMemo[0])
        .valueName("x")(data);

    const yAxis = axisDefault()
        .orient("vertical")
        .settingValue(settings.mainValues[1].name)
        .memoValue(settings.axisMemo[1])
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
        .scaleFactor(scale_factor)
        .settings(settings)
        .canvas(true)
        .xScale(xAxis.scale)
        .xValueName("x")
        .yValueName("y")
        .yScale(yAxis.scale)
        .color(!hasColorBy && color)
        .size(size)
        .data(data);

    // render
    container.datum(data).call(zoomChart);
    container.call(toolTip);
    if (legend) container.call(legend);
}

xyScatter.plugin = {
    name: "X/Y Scatter",
    category: "X/Y Chart",
    max_cells: 50000,
    max_columns: 50,
    render_warning: true,
    initial: {
        type: "number",
        count: 2,
        names: ["X Axis", "Y Axis", "Color", "Size", "Label", "Tooltip"],
    },
    selectMode: "toggle",
};

export default xyScatter;
