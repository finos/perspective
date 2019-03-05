/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {rebindAll} from "d3fc";
import * as d3Legend from "d3-svg-legend";
import {getOrCreateElement} from "../utils/utils";

export function colourRangeLegend() {
    let baseLegend = d3Legend
        .legendColor()
        .shapeWidth(30)
        .cells(10)
        .orient("vertical")
        .ascending(true);

    function legend(container) {
        const legendSelection = getOrCreateElement(container, "div.legend-container", () =>
            container
                .append("div")
                .attr("class", "legend-container")
                .style("z-index", "2")
                .append("svg")
                .attr("class", "legend")
        );

        // render the legend
        legendSelection.call(baseLegend);

        const cellSize = legendSelection
            .select("g.legendCells")
            .node()
            .getBBox();
        legendSelection.attr("height", cellSize.height + 20);
    }

    rebindAll(legend, baseLegend);

    return legend;
}
