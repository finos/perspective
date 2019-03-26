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
import {getOrCreateElement} from "../utils/utils";
import legendControlsTemplate from "../../html/legend-controls.html";
import {cropCellContents} from "./styling/cropCellContents";

export default (fromLegend, settings) => {
    const legend = fromLegend || d3Legend.legendColor();

    const defaultPageSize = 15;

    let domain = [];
    let pageCount = 1;
    let pageSize = defaultPageSize;
    let pageIndex = settings.legend ? settings.legend.pageIndex : 0;
    let decorate = () => {};

    const scrollableLegend = selection => {
        domain = legend.scale().domain();
        pageCount = calculatePageCount();

        render(selection);
    };

    const render = selection => {
        renderControls(selection);
        renderLegend(selection);
        cropCellContents(selection);
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
                    setPage(pageIndex - 1);
                    render(selection);
                }
            });

        controls
            .select("#down-arrow")
            .attr("class", pageIndex >= pageCount - 1 ? "disabled" : "")
            .on("click", () => {
                if (pageIndex < pageCount - 1) {
                    setPage(pageIndex + 1);
                    render(selection);
                }
            });
    };

    const renderLegend = selection => {
        if (pageCount > 1) legend.cellFilter(cellFilter());
        selection.select("g.legendCells").remove();

        const legendElement = getLegendElement(selection);
        legendElement.call(legend);

        const cellContainerSize = selection
            .select("g.legendCells")
            .node()
            .getBBox();
        legendElement.attr("height", cellContainerSize.height + 20);

        decorate(selection);
    };

    const setPage = index => {
        pageIndex = index;
        settings.legend = {pageIndex};
    };

    const cellFilter = () => (_, i) => i >= pageSize * pageIndex && i < pageSize * pageIndex + pageSize;

    const calculatePageSize = selection => {
        const legendContainerRect = selection.node().getBoundingClientRect();
        const averageCellHeight = 16;
        let proposedPageSize = Math.floor(legendContainerRect.height / averageCellHeight) - 1;

        pageCount = calculatePageCount(proposedPageSize);

        //if page size is less than all legend items, leave space for the legend controls
        pageSize = proposedPageSize < domain.length ? proposedPageSize - 1 : proposedPageSize;

        if (pageIndex > pageCount - 1) {
            pageIndex = pageCount - 1;
        }
    };

    const calculatePageCount = proposedPageSize => {
        if (!!proposedPageSize) {
            return Math.ceil(domain.length / proposedPageSize);
        }
        return Math.ceil(domain.length / pageSize);
    };

    const getLegendControls = container =>
        getOrCreateElement(container, ".legend-controls", () =>
            container
                .append("g")
                .attr("class", "legend-controls")
                .html(legendControlsTemplate)
        );

    const getLegendElement = container => getOrCreateElement(container, ".legend", () => container.append("svg").attr("class", "legend"));

    scrollableLegend.decorate = (...args) => {
        if (!args.length) {
            return decorate;
        }
        decorate = args[0];
        return scrollableLegend;
    };

    scrollableLegend.useDynamicPageSize = (selection, resizeDirection) => {
        if (resizeDirection === "vertical" || resizeDirection === "diagonal") {
            calculatePageSize(selection);
        }
        render(selection);
    };

    rebindAll(scrollableLegend, legend);

    return scrollableLegend;
};
