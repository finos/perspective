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

export default class D3FCChart {
  constructor(mode, config, container) {
    this._mode = mode;
    this._config = config;
    this._container = container;
  }

  render() {

    let dataset;
    console.log("config:", this._config);
    let { series, xAxis } = this._config;
    if(series.length === 1) {
      //simple array of data
      dataset = series[0].data.map(
        (mainValue, i) => ({
          mainValue: mainValue,
          crossValue: xAxis.categories.length > 0 ? xAxis.categories[i] : i
        })
      );
    } else {
      let arrs = series.map(
        (series, seriesIndex) => {
          return series.data.map((mainValue, i) => ({
            mainValue,
            crossValue: i,
            split: series.name
          }))
        }
      );
      dataset = [].concat.apply([], arrs).filter(a => a.mainValue).sort((x, y) => x.crossValue-y.crossValue);
    }

    console.log("dataset:", dataset);

    if (this._mode === "x_bar") {
      renderXBar(this._config, this._container, dataset);
    } else if (this._mode === "y_bar") {
      renderYBar(this._config, this._container, dataset);
    } else {
      throw "EXCEPTION: chart type not recognised.";
    }
  }

  update() {
    this.render();
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

function renderYBar(config, container, dataset) {
  console.log("starting rendering y bar");

  let colours = ["green","blue","orange","red","yellow","purple","brown"];

  let chart = fc.chartSvgCartesian(
    d3.scaleBand(), //x axis scales to fit bars equally 
    d3.scaleLinear()) //y axis scales linearly across values
    .xDomain(dataset.map(x => x.crossValue)) //all values from organisations list
    .xPadding(0.5)
    .yDomain([0, Math.max(...dataset.map(x => x.mainValue))]) //from 0 to the maximum value of price
    .yOrient('left') //move the axis to the left;

  let series = fc.autoBandwidth(fc.seriesSvgBar())
    .align("left")
    .crossValue(function (d) { return d.crossValue; })
    .mainValue(function (d) { return d.mainValue; });

  let gridlines = fc.annotationSvgGridline() //Add gridlines
    .yDecorate(x => x
      .style("opacity", "0.3")
      .style("stroke-width", "1.0"))
    .xDecorate(x => x.style("display", "none"));

  let multi = fc.seriesSvgMulti()
    .series([gridlines, series]);

  chart.plotArea(multi);

  styleDark(chart);

  d3.select(container)
    .datum(dataset)
    .call(chart);

  console.log("completed rendering y bar");
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