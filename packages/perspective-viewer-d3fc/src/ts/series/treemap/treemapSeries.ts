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

import {
    toggleLabels,
    adjustLabelsThatOverflow,
    selectVisibleNodes,
} from "./treemapLabel";
import treemapLayout from "./treemapLayout";
import { changeLevel, returnToLevel } from "./treemapTransitions";
import { parentControls } from "./treemapControls";
import { calculateRootLevelMap, saveLabelMap } from "./treemapLevelCalculation";

export const nodeLevel = {
    leaf: "leafnode",
    branch: "branchnode",
    root: "rootnode",
};
export const calcWidth = (d) => d.x1 - d.x0;
export const calcHeight = (d) => d.y1 - d.y0;
const isLeafNode = (maxDepth, d) => d.depth === maxDepth;
const nodeLevelHelper = (maxDepth, d) =>
    d.depth === 0
        ? nodeLevel.root
        : isLeafNode(maxDepth, d)
          ? nodeLevel.leaf
          : nodeLevel.branch;

export function treemapSeries() {
    let settings = null;
    let root_settings = null;
    let data = null;
    let color = null;
    let treemapDiv = null;
    let parentCtrls = null;

    const _treemapSeries = (treemapSvg) => {
        parentCtrls = parentControls(treemapDiv);
        parentCtrls();

        const maxDepth = data.height;
        if (!settings.treemapLevel) settings.treemapLevel = 0;
        if (!settings.treemapRoute) settings.treemapRoute = [];
        const treemap = treemapLayout(
            treemapDiv.node().getBoundingClientRect().width,
            treemapDiv.node().getBoundingClientRect().height,
        );
        treemap(data);

        const nodes = treemapSvg.selectAll("g").data(data.descendants());
        const nodesEnter = nodes.enter().append("g");

        nodesEnter.append("rect");
        nodesEnter.append("text");

        // Draw child nodes first
        const nodesMerge = nodesEnter
            .merge(nodes)
            .sort((a, b) => b.depth - a.depth);

        const rects = nodesMerge
            .select("rect")
            .attr("class", (d) => `treerect ${nodeLevelHelper(maxDepth, d)}`)
            .style("x", (d) => `${d.x0}px`)
            .style("y", (d) => `${d.y0}px`)
            .style("width", (d) => `${calcWidth(d)}px`)
            .style("height", (d) => `${calcHeight(d)}px`);

        rects.style("fill", (d) => {
            if (nodeLevelHelper(maxDepth, d) === nodeLevel.leaf) {
                if (d.data.color) {
                    return color(d.data.color);
                } else {
                    return root_settings.colorStyles.series;
                }
            } else {
                return "transparent";
            }
        });

        const labels = nodesMerge
            .filter((d) => d.value !== 0)
            .select("text")
            .attr("x", (d) => d.x0 + calcWidth(d) / 2)
            .attr("y", (d) => d.y0 + calcHeight(d) / 2)
            .text((d) => d.label);

        const rootNode = rects.filter((d) => d.crossValue.length === 0).datum();
        calculateRootLevelMap(nodesMerge, rootNode);

        toggleLabels(nodesMerge, 0, []);
        adjustLabelsThatOverflow(selectVisibleNodes(nodesMerge));
        saveLabelMap(nodesMerge, 0);

        if (settings.treemapRoute.length === 0)
            settings.treemapRoute.push(rootNode.crossValue);
        rects
            .filter((d) => d.children)
            .on("click", (_event, d) =>
                changeLevel(
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
                ),
            );

        returnToLevel(
            rects,
            nodesMerge,
            labels,
            settings,
            treemapDiv,
            treemapSvg,
            rootNode,
            parentCtrls,
            root_settings,
        );
    };

    _treemapSeries.settings = (...args) => {
        if (!args.length) {
            return settings;
        }
        settings = args[0];
        root_settings = args[1];
        return _treemapSeries;
    };

    _treemapSeries.data = (...args) => {
        if (!args.length) {
            return data;
        }
        data = args[0];
        return _treemapSeries;
    };

    _treemapSeries.color = (...args) => {
        if (!args.length) {
            return color;
        }
        color = args[0];
        return _treemapSeries;
    };

    _treemapSeries.container = (...args) => {
        if (!args.length) {
            return treemapDiv;
        }
        treemapDiv = args[0];
        return _treemapSeries;
    };

    return _treemapSeries;
}
