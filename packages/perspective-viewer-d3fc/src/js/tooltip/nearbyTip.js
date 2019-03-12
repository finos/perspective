/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import * as fc from "d3fc";
import {chainCallback} from "../utils/utils";
import {tooltip} from "./tooltip";
import {withOpacity} from "../series/seriesColors.js";
import {findBestFromData} from "../data/findBest";

export default () => {
    let chart = null;
    let settings = null;
    let xScale = null;
    let xCopy = null;
    let yScale = null;
    let yCopy = null;
    let color = null;
    let canvas = false;
    let data = null;
    let xValueName = "crossValue";
    let yValueName = "mainValue";

    const showTooltip = tooltip().alwaysShow(true);

    function nearbyTip(selection) {
        const chartPlotArea = `d3fc-${canvas ? "canvas" : "svg"}.plot-area`;
        if (xScale || yScale) {
            const pointer = fc.pointer().on("point", event => {
                const tooltipData = event.length ? [getClosestDataPoint(event[0])] : [];

                renderTip(selection, tooltipData);
            });

            chainCallback(chart.decorate, sel => {
                sel.select(chartPlotArea)
                    .on("measure.nearby-tip", () => {
                        if (xCopy) xCopy.range([0, d3.event.detail.width]);
                        if (yCopy) yCopy.range([0, d3.event.detail.height]);
                    })
                    .call(pointer);
            });
        }
    }

    const renderTip = (selection, tipData) => {
        const tips = selection
            .select("d3fc-svg.plot-area svg")
            .selectAll("circle.nearbyTip")
            .data(tipData);
        tips.exit().remove();

        tips.enter()
            .append("circle")
            .attr("class", "nearbyTip")
            .attr("r", 10)
            .merge(tips)
            .attr("transform", d => `translate(${xScale(d[xValueName])},${yScale(d[yValueName])})`)
            .style("stroke", "none")
            .style("fill", d => color && withOpacity(color(d.key)));

        showTooltip(tips, settings);
    };

    const getClosestDataPoint = pos => {
        return findBestFromData(
            data,
            v => {
                if (v[yValueName] === undefined || v[yValueName] === null || v[xValueName] === undefined || v[xValueName] === null) return null;

                return Math.sqrt(Math.pow(xScale(v[xValueName]) - pos.x, 2) + Math.pow(yScale(v[yValueName]) - pos.y, 2));
            },
            Math.min
        );
    };

    nearbyTip.chart = (...args) => {
        if (!args.length) {
            return chart;
        }
        chart = args[0];
        return nearbyTip;
    };

    nearbyTip.settings = (...args) => {
        if (!args.length) {
            return settings;
        }
        settings = args[0];
        return nearbyTip;
    };

    nearbyTip.xScale = (...args) => {
        if (!args.length) {
            return xScale;
        }
        xScale = args[0];
        xCopy = xScale ? xScale.copy() : null;
        return nearbyTip;
    };

    nearbyTip.yScale = (...args) => {
        if (!args.length) {
            return yScale;
        }
        yScale = args[0];
        yCopy = yScale ? yScale.copy() : null;
        return nearbyTip;
    };

    nearbyTip.color = (...args) => {
        if (!args.length) {
            return color;
        }
        color = args[0];
        return nearbyTip;
    };

    nearbyTip.canvas = (...args) => {
        if (!args.length) {
            return canvas;
        }
        canvas = args[0];
        return nearbyTip;
    };

    nearbyTip.data = (...args) => {
        if (!args.length) {
            return data;
        }
        data = args[0];
        return nearbyTip;
    };

    nearbyTip.xValueName = (...args) => {
        if (!args.length) {
            return xValueName;
        }
        xValueName = args[0];
        return nearbyTip;
    };

    nearbyTip.yValueName = (...args) => {
        if (!args.length) {
            return yValueName;
        }
        yValueName = args[0];
        return nearbyTip;
    };

    return nearbyTip;
};
