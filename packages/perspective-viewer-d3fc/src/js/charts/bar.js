/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from 'd3fc';
import * as crossAxis from '../axis/crossAxis';
import * as mainAxis from '../axis/mainAxis';
import { barSeries, barColours } from '../series/barSeries';
import { groupAndStackData } from '../data/groupAndStackData';
import { legend } from '../legend/legend';

function barChart(container, settings) {
  const data = groupAndStackData(settings);
  const colour = barColours(settings);
  legend(container, settings, colour);

  const series = fc.seriesSvgMulti()
    .mapping((data, index) => data[index])
    .series(data.map(() =>
      barSeries(settings, colour).align('left').orient('horizontal')
    ));

  const chart = fc.chartSvgCartesian(
      mainAxis.scale(settings),
      crossAxis.scale(settings))
    .xDomain(mainAxis.domain(settings, data))
    .xLabel(mainAxis.label(settings))
    .yDomain(crossAxis.domain(settings))
    .yPadding(0.5)
    .yOrient('left')
    .yLabel(crossAxis.label(settings))
    .plotArea(series);

  // render
  container
    .datum(data)
    .call(chart);
}
barChart.plugin = {
  type: "d3_x_bar_2",
  name: "[d3fc] X Bar Chart 2",
  maxRenderSize: 25000
};

export default barChart;
