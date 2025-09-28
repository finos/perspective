// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import * as d3 from "d3";
import { calcWidth, calcHeight } from "./treemapSeries";
import {
    labelMapExists,
    toggleLabels,
    preventTextCollisions,
    lockTextOpacity,
    unlockTextOpacity,
    textOpacity,
    selectVisibleNodes,
    adjustLabelsThatOverflow,
    restoreLabels,
} from "./treemapLabel";
import { calculateSubTreeMap, saveLabelMap } from "./treemapLevelCalculation";
import { raiseEvent } from "../../tooltip/selectionEvent";

export function returnToLevel(
    rects,
    nodesMerge,
    labels,
    settings,
    treemapDiv,
    treemapSvg,
    rootNode,
    parentCtrls,
    root_settings,
) {
    if (settings.treemapLevel > 0) {
        const crossValues = rootNode.crossValue;
        executeTransition(
            rootNode,
            rects,
            nodesMerge,
            labels,
            settings,
            treemapDiv,
            treemapSvg,
            rootNode,
            0,
            crossValues,
            parentCtrls,
            root_settings,
            1,
            false,
        );

        settings.treemapRoute
            .slice(1, settings.treemapRoute.length)
            .forEach((cv) => {
                const d = nodesMerge.filter((d) => d.crossValue === cv).datum();
                const crossValues = d.crossValue;
                calculateSubTreeMap(
                    d,
                    crossValues,
                    nodesMerge,
                    d.depth,
                    rootNode,
                    treemapDiv,
                );
                executeTransition(
                    d,
                    rects,
                    nodesMerge,
                    labels,
                    settings,
                    treemapDiv,
                    treemapSvg,
                    rootNode,
                    d.depth,
                    crossValues,
                    parentCtrls,
                    root_settings,
                    1,
                    false,
                );
            });
    }
}

export function changeLevel(
    d,
    rects,
    nodesMerge,
    labels,
    settings,
    treemapDiv,
    treemapSvg,
    rootNode,
    parentCtrls,
    root_settings,
) {
    if (!d.children) return;

    if (settings.treemapLevel < d.depth) {
        settings.treemapRoute.push(d.crossValue);
    } else {
        settings.treemapRoute.pop();
    }

    settings.treemapLevel = d.depth;

    const crossValues = d.crossValue;

    if (
        !d.mapLevel[settings.treemapLevel] ||
        !d.mapLevel[settings.treemapLevel].levelRoot
    ) {
        calculateSubTreeMap(
            d,
            crossValues,
            nodesMerge,
            settings.treemapLevel,
            rootNode,
            treemapDiv,
        );
    }

    executeTransition(
        d,
        rects,
        nodesMerge,
        labels,
        settings,
        treemapDiv,
        treemapSvg,
        rootNode,
        settings.treemapLevel,
        crossValues,
        parentCtrls,
        root_settings,
    );
}

function executeTransition(
    d,
    rects,
    nodesMerge,
    labels,
    settings,
    treemapDiv,
    treemapSvg,
    rootNode,
    treemapLevel,
    crossValues,
    parentCtrls,
    root_settings,
    duration = 500,
    recordLabelMap = true,
) {
    const parent = d.parent;

    const t = treemapSvg
        .transition("main transition")
        .duration(duration)
        .ease(d3.easeCubicOut);

    nodesMerge.each((d) => (d.target = d.mapLevel[treemapLevel]));

    if (!labelMapExists(d)) preventUserInteraction(nodesMerge, parentCtrls);

    // hide hidden svgs
    nodesMerge
        .transition(t)
        .tween("data", (d) => {
            const i = d3.interpolate(d.current, d.target);
            return (t) => (d.current = i(t));
        })
        .styleTween("opacity", (d) => () => d.current.opacity)
        .attrTween(
            "pointer-events",
            (d) => () => (d.target.visible ? "all" : "none"),
        );

    rects
        .transition(t)
        .filter((d) => d.target.visible)
        .styleTween("x", (d) => () => `${d.current.x0}px`)
        .styleTween("y", (d) => () => `${d.current.y0}px`)
        .styleTween("width", (d) => () => `${d.current.x1 - d.current.x0}px`)
        .styleTween("height", (d) => () => `${d.current.y1 - d.current.y0}px`);

    labels
        .transition(t)
        .filter((d) => d.target.visible)
        .attrTween("x", (d) => () => d.current.x0 + calcWidth(d.current) / 2)
        .attrTween("y", (d) => () => d.current.y0 + calcHeight(d.current) / 2)
        .end()
        .catch(() => enableUserInteraction(nodesMerge))
        .then(() => {
            if (!labelMapExists(d)) {
                preventTextCollisions(visibleLabelNodes);
                adjustLabelsThatOverflow(visibleLabelNodes);
                fadeTextTransition(labels, treemapSvg, duration);
                if (recordLabelMap) saveLabelMap(nodesMerge, treemapLevel);
                enableUserInteraction(nodesMerge, parentCtrls);
            }
        })
        .catch((ex) => {
            console.error(
                "Exception completing promises after main transition",
                ex,
            );
            enableUserInteraction(nodesMerge, parentCtrls);
        });

    if (!labelMapExists(d)) {
        labels.each((_, i, labels) => lockTextOpacity(labels[i]));
        toggleLabels(nodesMerge, treemapLevel, crossValues);
    } else {
        restoreLabels(nodesMerge);
    }

    const visibleLabelNodes = selectVisibleNodes(nodesMerge);

    if (parent) {
        parentCtrls
            .hide(false)
            .text(d.label)
            .onClick(() => {
                changeLevel(
                    parent,
                    rects,
                    nodesMerge,
                    labels,
                    settings,
                    treemapDiv,
                    treemapSvg,
                    rootNode,
                    parentCtrls,
                    root_settings,
                    // duration
                );
                const viewer = treemapDiv.node().getRootNode()
                    .host.parentElement;
                raiseEvent(viewer, parent, root_settings);
            })();
    } else {
        parentCtrls.hide(true)();
    }
}

async function fadeTextTransition(labels, treemapSvg, duration = 400) {
    const t = treemapSvg
        .transition("text fade transition")
        .duration(duration)
        .ease(d3.easeCubicOut);

    await labels
        .transition(t)
        .filter((d) => d.target.visible)
        .tween("data", (d, i, labels) => {
            const label = labels[i];
            const interpolation = d3.interpolate(
                lockedOpacity(d),
                targetOpacity(label),
            );
            return (t) => (d.current.opacity = interpolation(t));
        })
        .styleTween("opacity", (d) => () => d.current.opacity)
        .end()
        .catch((ex) => console.error("Exception in text fade transition", ex))
        .then(() =>
            labels.each((_, i, labels) => unlockTextOpacity(labels[i])),
        );
}

const lockedOpacity = (d) => d.target.textLockedAt.opacity;
const targetOpacity = (d) => textOpacity[d3.select(d).attr("class")];

const preventUserInteraction = (nodes, parentCtrls) => {
    parentCtrls.deactivate(true);

    nodes.each((_, i, nodes) => {
        const rect = d3.select(nodes[i]).selectAll("rect");
        rect.style("pointer-events", "none");
    });
};

const enableUserInteraction = (nodes, parentCtrls = undefined) => {
    if (parentCtrls) parentCtrls.deactivate(false);

    nodes.each((_, i, nodes) => {
        const rect = d3.select(nodes[i]).selectAll("rect");
        rect.style("pointer-events", null);
    });
};
