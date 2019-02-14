/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3Legend from "d3-svg-legend";
import {getChartElement} from "../plugin/root";
import legendControlsTemplate from "../../html/legend-controls.html";

export function legend(container, settings, colour) {
    if (colour) {
        const groupSize = 15;
        const numberOfGroups = Math.ceil(colour.domain().length / groupSize);
        const doesLegendScroll = numberOfGroups > 1;

        if (doesLegendScroll) {
            const reloadLegend = index => createLegend(container, settings, colour, doesLegendScroll, groupSize, index);
            legendScrolling(container, settings, numberOfGroups, reloadLegend);
        }
        createLegend(container, settings, colour, doesLegendScroll, groupSize, settings.legendGroupIndex);
    }
}

function legendScrolling(container, settings, numberOfGroups, reloadLegend) {
    if (!settings.legendGroupIndex) settings.legendGroupIndex = 0;
    const legendControls = getLegendControls(container);

    const setPageText = () => legendControls.select("#page-text").text(`${settings.legendGroupIndex + 1}/${numberOfGroups}`);
    setPageText();
    const upArrow = legendControls.select("#up-arrow");
    const downArrow = legendControls.select("#down-arrow");

    upArrow.on("click", function() {
        if (settings.legendGroupIndex > 0) {
            settings.legendGroupIndex--;
            legendPage(downArrow);
        }
        deactivateArrow(upArrow, 0);
    });
    deactivateArrow(upArrow, 0);

    downArrow.on("click", function() {
        if (settings.legendGroupIndex < numberOfGroups - 1) {
            settings.legendGroupIndex++;
            legendPage(upArrow);
        }
        deactivateArrow(downArrow, numberOfGroups - 1);
    });
    if (settings.legendGroupIndex < numberOfGroups - 1) activateArrow(downArrow);

    function legendPage(arrow) {
        reloadLegend(settings.legendGroupIndex);
        setPageText();
        activateArrow(arrow);
    }

    function activateArrow(arrow) {
        arrow.style("color", "rgb(63, 127, 253)").style("cursor", "pointer");
    }

    function deactivateArrow(arrow, threshold) {
        if (settings.legendGroupIndex === threshold) arrow.style("color", null).style("cursor", "default");
    }
}

function getLegendControls(container) {
    let legendControls = container.select(".legend-controls");
    if (legendControls.size() === 0) {
        legendControls = container
            .append("div")
            .attr("class", "legend-controls")
            .html(legendControlsTemplate);
    }
    return legendControls;
}

function createLegend(container, settings, colour, doesLegendScroll, groupSize, groupIndex) {
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
        });
    if (doesLegendScroll) legend.cellFilter(cellFilter(groupSize, groupIndex));

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
