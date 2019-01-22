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
      renderXBar(this._config, this._container, dataset);
    } else if (this._mode === "y_bar") {
      renderYBar(this._config, this._container, dataset, labels);
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
    }
    else {
      return i;
    }
  }
}

function renderXBar(config, container, dataset) {
  let w = 600;
  let h = 700;

  let widthMultFactor = 1;
  function invertHeight(x) { return h - x } //don't require this because an x graph needn't invert.
  function widthMultiplier(x) { return x * widthMultFactor }
  function calculateRowHeight() { return h / dataset.length - padding }

  let padding = 2;

  let crossValueMeasures = "organisation";
  let mainValueMeasures = config.series[0].stack;

  let spaceForText = 40;
  widthMultFactor = (w - spaceForText) / Math.max.apply(null, dataset.map(x => x.mainValue));

  // Actual d3 stuff yo

  let svg = d3.select(container)
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  svg
    .selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    //.attr("x", (d) => (widthMultiplier(d.price))) //don't require this as we're starting fromt he left anyway.
    .attr("y", (d, i) => (i * (h / dataset.length)))
    .attr("width", (d) => widthMultiplier(d.mainValue))
    .attr("height", h / dataset.length - padding)
    .attr("fill", (d) => `rgb( ${d.mainValue / 10}, ${d.mainValue / 50}, ${d.mainValue / 10})`);

  svg
    .selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .text((d) => d.crossValue + " @ " + d.mainValue)
    .attr("text-anchor", "middle")
    .attr("y", (d, i) => (i * (h / dataset.length)) + (calculateRowHeight() / 2))
    .attr("x", (d) => (widthMultiplier(d.mainValue)) + (spaceForText / 2))
    .attr("fill", "white");
}

function renderYBar(config, container, dataset, labels) {
  console.log("starting rendering y bar");

  //splitBy stuff
  let isSplitBy = labels.splitLabel != null;
  let stack = d3.stack()
    .keys(dataset.map(x => x.split));
  let series = stack(dataset);

  let xScale = d3
    .scaleBand()
    .domain(dataset.map(x => x.crossValue));

  let chart = fc.chartSvgCartesian(
    xScale, //x axis scales to fit bars equally 
    d3.scaleLinear()) //y axis scales linearly across values
    .xPadding(0.5)
    .yDomain([0, Math.max(...dataset.map(x => x.mainValue))]) //from 0 to the maximum value of price
    .yOrient('left') //move the axis to the left;

  let barSeries = fc.autoBandwidth(fc.seriesSvgBar())
    .align("left")
    .crossValue(function (d) { return d.crossValue; })
    .mainValue(function (d) { return d.mainValue; });

  //let bSeries = barSeries;
  let bSeries = isSplitBy ? series.map(() => barSeries) : barSeries;

  let gridlines = fc.annotationSvgGridline() //Add gridlines
    .yDecorate(x => x
      .style("opacity", "0.3")
      .style("stroke-width", "1.0"))
    .xDecorate(x => x.style("display", "none"));

  //splitBy based if statement
  let multi;
    if (isSplitBy) {
      multi = fc.seriesSvgMulti()
      .series(bSeries); //currently can't get the grid as well as the stacked chart
    } else {
      multi = fc.seriesSvgMulti()
      .series([gridlines, barSeries]);
    }

  chart.plotArea(multi);

  styleDark(chart);

  handleSplitBy(xScale, container, barSeries, labels);

  d3.select(container)
    .datum(dataset)
    .call(chart);  
    
  //handleSplitBy(xScale, container, labels); //this should be after the general render to ensure it goes on top?

  console.log("completed rendering y bar");
}


function handleSplitBy(scale, container, barSeries, labels) {
  if (!labels.splitLabel) {
    return;
  }

  let green = "#2c8f2d";
  let blue = "#216ca1";
  let orange = "#e07314"; 

  const colors = [green, blue, orange, "red", "yellow", "purple", "brown"];

  //Decorate bars to be different colors.
  barSeries.decorate(selection => 
    selection
      .select(".bar>path")
      .style("fill", (_, i) => colors[i])
  );

  let legend = d3Legend
    .legendColor()
    .scale(scale);

  // //Decorate legend swatches to be different colors.
  // legend.decorate(selection => 
  //   selection
  //     .select(".swatch")
  //     .style("fill", (_, i) => colors[i])
  // );

  d3.select(container)
    .append("svg")
    .attr("class", "legend")
    .attr("z-index", "2")
    .call(legend);
  
  console.log("legend rendered thanks.");
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