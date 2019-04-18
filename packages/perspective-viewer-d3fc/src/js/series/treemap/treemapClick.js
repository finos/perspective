/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {getGoToParentControls} from "./treemapControls";
import {calcWidth, calcHeight} from "./treemapSeries";
import {toggleLabels, preventTextCollisions} from "./treemapLabel";

const includesAllCrossValues = (d, crossValues) => crossValues.every(val => d.crossValue.split("|").includes(val));

export function changeLevel(d, rects, nodesMerge, labels, settings, treemapDiv, treemapSvg, rootNode) {
    settings.treemapLevel = d.depth;
    const crossValues = d.crossValue.split("|");

    if (!d.mapLevel[settings.treemapLevel] || !d.mapLevel[settings.treemapLevel].visible) {
        calculateSubTreeMap(d, crossValues, nodesMerge, settings, rootNode);
    }

    const parent = d.parent;

    const t = treemapSvg
        .transition()
        .duration(350)
        .ease(d3.easeCubicOut);

    nodesMerge.each(d => (d.target = d.mapLevel[settings.treemapLevel]));

    rects
        .transition(t)
        .filter(d => d.target.visible)
        .tween("data", d => {
            const i = d3.interpolate(d.current, d.target);
            return t => (d.current = i(t));
        })
        .styleTween("x", d => () => `${d.current.x0}px`)
        .styleTween("y", d => () => `${d.current.y0}px`)
        .styleTween("width", d => () => `${d.current.x1 - d.current.x0}px`)
        .styleTween("height", d => () => `${d.current.y1 - d.current.y0}px`);

    labels
        .transition(t)
        .filter(d => d.target.visible)
        .tween("data", d => {
            const i = d3.interpolate(d.current, d.target);
            return t => (d.current = i(t));
        })
        .attrTween("x", d => () => d.current.x0 + calcWidth(d.current) / 2)
        .attrTween("y", d => () => d.current.y0 + calcHeight(d.current) / 2)
        .end()
        .then(() => preventTextCollisions(nodesMerge));

    // hide hidden svgs
    nodesMerge
        .transition(t)
        .tween("data", d => {
            const i = d3.interpolate(d.current, d.target);
            return t => (d.current = i(t));
        })
        .styleTween("opacity", d => () => d.current.opacity)
        .attrTween("pointer-events", d => () => (d.target.visible ? "all" : "none"));

    toggleLabels(nodesMerge, settings.treemapLevel, crossValues);

    getGoToParentControls(treemapDiv)
        .style("display", parent ? "" : "none")
        .select("#goto-parent")
        .html(d.data.name)
        .on("click", () => changeLevel(parent, rects, nodesMerge, labels, settings, treemapDiv, treemapSvg, rootNode));
}

function calculateSubTreeMap(d, crossValues, nodesMerge, settings, rootNode) {
    const oldDimensions = {x: d.x0, y: d.y0, width: d.x1 - d.x0, height: d.y1 - d.y0};
    const newDimensions = {width: rootNode.x1 - rootNode.x0, height: rootNode.y1 - rootNode.y0};
    const dimensionMultiplier = {width: newDimensions.width / oldDimensions.width, height: newDimensions.height / oldDimensions.height};

    nodesMerge.each(d => {
        const x0 = (d.x0 - oldDimensions.x) * dimensionMultiplier.width;
        const y0 = (d.y0 - oldDimensions.y) * dimensionMultiplier.height;
        const width = calcWidth(d) * dimensionMultiplier.width;
        const height = calcHeight(d) * dimensionMultiplier.height;
        const visible = includesAllCrossValues(d, crossValues) && d.data.name != crossValues[settings.treemapLevel - 1];
        d.mapLevel[settings.treemapLevel] = {
            x0,
            x1: width + x0,
            y0,
            y1: height + y0,
            visible,
            opacity: visible ? 1 : 0
        };
    });
}
