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
import {withSvgGridLines} from "../gridlines/gridlines";

import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";
import {seriesUpColors, seriesDownColors} from "../series/seriesColors";
import {colorLegend} from "../legend/legend";

const isUp = d => d.closeValue >= d.openValue;

function ohlcCandle(seriesSvg) {
    return function(container, settings) {
        const data = ohlcData(settings, filterDataByGroup(settings));

        const keys = data
            .map(k => k.key)
            .concat(settings.hideKeys ? settings.hideKeys : [])
            .sort();

        const upColor = seriesUpColors(keys);
        const downColor = seriesDownColors(keys);

        const legend = colorLegend()
            .settings(settings)
            .scale(keys.length > 1 ? upColor : null);

        const series = seriesSvg()
            .crossValue(d => d.crossValue)
            .openValue(d => d.openValue)
            .highValue(d => d.highValue)
            .lowValue(d => d.lowValue)
            .closeValue(d => d.closeValue)
            .decorate(selection => {
                selection.style("fill", d => (isUp(d) ? upColor(d.key) : downColor(d.key)));
                selection.style("stroke", d => (isUp(d) ? upColor(d.key) : downColor(d.key)));
            });

        const multi = fc
            .seriesSvgMulti()
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
            .chartSvgCartesian({
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
            .plotArea(withSvgGridLines(multi).orient("vertical"));

        chart.xPaddingInner && chart.xPaddingInner(1);
        chart.xPaddingOuter && chart.xPaddingOuter(0.5);

        const zoomChart = zoomableChart()
            .chart(chart)
            .settings(settings)
            .xScale(xScale)
            .yScale(yScale);

        const toolTip = nearbyTip()
            .settings(settings)
            .xScale(xScale)
            .yScale(yScale)
            .yValueName("closeValue")
            .data(data);

        // render
        container.datum(data).call(zoomChart);
        container.call(toolTip);
        container.call(legend);
    };
}

export default ohlcCandle;
