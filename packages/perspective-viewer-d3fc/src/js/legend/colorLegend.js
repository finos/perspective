/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
import scrollableLegend from "./scrollableLegend";
import {getOrCreateElement} from "../utils/utils";

const scrollLegend = scrollableLegend();
export function legend(container, colorInterpolate, domain) {
    const sequentialScale = d3.scaleSequential(colorInterpolate).domain(domain);

    scrollLegend
        .scale(sequentialScale)
        .shapeWidth(30)
        .cells(10)
        .orient("vertical")
        .ascending(true);

    const legendSelection = getOrCreateElement(container, "div.legend-container", () => container.append("div"));

    // render the legend
    legendSelection
        .attr("class", "legend-container")
        .style("z-index", "2")
        .call(scrollLegend);
}
