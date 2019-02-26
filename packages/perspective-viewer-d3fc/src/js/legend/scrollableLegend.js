/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3Legend from "d3-svg-legend";
import {rebindAll} from "d3fc";
import {areArraysEqualSimple, getOrCreateElement} from "../utils/utils";
import legendControlsTemplate from "../../html/legend-controls.html";

export default () => {
    const legend = d3Legend.legendColor();
    let domain = [];
    let pageCount = 1;
    let pageSize = 15;
    let pageIndex = 0;

    const scrollableLegend = selection => {
        const newDomain = legend.scale().domain();
        if (!areArraysEqualSimple(domain, newDomain)) {
            pageIndex = 0;
            domain = newDomain;
        }
        pageCount = Math.ceil(domain.length / pageSize);

        render(selection);
    };

    const render = selection => {
        renderControls(selection);
        renderLegend(selection);
    };

    const renderControls = selection => {
        const controls = getLegendControls(selection);
        controls.style("display", pageCount <= 1 ? "none" : "block");

        controls.select("#page-text").text(`${pageIndex + 1}/${pageCount}`);

        controls
            .select("#up-arrow")
            .attr("class", pageIndex === 0 ? "disabled" : "")
            .on("click", () => {
                if (pageIndex > 0) {
                    pageIndex--;
                    render(selection);
                }
            });

        controls
            .select("#down-arrow")
            .attr("class", pageIndex >= pageCount - 1 ? "disabled" : "")
            .on("click", () => {
                if (pageIndex < pageCount - 1) {
                    pageIndex++;
                    render(selection);
                }
            });
    };

    const renderLegend = selection => {
        if (pageCount > 1) legend.cellFilter(cellFilter());
        const legendElement = getLegendElement(selection);
        legendElement.call(legend);

        const cellSize = selection
            .select("g.legendCells")
            .node()
            .getBBox();
        legendElement.attr("height", cellSize.height + 20);
    };

    const cellFilter = () => {
        return (_, i) => i >= pageSize * pageIndex && i < pageSize * pageIndex + pageSize;
    };

    const getLegendControls = container =>
        getOrCreateElement(container, ".legend-controls", () =>
            container
                .append("g")
                .attr("class", "legend-controls")
                .html(legendControlsTemplate)
        );

    const getLegendElement = container => getOrCreateElement(container, ".legend", () => container.append("svg").attr("class", "legend"));

    rebindAll(scrollableLegend, legend);
    return scrollableLegend;
};
