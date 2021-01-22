/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {axisFactory} from "../axis/axisFactory";
import {AXIS_TYPES} from "../axis/axisType";
import {chartSvgFactory} from "../axis/chartFactory";
import {heatmapSeries} from "../series/heatmapSeries";
import {seriesColorRange} from "../series/seriesRange";
import {heatmapData} from "../data/heatmapData";
import {filterData} from "../legend/filter";
import withGridLines from "../gridlines/gridlines";
import {colorRangeLegend} from "../legend/colorRangeLegend";
import zoomableChart from "../zoom/zoomableChart";

function heatmapChart(container, settings) {
    const data = heatmapData(settings, filterData(settings));

    const color = seriesColorRange(settings, data, "colorValue");
    const series = heatmapSeries(settings, color);

    const legend = colorRangeLegend().scale(color);

    const xAxis = axisFactory(settings)
        .excludeType(AXIS_TYPES.linear)
        .settingName("crossValues")
        .valueName("crossValue")(data);
    const yAxis = axisFactory(settings)
        .excludeType(AXIS_TYPES.linear)
        .settingName("splitValues")
        .valueName("mainValue")
        .orient("vertical")(data);

    const chart = chartSvgFactory(xAxis, yAxis).plotArea(withGridLines(series, settings));

    if (chart.xPaddingInner) {
        chart.xPaddingInner(0);
        chart.xPaddingOuter(0);
        series.xAlign("right");
    }
    if (chart.yPaddingInner) {
        chart.yPaddingInner(0);
        chart.yPaddingOuter(0);
        series.yAlign("top");
    }

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xAxis.scale)
        .yScale(yAxis.scale);

    // render
    container.datum(data).call(zoomChart);
    container.call(legend);
}
heatmapChart.plugin = {
    type: "d3_heatmap",
    name: "Heatmap",
    max_cells: 1000,
    max_columns: 50
};

export default heatmapChart;
