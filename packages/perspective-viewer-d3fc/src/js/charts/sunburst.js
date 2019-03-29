/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {select} from "d3";
import {treeData} from "../data/treeData";
import {clickHandler} from "../interaction/clickHandler";
import {drawArc, arcVisible} from "../series/arcSeries";
import {labelVisible, labelTransform} from "../axis/sunburstLabel";

function sunburst(container, settings) {
    const sunburstData = treeData(settings);
    const containerRect = container.node().getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const padding = 30;
    const minSize = 400;
    const cols = sunburstData.length === 1 ? 1 : Math.floor(containerWidth / minSize);
    const rows = sunburstData.length / cols;
    let scrollMargin = 0;
    if ((containerHeight / cols) * rows > containerHeight) {
        scrollMargin = 17;
        container.style("overflow-y", "auto");
    } else {
        container.style("overflow-y", "hidden");
    }

    const radius = (Math.min(containerWidth, containerHeight) - padding) / 6 / cols - scrollMargin;
    const sunburstSvg = container.selectAll("svg").data(sunburstData, d => d.split);
    sunburstSvg.exit().remove();

    const sunburstEnter = sunburstSvg.enter().append("svg");
    const sunburstContainer = sunburstEnter.append("g").attr("class", "sunburst");
    sunburstContainer
        .append("circle")
        .attr("fill", "none")
        .attr("pointer-events", "all");

    sunburstContainer
        .append("text")
        .attr("text-anchor", "middle")
        .attr("user-select", "none")
        .attr("pointer-events", "none");

    sunburstEnter
        .merge(sunburstSvg)
        .style("width", containerWidth / cols - scrollMargin)
        .style("height", containerHeight / cols)
        .select("g.sunburst")
        .attr("transform", `translate(${containerWidth / 2 / cols}, ${containerHeight / 2 / cols})`)
        .each(function({split, data, color}) {
            const sunburstElement = select(this);
            data.each(d => (d.current = d));

            const segment = sunburstElement.selectAll("g.segment").data(data.descendants().slice(1));
            const segmentEnter = segment
                .enter()
                .append("g")
                .attr("class", "segment")
                .attr("text-anchor", "middle");

            segmentEnter.append("path");
            segmentEnter
                .append("text")
                .attr("dy", "0.35em")
                .attr("user-select", "none")
                .attr("pointer-events", "none");

            const segmentMerge = segmentEnter.merge(segment);

            const path = segmentMerge
                .select("path")
                .attr("fill", d => color(d.data.color))
                .attr("fill-opacity", d => (arcVisible(d.current) ? 0.8 : 0))
                .attr("user-select", d => (arcVisible(d.current) ? "initial" : "none"))
                .attr("pointer-events", d => (arcVisible(d.current) ? "initial" : "none"))
                .attr("d", d => drawArc(radius)(d.current));

            const label = segmentMerge
                .select("text")
                .attr("fill-opacity", d => +labelVisible(d.current))
                .attr("transform", d => labelTransform(d.current, radius))
                .text(d => d.data.name);

            const parentTitle = sunburstElement.select("text");
            const parent = sunburstElement
                .select("circle")
                .attr("r", radius)
                .datum(data);

            const onClick = clickHandler(data, sunburstElement, parent, parentTitle, path, label, radius, split, settings);
            if (settings.sunburstLevel) {
                const currentLevel = data.descendants().find(d => d.data.name === settings.sunburstLevel[split]);
                currentLevel && onClick(currentLevel, true);
            } else {
                settings.sunburstLevel = {};
            }
            parent.on("click", d => onClick(d, false));
            path.filter(d => d.children)
                .style("cursor", "pointer")
                .on("click", d => onClick(d, false));
        });
}
sunburst.plugin = {
    type: "d3_sunburst",
    name: "[D3] Sunburst",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2
    }
};

export default sunburst;
