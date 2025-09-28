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
import { chartCanvasFactory } from "../axis/chartFactory";
import { ohlcData } from "../data/ohlcData";
import { filterDataByGroup } from "../legend/filter";
import withGridLines from "../gridlines/gridlines";

import { hardLimitZeroPadding } from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";
import { ohlcCandleSeries } from "../series/ohlcCandleSeries";
import { colorScale, setOpacity } from "../series/seriesColors";
import { colorLegend } from "../legend/legend";
import { Chart, HTMLSelection, Settings } from "../types";

function ohlcCandle(seriesCanvas): Chart {
    return function (container: HTMLSelection, settings: Settings) {
        const srcData = ohlcData(settings, filterDataByGroup(settings));

        const bollinger = fc
            .indicatorBollingerBands()
            .value((d) => d.openValue);
        const data = srcData.map((seriesData) => {
            const bollingerData = bollinger(seriesData);
            return seriesData.map((d, i) =>
                Object.assign({ bollinger: bollingerData[i] }, d),
            );
        });

        const keys = srcData
            .map((k) => k.key)
            .concat(settings.hideKeys ? settings.hideKeys : [])
            .sort();

        const upColor = colorScale()
            .domain(keys)
            .settings(settings)
            .mapFunction(setOpacity(1))();

        const legend = colorLegend()
            .settings(settings)
            .scale(
                keys.length > 1
                    ? (upColor as unknown as d3.ScaleOrdinal<string, unknown>)
                    : null,
            );

        const series = ohlcCandleSeries(settings, seriesCanvas, upColor);

        const multi = fc
            .seriesCanvasMulti()
            .mapping((data, index) => data[index])
            .series(data.map(() => series));

        const paddingStrategy = hardLimitZeroPadding()
            .pad([0.1, 0.1])
            .padUnit("percent");

        const xAxis: AxisFactoryContent = axisFactory(settings)
            .settingName("crossValues")
            .valueName("crossValue")(data);
        const yAxis: AxisFactoryContent = axisFactory(settings)
            .settingName("mainValues")
            .valueNames(["lowValue", "highValue"])
            .memoValue(settings.axisMemo[1])
            .orient("vertical")
            .paddingStrategy(paddingStrategy)(data);

        const chart = chartCanvasFactory(xAxis, yAxis).plotArea(
            withGridLines(multi, settings).orient("vertical").canvas(true),
        );

        chart.yNice && chart.yNice();

        const zoomChart = zoomableChart()
            .chart(chart)
            .settings(settings)
            .xScale(xAxis.scale)
            .onChange((zoom) => {
                const zoomedData = data.map((series) =>
                    series.filter(
                        (d) =>
                            d.crossValue >= zoom.xDomain[0] &&
                            d.crossValue <= zoom.xDomain[1],
                    ),
                );
                chart.yDomain(yAxis.domainFunction(zoomedData));
            })
            .canvas(true);

        const toolTip = nearbyTip()
            .settings(settings)
            .xScale(xAxis.scale)
            .yScale(yAxis.scale)
            .yValueName("closeValue")
            .color(upColor)
            .data(data)
            .canvas(true);

        // render
        container.datum(data).call(zoomChart);
        container.call(toolTip);
        container.call(legend);
    };
}

export default ohlcCandle;
