/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as fc from "d3fc";
import { tooltip } from "./tooltip";
import { withOpacity } from "../series/seriesColors.js";
import { findBestFromData } from "../data/findBest";
import { raiseEvent } from "./selectionEvent";

export default () => {
    const base = tooltip().alwaysShow(true);

    let xScale = null;
    let yScale = null;
    let color = null;
    let size = null;
    let canvas = false;
    let data = null;
    let xValueName = "crossValue";
    let yValueName = "mainValue";
    let altDataWithScale = null;
    let scale_factor = 1;
    let onPointHandler = null;

    function nearbyTip(selection) {
        const chartPlotArea = `d3fc-${canvas ? "canvas" : "svg"}.plot-area`;
        if (xScale || yScale) {
            let tooltipData = null;
            const pointer = fc.pointer().on("point", async (event) => {
                const closest = event.length
                    ? getClosestDataPoint(event[0])
                    : null;
                tooltipData = closest ? [closest.data] : [];

                let updatedData = onPointHandler
                    ? await onPointHandler(tooltipData)
                    : tooltipData;
                // console.log("updatedData", updatedData);
                const useYScale = closest ? closest.scale : yScale;

                renderTip(selection, tooltipData, useYScale);
            });

            selection
                .select(chartPlotArea)
                .on("measure.nearbyTip", () => renderTip(selection, []))
                .on("click", () => {
                    if (tooltipData.length) {
                        raiseEvent(
                            selection.node(),
                            tooltipData[0],
                            base.settings()
                        );
                    }
                })
                .call(pointer);
        }
    }

    const renderTip = (selection, tipData, useYScale = yScale) => {
        const tips = selection
            .select("d3fc-svg.plot-area svg")
            .selectAll("circle.nearbyTip")
            .data(tipData);
        tips.exit().remove();

        tips.enter()
            .append("circle")
            .attr("class", "nearbyTip")
            .merge(tips)
            .attr("r", (d) =>
                size ? scale_factor * Math.sqrt(size(d.size)) : 10
            )
            .attr(
                "transform",
                (d) =>
                    `translate(${xScale(d[xValueName])},${useYScale(
                        d[yValueName]
                    )})`
            )
            .style("stroke", "none")
            .style("fill", (d) => color && d.key && withOpacity(color(d.key)));

        base(tips);
    };

    const getClosestDataPoint = (pos) => {
        const distFn = (scale) => {
            return (v) => {
                if (
                    v[yValueName] === undefined ||
                    v[yValueName] === null ||
                    v[xValueName] === undefined ||
                    v[xValueName] === null
                )
                    return null;

                return Math.sqrt(
                    Math.pow(xScale(v[xValueName]) - pos.x, 2) +
                        Math.pow(scale(v[yValueName]) - pos.y, 2)
                );
            };
        };

        // Check the main data
        const dist1 = distFn(yScale);
        const best1 = findBestFromData(data, dist1, Math.min);

        if (altDataWithScale) {
            // Check the alt data with its scale, to see if any are closer
            const dist2 = distFn(altDataWithScale.yScale);
            const best2 = findBestFromData(
                altDataWithScale.data,
                dist2,
                Math.min
            );
            return dist1(best1) <= dist2(best2)
                ? { data: best1, scale: yScale }
                : { data: best2, scale: altDataWithScale.yScale };
        }
        return { data: best1, scale: yScale };
    };

    nearbyTip.scaleFactor = (...args) => {
        if (!args.length) {
            return scale_factor;
        }
        scale_factor = args[0];
        return nearbyTip;
    };
    nearbyTip.xScale = (...args) => {
        if (!args.length) {
            return xScale;
        }
        xScale = args[0];
        return nearbyTip;
    };

    nearbyTip.yScale = (...args) => {
        if (!args.length) {
            return yScale;
        }
        yScale = args[0];
        return nearbyTip;
    };

    nearbyTip.color = (...args) => {
        if (!args.length) {
            return color;
        }
        color = args[0];
        return nearbyTip;
    };

    nearbyTip.size = (...args) => {
        if (!args.length) {
            return size;
        }
        size = args[0] ? args[0].copy().range([40, 4000]) : null;
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

    nearbyTip.altDataWithScale = (...args) => {
        if (!args.length) {
            return altDataWithScale;
        }
        altDataWithScale = args[0];
        return nearbyTip;
    };

    nearbyTip.onPoint = (func) => {
        if (func) {
            onPointHandler = func;
        }

        return nearbyTip;
    };

    fc.rebindAll(nearbyTip, base);
    return nearbyTip;
};
