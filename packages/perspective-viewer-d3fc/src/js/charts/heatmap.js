/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as crossAxis from "../axis/crossAxis";
import * as otherAxis from "../axis/otherAxis";
import {heatmapSeries} from "../series/heatmapSeries";
import {heatmapData} from "../data/heatmapData";
import {filterData} from "../legend/legend";
//import {withGridLines} from "../gridlines/gridlines";
//import {getOrCreateElement} from "../utils/utils";
import * as fc from "d3fc";

import chartSvgCartesian from "../d3fc/chart/svg/cartesian";

function heatmapChart(container, settings) {
    const data = heatmapData(settings, filterData(settings));
    console.log("Raw Data: ", settings);
    console.log("heatMapData: ", data);

    const series = heatmapSeries(settings);

    const uniqueYDomain = [...new Set(data.map(d => d.mainValue))];
    const extent = fc.extentLinear().accessors([d => d.colorValue]);

    const colourDomain = extent(data);
    //legend(container,colourDomain);

    console.log("colourDomain: ", colourDomain);

    const chart = chartSvgCartesian(crossAxis.scale(settings), otherAxis.scale(settings, "splitValues"))
        .xDomain(crossAxis.domain(settings)(settings.data))
        .yDomain(uniqueYDomain)
        .yOrient("left")
        .plotArea(series);

    const xAxisOptions = {...otherAxis.styleOptions, PaddingInner: 0, PaddingOuter: 0, TickPadding: 0};
    const yAxisOptions = {...otherAxis.styleOptions, PaddingInner: 0};

    otherAxis.styleAxis(chart, "x", settings, "crossValues", xAxisOptions);
    otherAxis.styleAxis(chart, "y", settings, "splitValues", yAxisOptions, uniqueYDomain);

    // render
    container.datum(data).call(chart);
}
heatmapChart.plugin = {
    type: "d3_heatmap",
    name: "[d3fc] Heatmap",
    max_size: 25000
};

// const legend = (container, domain) => {
//     //https://bl.ocks.org/d3indepth/89ced137bece23b908cf51580d5e082d
//     const linear = d3.scaleLinear()
//     .domain(domain)
//     .range(["rgb(46, 73, 123)", "rgb(71, 187, 94)"])

//         const legendSelection = getOrCreateElement(container, "div.legend-container", () => container.append("div"));

//         // render the legend
//         legendSelection
//             .attr("class", "legend-container")
//             .style("z-index", "2")
//             .call(scrollLegend)
//             .select("g.legendCells")
//             .attr("transform", "translate(20,20)")
//             .selectAll("g.cell")
//             .classed("hidden", data => settings.hideKeys && settings.hideKeys.includes(data));

// }

export default heatmapChart;
