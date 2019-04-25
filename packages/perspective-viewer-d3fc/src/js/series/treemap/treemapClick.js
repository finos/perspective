/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {calcWidth, calcHeight} from "./treemapSeries";
import {toggleLabels, preventTextCollisions} from "./treemapLabel";
import {calculateSubTreeMap} from "./treemapLevelCalculation";

export function changeLevel(d, rects, nodesMerge, labels, settings, treemapDiv, treemapSvg, rootNode, parentCtrls) {
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

    if (parent) {
        parentCtrls
            .hide(false)
            .text(d.data.name)
            .onClick(() => changeLevel(parent, rects, nodesMerge, labels, settings, treemapDiv, treemapSvg, rootNode, parentCtrls))();
    } else {
        parentCtrls.hide(true)();
    }
}
