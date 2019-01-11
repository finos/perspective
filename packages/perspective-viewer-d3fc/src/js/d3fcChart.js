/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as fc from "d3fc";
import * as d3 from "d3";
import * as d3Legend from "d3-svg-legend";

export default class D3FCChart {
  constructor(mode, config, container) {
    this._mode = mode;
    this._config = config;
    this._container = container;
  }

  render() {

    let labels = {
      mainLabel: null,
      crossLabel: null,
      splitLabel: null
    };

    let dataset;
    console.log("config:", this._config);
    let { series, xAxis } = this._config;

    labels.mainLabel = series[0].stack;
    labels.crossLabel = this._config.row_pivots[0];
    labels.splitLabel = this._config.col_pivots[0];

    //data is not "split-by <something>"
    if (series.length === 1) {
      //simple array of data
      dataset = series[0].data.map(
        (mainValue, i) => ({
          mainValue: mainValue,
          crossValue: xAxis.categories.length > 0 ? xAxis.categories[i] : i
        })
      );

      //data is "split-by <something>"
    } else {
      let arrs = series.map(
        (series, seriesIndex) => {
          return series.data.map((mainValue, i) => ({
            mainValue,
            crossValue: this.calculateCrossValue(labels, xAxis, i),
            split: series.name
          }))
        }
      );

      dataset = [].concat.apply([], arrs).filter(a => a.mainValue).sort((x, y) => x.crossValue - y.crossValue);
    }

    console.log("dataset:", dataset);
    console.log("labels:", labels);

    if (this._mode === "x_bar") {
      renderBar(this._config, this._container, dataset, labels, true);
    } else if (this._mode === "y_bar") {
      renderBar(this._config, this._container, dataset, labels, false);
    } else {
      throw "EXCEPTION: chart type not recognised.";
    }
  }

  update() {
    this.render();
  }

  calculateCrossValue(labels, xAxis, i) {
    if (labels.crossLabel) {
      return xAxis.categories.length > 0 ? xAxis.categories[i] : i
    } else {
      return i;
    }
  }

}

function renderBar(config, container, dataset, labels, horizontal) {
  let isSplitBy = labels.splitLabel != null;
  if (isSplitBy) {
    dataset = stackedBarChart(config, container, dataset, labels, horizontal);
    return;
  }

  let mainScale =
    d3.scaleLinear()
      .domain([0, Math.max(...dataset.map(x => x.mainValue))])

  let crossScale =
    d3.scaleBand()
      .domain(dataset.map(x => x.crossValue))
      .padding(0.5);

  let mainGrid = (x => x
    .style("opacity", "0.3")
    .style("stroke-width", "1.0")
  );

  let crossGrid = (x => x
    .style("display", "none")
  );

  let [xScale, yScale] = horizontal ? [mainScale, crossScale] : [crossScale, mainScale];
  let [xGrid, yGrid] = horizontal ? [mainGrid, crossGrid] : [crossGrid, mainGrid];
  let orientation = horizontal ? "horizontal" : "vertical";

  let gridlines = fc.annotationSvgGridline()
    .xDecorate(xGrid)
    .yDecorate(yGrid);

  let chart = fc.chartSvgCartesian(xScale, yScale)
    .yOrient('left'); //move the axis to the left;

  let barSeries = fc.autoBandwidth(fc.seriesSvgBar())
    .align("left")
    .orient(orientation)
    .crossValue(d => d.crossValue)
    .mainValue(d => d.mainValue);

  let multi = fc.seriesSvgMulti()
    .series([gridlines, barSeries]);

  chart.plotArea(multi);

  styleDark(chart);

  d3.select(container)
    .datum(dataset)
    .call(chart);
}

function stackedBarChart(config, container, dataset, labels, horizontal) {
  //Convert data to Stacked Bar Chart Format
  let keys = config.xAxis.categories.length > 0 ? config.xAxis.categories : [...Array(config.series[0].data.length)].map((_, i) => i)

  let stackedBarData = keys.map((group, i) => {
    let row = { group }
    config.series.forEach(split => {
      row[split.name] = split.data[i] || 0;
    });
    return row;
  });

  let stack = d3.stack().keys(Object.keys(stackedBarData[0]).filter(r => r !== "group"));
  let stackedSeries = stack(stackedBarData);
  let color = d3.scaleOrdinal(d3.schemeCategory10).domain(stackedSeries.map(s => s.key));
  var legend = d3Legend.legendColor().shape('circle').shapeRadius(10).orient('vertical').scale(color);

  let orientation = horizontal ? "horizontal" : "vertical";

  let stackedBarSeries = fc.autoBandwidth(fc.seriesSvgBar())
    .align("left")
    .orient(orientation)
    .crossValue(d => d.data["group"])
    .mainValue(d => d[1])
    .baseValue(d => d[0]);

  let multi = fc.seriesSvgMulti()
    .mapping((data, index) => data[index])
    .series(stackedSeries.map(() => stackedBarSeries))
    .decorate((selection) => {
      selection.each((data, index, nodes) => {
        d3.select(nodes[index])
          .selectAll('g.bar')
          .attr('fill', color(stackedSeries[index].key));
      });
    });

  let mainExtent =
    fc.extentLinear()
      .accessors([a => a.map(d => d[1])])
      .pad([0, 1])
      .padUnit('domain');

  let mainScale =
    d3.scaleLinear()
      .domain(mainExtent(stackedSeries));

  let crossScale =
    d3.scaleBand()
      .domain(stackedBarData.map((entry) => entry["group"]))
      .padding(0.5);

  let [xScale, yScale] = horizontal ? [mainScale, crossScale] : [crossScale, mainScale];
  //let [xGrid, yGrid] = horizontal ? [mainGrid, crossGrid] : [crossGrid, mainGrid];

  let chart = fc.chartSvgCartesian(
    xScale,
    yScale)
    .yOrient('left')
    .plotArea(multi);

  d3.select(container)
    .datum(stackedSeries)
    .call(chart);

  d3.select(container)
    .append("svg")
    .attr("class", "legend")
    .attr("z-index", "2")
    .call(legend);
}

function styleDark(chart) {
  chart.xDecorate(selection => {
    selection.select(".domain") // select the axis' line //this one doesn't work
      .style("stroke", "red")
    selection.select("text")
      .attr("fill", "white")
    selection.select("path") //select the tick marks
      .attr("stroke", "white")
  });

  chart.yDecorate(selection => {
    selection.select("path") //select the tick marks
      .attr("stroke", "#2f3136")
    selection.select("text") //y axis text
      .attr("fill", "white")
  });

}