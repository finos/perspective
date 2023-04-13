/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import { axisFactory } from "../axis/axisFactory";
import { AXIS_TYPES } from "../axis/axisType";
import { chartCanvasFactory } from "../axis/chartFactory";
import { heatmapSeries } from "../series/heatmapSeries";
import { seriesColorRange } from "../series/seriesRange";
import { heatmapData } from "../data/heatmapData";
import { filterData } from "../legend/filter";
import withGridLines from "../gridlines/gridlines";
import { colorRangeLegend } from "../legend/colorRangeLegend";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";

function heatmapChart(container, settings) {
    const data = heatmapData(settings, filterData(settings));

    const color = seriesColorRange(settings, data, "colorValue");
    const series = heatmapSeries(settings, color);

    const legend = colorRangeLegend().scale(color);

    const xAxis = axisFactory(settings)
        .excludeType(AXIS_TYPES.linear)
        .settingName("splitValues")
        .valueName("crossValue")
        .modifyDomain((d) => {
            let is_number = !isNaN(d[0]);
            return is_number ? d.reverse() : d;
        })(data);

    const yAxis = axisFactory(settings)
        .excludeType(AXIS_TYPES.linear)
        .settingName("crossValues")
        .valueName("mainValue")
        .modifyDomain((d) => {
            let is_number = typeof d[0];
            return is_number === 'number' || is_number === 'string' ? d : d.reverse();
        })
        .orient("vertical")(data);

    const chart = chartCanvasFactory(xAxis, yAxis).plotArea(
        withGridLines(series, settings).canvas(true)
    );

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
        .yScale(yAxis.scale)
        .canvas(true);

    // const tp = tooltip().settings(settings);

    const toolTip = nearbyTip()
        // .scaleFactor(scale_factor)
        .settings(settings)
        .canvas(true)
        .xScale(xAxis.scale)
        // .xValueName("x")
        // .yValueName("y")
        .yScale(yAxis.scale)
        .color(color)
        // .size(size)
        .data(data);

    // // render
    // container.datum(data).call(zoomChart);

    // render
    container.datum(data).call(zoomChart);
    container.call(legend);
    container.call(toolTip);
}
heatmapChart.plugin = {
    name: "Heatmap",
    category: "Hierarchial Chart",
    max_cells: 50000,
    max_columns: 500,
    render_warning: true,
    initial: {
        names: ["Color"],
    },
};


export default heatmapChart;
