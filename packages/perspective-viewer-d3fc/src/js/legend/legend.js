/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {select} from "d3";
import * as d3Legend from "d3-svg-legend";
import {getChartElement} from "../plugin/root";
import legendControlsTemplate from "../../html/legend-controls.html";

export function legend(container, settings, colour, domain) {
    if (colour) {
        const groupSize = 10;
        const numberOfGroups = Math.ceil(domain.length / groupSize);

        if (numberOfGroups > 1) {
            const reloadLegend = index => createLegend(container, settings, colour, groupSize, index);
            legendScrolling(container, numberOfGroups, reloadLegend);
        }
        createLegend(container, settings, colour, groupSize);
    }
}

function legendScrolling(container, numberOfGroups, reloadLegend) {
    let groupIndex = 0;

    const legendControls = container
        .append("div")
        .attr("class", "legend-controls")
        .html(legendControlsTemplate);

    const setPageText = () => legendControls.select("#page-text").text(`${groupIndex + 1}/${numberOfGroups}`);
    setPageText();
    legendControls.select("#up-arrow").on("click", function() {
        if (groupIndex > 0) {
            groupIndex--;
            reloadLegend(groupIndex);
            setPageText();
            legendControls
                .select("#down-arrow")
                .style("color", "rgb(63, 127, 253)")
                .style("cursor", "pointer");
        }
        if (groupIndex === 0) {
            select(this)
                .style("color", null)
                .style("cursor", "default");
        }
    });
    legendControls
        .select("#down-arrow")
        .on("click", function() {
            if (groupIndex < numberOfGroups - 1) {
                groupIndex++;
                reloadLegend(groupIndex);
                setPageText();
                legendControls
                    .select("#up-arrow")
                    .style("color", "rgb(63, 127, 253)")
                    .style("cursor", "pointer");
            }
            if (groupIndex === numberOfGroups - 1) {
                select(this)
                    .style("color", null)
                    .style("cursor", "default");
            }
        })
        .style("color", "rgb(63, 127, 253)")
        .style("cursor", "pointer");
}

function createLegend(container, settings, colour, groupSize, groupIndex) {
    var legend = d3Legend
        .legendColor()
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
        })
        .cellFilter(cellFilter(groupSize, groupIndex || 0));

    if (settings.mainValues.length <= 1) {
        legend.labels(options => {
            const parts = options.domain[options.i].split("|");
            return parts.slice(0, -1).join("|");
        });
    }

    let legendSelection = container.select("svg.legend");
    if (legendSelection.size() === 0) {
        legendSelection = container.append("svg");
    }

    // render the legend
    legendSelection
        .attr("class", "legend")
        .style("z-index", "2")
        .call(legend)
        .select("g.legendCells")
        .attr("transform", "translate(20,20)")
        .selectAll("g.cell")
        .classed("hidden", data => settings.hideKeys && settings.hideKeys.includes(data));
}

function cellFilter(groupSize, groupIndex) {
    return (_, i) => i >= groupSize * groupIndex && i < groupSize * groupIndex + groupSize;
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
