/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {getOrCreateElement} from "../utils/utils";
import template from "../../html/zoom-controls.html";

export default () => {
    let chart = null;
    let settings = null;
    let xScale = null;
    let xCopy = null;
    let yScale = null;
    let yCopy = null;
    let bound = false;

    function zoomableChart(selection) {
        if (xScale || yScale) {
            const zoom = d3.zoom().on("zoom", () => {
                const {transform} = d3.event;
                settings.zoom = {
                    k: transform.k,
                    x: transform.x,
                    y: transform.y
                };

                applyTransform(transform);
                selection.call(chart);

                getZoomControls(selection)
                    .style("display", transform.k === 1 ? "none" : "")
                    .select("#zoom-reset")
                    .on("click", () => {
                        selection.select(".plot-area").call(zoom.transform, d3.zoomIdentity);
                    });
            });

            chart.decorate(sel => {
                if (!bound) {
                    bound = true;
                    // add the zoom interaction on the enter selection
                    const plotArea = sel.select(".plot-area");

                    plotArea
                        .on("measure.zoom-range", () => {
                            if (xCopy) xCopy.range([0, d3.event.detail.width]);
                            if (yCopy) yCopy.range([0, d3.event.detail.height]);

                            if (settings.zoom) {
                                const initialTransform = d3.zoomIdentity.translate(settings.zoom.x, settings.zoom.y).scale(settings.zoom.k);
                                plotArea.call(zoom.transform, initialTransform);
                            }
                        })
                        .call(zoom);
                }
            });
        }

        selection.call(chart);
    }

    zoomableChart.chart = (...args) => {
        if (!args.length) {
            return chart;
        }
        chart = args[0];
        return zoomableChart;
    };

    zoomableChart.settings = (...args) => {
        if (!args.length) {
            return settings;
        }
        settings = args[0];
        return zoomableChart;
    };

    zoomableChart.xScale = (...args) => {
        if (!args.length) {
            return xScale;
        }
        xScale = zoomableScale(args[0]);
        xCopy = xScale ? xScale.copy() : null;
        return zoomableChart;
    };

    zoomableChart.yScale = (...args) => {
        if (!args.length) {
            return yScale;
        }
        yScale = zoomableScale(args[0]);
        yCopy = yScale ? yScale.copy() : null;
        if (yCopy) {
            const yDomain = yCopy.domain();
            yCopy.domain([yDomain[1], yDomain[0]]);
        }
        return zoomableChart;
    };

    const applyTransform = transform => {
        if (xScale) {
            xScale.domain(transform.rescaleX(xCopy).domain());
        }

        if (yScale) {
            const yZoomDomain = transform.rescaleY(yCopy).domain();
            yScale.domain([yZoomDomain[1], yZoomDomain[0]]);
        }
    };

    const getZoomControls = container =>
        getOrCreateElement(container, ".zoom-controls", () =>
            container
                .append("div")
                .attr("class", "zoom-controls")
                .style("display", "none")
                .html(template)
        );

    const zoomableScale = scale => {
        if (scale && scale.nice) {
            return scale;
        }
        return null;
    };

    return zoomableChart;
};
