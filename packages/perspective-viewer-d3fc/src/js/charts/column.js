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
import { legend, filterData } from '../legend/legend';

function columnChart(container, settings) {
  const data = groupAndStackData(settings, filterData(settings));
  const colour = barColours(settings);
  legend(container, settings, colour);

  const series = fc.seriesSvgMulti()
    .mapping((data, index) => data[index])
    .series(data.map(() =>
      barSeries(settings, colour).align('left').orient('vertical')
    ));

  const chart = fc.chartSvgCartesian(
      crossAxis.scale(settings),
      mainAxis.scale(settings))
    .xDomain(crossAxis.domain(settings))
    .xPadding(0.5)
    .xLabel(crossAxis.label(settings))
    .yDomain(mainAxis.domain(settings, data))
    .yOrient('left')
    .yLabel(mainAxis.label(settings))
    .plotArea(series);
       
  // render
  container
    .datum(data)
    .call(chart);
}
columnChart.plugin = {
  type: "d3_y_bar_2",
  name: "[d3fc] Y Bar Chart 2",
  maxRenderSize: 25000
};

export default columnChart;
