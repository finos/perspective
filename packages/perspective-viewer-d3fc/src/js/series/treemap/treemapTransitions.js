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
import {toggleLabels, preventTextCollisions, lockTextOpacity, unlockTextOpacity, textOpacity, selectVisibleNodes, adjustLabelsThatOverflow} from "./treemapLabel";
import {calculateSubTreeMap} from "./treemapLevelCalculation";

export function returnToLevel(rects, nodesMerge, labels, settings, treemapDiv, treemapSvg, rootNode, parentCtrls) {
    if (settings.treemapLevel > 0) {
        const crossValues = rootNode.crossValue.split("|");
        executeTransition(rootNode, rects, nodesMerge, labels, settings, treemapDiv, treemapSvg, rootNode, 0, crossValues, parentCtrls, 1);

        settings.treemapRoute.slice(1, settings.treemapRoute.length).forEach(cv => {
            const d = nodesMerge.filter(d => d.crossValue === cv).datum();
            const crossValues = d.crossValue.split("|");
            calculateSubTreeMap(d, crossValues, nodesMerge, d.depth, rootNode);
            executeTransition(d, rects, nodesMerge, labels, settings, treemapDiv, treemapSvg, rootNode, d.depth, crossValues, parentCtrls, 1);
        });
    }
}

export function changeLevel(d, rects, nodesMerge, labels, settings, treemapDiv, treemapSvg, rootNode, parentCtrls) {
    if (settings.treemapLevel < d.depth) {
        settings.treemapRoute.push(d.crossValue);
    } else {
        settings.treemapRoute.pop();
    }

    settings.treemapLevel = d.depth;

    const crossValues = d.crossValue.split("|");
    if (!d.mapLevel[settings.treemapLevel] || !d.mapLevel[settings.treemapLevel].levelRoot) {
        calculateSubTreeMap(d, crossValues, nodesMerge, settings.treemapLevel, rootNode);
    }

    executeTransition(d, rects, nodesMerge, labels, settings, treemapDiv, treemapSvg, rootNode, settings.treemapLevel, crossValues, parentCtrls);
}

function executeTransition(d, rects, nodesMerge, labels, settings, treemapDiv, treemapSvg, rootNode, treemapLevel, crossValues, parentCtrls, duration) {
    const transitionDuration = !!duration ? duration : 350;
    const textFadeTransitionDuration = 350;
    const parent = d.parent;

    const t = treemapSvg
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeCubicOut);

    nodesMerge.each(d => (d.target = d.mapLevel[treemapLevel]));

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
        .then(() => preventTextCollisions(visibleLabelNodes))
        .then(() => adjustLabelsThatOverflow(visibleLabelNodes))
        .then(() => fadeTextTransition(labels, treemapSvg, textFadeTransitionDuration));

    // hide hidden svgs
    nodesMerge
        .transition(t)
        .tween("data", d => {
            const i = d3.interpolate(d.current, d.target);
            return t => (d.current = i(t));
        })
        .styleTween("opacity", d => () => d.current.opacity)
        .attrTween("pointer-events", d => () => (d.target.visible ? "all" : "none"));

    labels.each((_, i, labels) => lockTextOpacity(labels[i]));
    toggleLabels(nodesMerge, treemapLevel, crossValues);
    const visibleLabelNodes = selectVisibleNodes(nodesMerge);

    if (parent) {
        parentCtrls
            .hide(false)
            .text(d.data.name)
            .onClick(() => changeLevel(parent, rects, nodesMerge, labels, settings, treemapDiv, treemapSvg, rootNode, parentCtrls))();
    } else {
        parentCtrls.hide(true)();
    }
}

function fadeTextTransition(labels, treemapSvg, duration) {
    const transitionDuration = !!duration ? duration : 350;

    const t = treemapSvg
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeCubicOut);

    labels
        .transition(t)
        .filter(d => d.target.visible)
        .tween("data", (d, i, labels) => {
            const label = labels[i];
            const interpolation = d3.interpolate(lockedOpacity(d), targetOpacity(label));
            return t => (d.current = interpolation(t));
        })
        .styleTween("opacity", d => () => d.current)
        .end()
        .then(() => labels.each((_, i, labels) => unlockTextOpacity(labels[i])));
}

const lockedOpacity = d => d.target.textLockedAt.opacity;
const targetOpacity = d => textOpacity[d3.select(d).attr("class")];
