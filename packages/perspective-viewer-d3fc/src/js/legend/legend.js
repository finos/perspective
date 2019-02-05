/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3Legend from "d3-svg-legend";

export function legend(container, settings, colour) {
  if (colour) {
    var legend = d3Legend.legendColor().scale(colour);
    
    // render the legend
    const legendSelection = container.append("svg")
      .attr("class", "legend")
      .style("z-index", "2");
    legendSelection.call(legend);
  }
}
