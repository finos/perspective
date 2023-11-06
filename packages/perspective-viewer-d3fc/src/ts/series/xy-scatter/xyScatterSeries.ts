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
import { axisFactory } from "../../axis/axisFactory";
import { chartCanvasFactory } from "../../axis/chartFactory";
import { pointSeriesCanvas, symbolTypeFromColumn } from "../pointSeriesCanvas";
import { seriesLinearRange } from "../seriesRange";
import withGridLines from "../../gridlines/gridlines";
import { hardLimitZeroPadding } from "../../d3fc/padding/hardLimitZero";
import zoomableChart from "../../zoom/zoomableChart";
import nearbyTip from "../../tooltip/nearbyTip";
import { symbolsObj } from "../seriesSymbols";
import { D3Scale, GetSetReturn, Settings } from "../../types";

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

export interface XYScatterSeries {
    (container: any): void;
    settings: <T extends Settings | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, Settings, XYScatterSeries>;
    data: <T extends { [key: string]: any }[][] | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, { [key: string]: any }[][], XYScatterSeries>;
    color: <T extends D3Scale | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, D3Scale, XYScatterSeries>;
    symbols: <T extends D3Scale | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, D3Scale, XYScatterSeries>;
}

/**
 * @param {d3.Selection} container - d3.Selection of the outer div
 * @param {any} settings - settings as defined in the Update method in plugin.js
 */
export default function xyScatterSeries(): XYScatterSeries {
    let settings: Settings | null = null;
    let data = null;
    let color = null;
    let symbols = null;

    const _xyScatterSeries: any = (container) => {
        const colorBy = settings.realValues[2];
        let hasColorBy = !!colorBy;
        const symbolCol = settings.realValues[4];

        const size = settings.realValues[3]
            ? seriesLinearRange(settings, data, "size").range([10, 10000])
            : null;

        const label = settings.realValues[5];

        const scale_factor = interpolate_scale(
            [600, 0.1],
            [1600, 1]
        )(container);
        const series = fc
            .seriesCanvasMulti()
            .mapping((data, index) => data[index])
            .series(
                data.map(() =>
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

        const [xLabel, yLabel] =
            settings.splitValues.length === 0
                ? [settings.mainValues[0].name, settings.mainValues[1].name]
                : ["", ""];

        const chart = chartCanvasFactory(xAxis, yAxis)
            .xLabel(xLabel)
            .yLabel(yLabel)
            .plotArea(withGridLines(series, settings).canvas(true));

        chart.xNice && chart.xNice();
        chart.yNice && chart.yNice();

        // TODO: This make scrolling the grid tricky. Maybe require modifier key to zoom?
        // Also, reset zoom button is now at the top of the page and overlaps any other items.
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
            .xScale(xAxis.scale as D3Scale)
            .xValueName("x")
            .yValueName("y")
            .yScale(yAxis.scale as D3Scale)
            .color((!hasColorBy && color) as D3Scale)
            .size(size)
            .data(data);

        // render
        container.datum(data).call(zoomChart);
        container.call(toolTip);
    };

    _xyScatterSeries.settings = <T extends Settings | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, Settings, XYScatterSeries> => {
        if (!args.length) {
            return settings as GetSetReturn<T, Settings, XYScatterSeries>;
        }
        settings = args[0];
        return _xyScatterSeries;
    };
    _xyScatterSeries.data = <T extends any[] | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, any[], XYScatterSeries> => {
        if (!args.length) {
            return data as GetSetReturn<T, any[], XYScatterSeries>;
        }
        data = args[0];
        return _xyScatterSeries;
    };
    _xyScatterSeries.color = <T extends D3Scale | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, D3Scale, XYScatterSeries> => {
        if (!args.length) {
            return color as GetSetReturn<T, D3Scale, XYScatterSeries>;
        }
        color = args[0];
        return _xyScatterSeries;
    };
    _xyScatterSeries.symbols = <T extends D3Scale | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, D3Scale, XYScatterSeries> => {
        if (!args.length) {
            return symbols as GetSetReturn<T, D3Scale, XYScatterSeries>;
        }
        symbols = args[0];
        return _xyScatterSeries;
    };

    return _xyScatterSeries;
}
