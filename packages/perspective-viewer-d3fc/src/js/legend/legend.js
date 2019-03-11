/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import * as d3Legend from "d3-svg-legend";
import scrollableLegend from "./scrollableLegend";
import {withoutOpacity} from "../series/seriesColours";
import {getChartElement} from "../plugin/root";
import {getOrCreateElement} from "../utils/utils";

const scrollColourLegend = scrollableLegend(
    d3Legend
        .legendColor()
        .shape("circle")
        .shapeRadius(6)
);
const scrollSymbolLegend = scrollableLegend(
    d3Legend
        .legendSymbol()
        .shapePadding(1)
        .labelOffset(3)
);

export const colourLegend = () => legendComponent(scrollColourLegend);
export const symbolLegend = () => legendComponent(scrollSymbolLegend, symbolScale);

function symbolScale(fromScale) {
    if (!fromScale) return null;

    const domain = fromScale.domain();
    const range = fromScale.range().map(r => d3.symbol().type(r)());
    return d3
        .scaleOrdinal()
        .domain(domain)
        .range(range);
}

function legendComponent(scrollLegend, scaleModifier) {
    let settings = {};
    let scale = null;
    let colour = null;

    function legend(container) {
        if (scale) {
            scrollLegend
                .scale(scale)
                .orient("vertical")
                .on("cellclick", function(d) {
                    settings.hideKeys = settings.hideKeys || [];
                    if (settings.hideKeys.includes(d)) {
                        settings.hideKeys = settings.hideKeys.filter(k => k !== d);
                    } else {
                        settings.hideKeys.push(d);
                    }

                    getChartElement(this).draw();
                });

            scrollLegend.labels(options => {
                const parts = options.domain[options.i].split("|");
                return settings.mainValues.length <= 1 ? parts.slice(0, parts.length - 1).join("|") : options.domain[options.i];
            });

            const legendSelection = getOrCreateElement(container, "div.legend-container", () => container.append("div"));

            // render the legend
            legendSelection
                .attr("class", "legend-container")
                .style("z-index", "2")
                .call(scrollLegend);
        }
    }

    scrollLegend.decorate(selection => {
        const isHidden = data => settings.hideKeys && settings.hideKeys.includes(data);

        const cells = selection
            .select("g.legendCells")
            .attr("transform", "translate(20,20)")
            .selectAll("g.cell");

        cells.classed("hidden", isHidden);

        if (colour) {
            cells
                .select("path")
                .style("fill", d => (isHidden(d) ? null : colour(d)))
                .style("stroke", d => (isHidden(d) ? null : withoutOpacity(colour(d))));
        }
    });

    legend.settings = (...args) => {
        if (!args.length) {
            return settings;
        }
        settings = args[0];
        return legend;
    };

    legend.scale = (...args) => {
        if (!args.length) {
            return scale;
        }
        scale = scaleModifier ? scaleModifier(args[0]) : args[0];
        return legend;
    };

    legend.colour = (...args) => {
        if (!args.length) {
            return colour;
        }
        colour = args[0];
        return legend;
    };

    return legend;
}
