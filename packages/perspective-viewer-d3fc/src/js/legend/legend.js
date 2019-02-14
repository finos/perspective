/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import scrollableLegend from "./scrollableLegend";
import {getChartElement} from "../plugin/root";
import {getOrCreateElement} from "../utils/utils";

const scrollLegend = scrollableLegend();
export function legend(container, settings, colour) {
    if (colour) {
        scrollLegend
            .scale(colour)
            .shape("circle")
            .shapeRadius(6)
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

        if (settings.mainValues.length <= 1) {
            scrollLegend.labels(options => {
                const parts = options.domain[options.i].split("|");
                return parts.slice(0, parts.length - 1).join("|");
            });
        }

        const legendSelection = getOrCreateElement(container, "div.legend-container", () => container.append("div"));

        // render the legend
        legendSelection
            .attr("class", "legend-container")
            .style("z-index", "2")
            .call(scrollLegend)
            .select("g.legendCells")
            .attr("transform", "translate(20,20)")
            .selectAll("g.cell")
            .classed("hidden", data => settings.hideKeys && settings.hideKeys.includes(data));
    }
}

export function filterData(settings, data) {
    const useData = data || settings.data;
    if (settings.hideKeys && settings.hideKeys.length > 0) {
        return useData.map(col => {
            const clone = {...col};
            settings.hideKeys.forEach(k => {
                delete clone[k];
            });
            return clone;
        });
    }
    return useData;
}
