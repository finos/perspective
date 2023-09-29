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
    symbolTypeFromColumn,
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

/**
 * Overrides specific symbols based on plugin settings. This modifies in-place _and_ returns the value.
 * @param {any} settings
 * @param {d3.ScaleOrdinal} symbols
 */
function overrideSymbols(settings, symbols) {
    const symbolCol = settings.realValues[4];
    let domain = symbols.domain();
    let range = symbols.range();
    settings.columns?.[symbolCol]?.symbols?.forEach(({ key, value }) => {
        // TODO: Define custom symbol types based on the values passed in here.
        // https://d3js.org/d3-shape/symbol#custom-symbols
        let symbolType = d3.symbolCircle;
        // https://d3js.org/d3-shape/symbol#symbolsFill
        switch (value) {
            case "circle":
                symbolType = d3.symbolCircle;
                break;
            case "square":
                symbolType = d3.symbolSquare;
                break;
            case "cross":
                symbolType = d3.symbolCross;
                break;
            case "diamond":
                symbolType = d3.symbolDiamond;
                break;
            case "star":
                symbolType = d3.symbolStar;
                break;
            case "triangle":
                symbolType = d3.symbolTriangle;
                break;
            case "wye":
                symbolType = d3.symbolWye;
                break;
        }

        let i = domain.findIndex((val) => val === key);
        if (i === -1) {
            console.error(
                `Could not find row with value ${key} when overriding symbols!`
            );
        }
        range[i] = symbolType;
    });
    symbols.range(range);
    return symbols;
}

function xyScatter(container, settings) {
    const symbolCol = settings.realValues[4];
    const data = pointData(settings, filterDataByGroup(settings));
    const symbols = overrideSymbols(
        settings,
        symbolTypeFromColumn(settings, symbolCol)
    );

    let color = null;
    let legend = null;

    const colorByField = 2;
    const colorByValue = settings.realValues[colorByField];
    let hasColorBy = colorByValue !== null && colorByValue !== undefined;
    let isColoredByString =
        settings.mainValues.find((x) => x.name === colorByValue)?.type ===
        "string";
    let hasSymbol = !!symbolCol;

    if (hasColorBy) {
        if (isColoredByString) {
            if (hasSymbol) {
                color = seriesColorsFromDistinct(settings, data);
                // TODO: Legend should have cartesian product labels (ColorBy|Symbol)
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

    const label = settings.realValues[5];

    const scale_factor = interpolate_scale([600, 0.1], [1600, 1])(container);
    const series = fc
        .seriesCanvasMulti()
        .mapping((data, index) => data[index])
        .series(
            data.map((series) =>
                pointSeriesCanvas(
                    settings,
                    symbolCol,
                    size,
                    color,
                    label,
                    symbols,
                    scale_factor
                )
            )
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
        names: [
            "X Axis",
            "Y Axis",
            "Color",
            "Size",
            "Symbol",
            "Label",
            "Tooltip",
        ],
    },
    selectMode: "toggle",
};

export default xyScatter;
