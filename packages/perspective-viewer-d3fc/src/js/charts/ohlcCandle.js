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
import {ohlcData} from "../data/ohlcData";
import {filterDataByGroup} from "../legend/filter";
import withGridLines from "../gridlines/gridlines";

import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";
import {ohlcCandleSeries} from "../series/ohlcCandleSeries";
import {colorScale, setOpacity} from "../series/seriesColors";
import {colorLegend} from "../legend/legend";

function ohlcCandle(seriesCanvas) {
    return function(container, settings) {
        const srcData = ohlcData(settings, filterDataByGroup(settings));

        const bollinger = fc.indicatorBollingerBands().value(d => d.openValue);
        const data = srcData.map(seriesData => {
            const bollingerData = bollinger(seriesData);
            return seriesData.map((d, i) => Object.assign({bollinger: bollingerData[i]}, d));
        });

        const keys = srcData
            .map(k => k.key)
            .concat(settings.hideKeys ? settings.hideKeys : [])
            .sort();

        const upColor = colorScale()
            .domain(keys)
            .settings(settings)
            .mapFunction(setOpacity(1))();

        const legend = colorLegend()
            .settings(settings)
            .scale(keys.length > 1 ? upColor : null);

        const series = ohlcCandleSeries(settings, seriesCanvas, upColor);

        const multi = fc
            .seriesCanvasMulti()
            .mapping((data, index) => data[index])
            .series(data.map(() => series));

        const paddingStrategy = hardLimitZeroPadding()
            .pad([0.1, 0.1])
            .padUnit("percent");

        const xDomain = crossAxis.domain(settings)(data);
        const xScale = crossAxis.scale(settings);
        const xAxis = crossAxis.axisFactory(settings).domain(xDomain)();
        const yScale = mainAxis.scale(settings);

        const chart = fc
            .chartCanvasCartesian({
                xScale,
                yScale,
                xAxis
            })
            .xDomain(xDomain)
            .xLabel(crossAxis.label(settings))
            .xAxisHeight(xAxis.size)
            .xDecorate(xAxis.decorate)
            .yDomain(
                mainAxis
                    .domain(settings)
                    .valueNames(["lowValue", "highValue"])
                    .paddingStrategy(paddingStrategy)(data)
            )
            .yLabel(mainAxis.label(settings))
            .yOrient("left")
            .yNice()
            .plotArea(
                withGridLines(multi)
                    .orient("vertical")
                    .canvas(true)
            );

        chart.xPaddingInner && chart.xPaddingInner(1);
        chart.xPaddingOuter && chart.xPaddingOuter(0.5);

        const zoomChart = zoomableChart()
            .chart(chart)
            .settings(settings)
            .xScale(xScale)
            .yScale(yScale)
            .canvas(true);

        const toolTip = nearbyTip()
            .settings(settings)
            .xScale(xScale)
            .yScale(yScale)
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
