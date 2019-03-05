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
import {pointSeries, symbolTypeFromGroups} from "../series/pointSeries";
import {pointData} from "../data/pointData";
import {seriesColoursFromGroups} from "../series/seriesColours";
import {seriesLinearRange, seriesColourRange} from "../series/seriesRange";
import {symbolLegend} from "../legend/legend";
import {colourRangeLegend} from "../legend/colourRangeLegend";
import {filterDataByGroup} from "../legend/filter";
import {withGridLines} from "../gridlines/gridlines";

import chartSvgCartesian from "../d3fc/chart/svg/cartesian";
import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";

function xyScatter(container, settings) {
    const data = pointData(settings, filterDataByGroup(settings));
    const symbols = symbolTypeFromGroups(settings);
    const useGroupColours = settings.mainValues.length <= 2;
    let colour = null;
    let legend = null;

    if (useGroupColours) {
        colour = seriesColoursFromGroups(settings);

        legend = symbolLegend()
            .settings(settings)
            .scale(symbols)
            .colour(useGroupColours ? colour : null);
    } else {
        colour = seriesColourRange(settings, data, "colorValue");
        legend = colourRangeLegend().scale(colour);
    }

    const size = settings.mainValues.length > 3 ? seriesLinearRange(settings, data, "size").range([10, 10000]) : null;

    const series = fc
        .seriesSvgMulti()
        .mapping((data, index) => data[index])
        .series(data.map(series => pointSeries(settings, series.key, size, colour, symbols)));

    const domainDefault = mainAxis.domain(settings).paddingStrategy(hardLimitZeroPadding().pad([0.1, 0.1]));

    const chart = chartSvgCartesian(mainAxis.scale(settings), mainAxis.scale(settings))
        .xDomain(domainDefault.valueName("x")(data))
        .xLabel(settings.mainValues[0].name)
        .yDomain(domainDefault.valueName("y")(data))
        .yLabel(settings.mainValues[1].name)
        .yOrient("left")
        .yNice()
        .xNice()
        .plotArea(withGridLines(series));

    // render
    container.datum(data).call(chart);
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
