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
    const {width: containerWidth, height: containerHeight} = container.node().getBoundingClientRect();
    const padding = 30;
    const radius = (Math.min(containerWidth, containerHeight) - padding) / 6;

    const sunburstSvg = container.selectAll("svg").data(treeData(settings), d => d.split);
    sunburstSvg.exit().remove();

    const sunburstEnter = sunburstSvg.enter().append("svg");
    const sunburstContainer = sunburstEnter.append("g").attr("class", "sunburst");
    sunburstContainer.append("circle");
    sunburstContainer.append("text");
    sunburstEnter
        .merge(sunburstSvg)
        .style("width", containerWidth)
        .style("height", containerHeight)
        .select("g.sunburst")
        .attr("transform", `translate(${containerWidth / 2}, ${containerHeight / 2})`)
        .each(function({data, color}) {
            const sunburstElement = select(this);
            data.each(d => (d.current = d));

            const segment = sunburstElement.selectAll("g.segment").data(data.descendants().slice(1));
            const segmentEnter = segment
                .enter()
                .append("g")
                .attr("class", "segment")
                .attr("text-anchor", "middle");
            segmentEnter.append("path");
            segmentEnter.append("text");

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
                .attr("dy", "0.35em")
                .attr("user-select", "none")
                .attr("pointer-events", "none")
                .attr("fill-opacity", d => +labelVisible(d.current))
                .attr("transform", d => labelTransform(d.current, radius))
                .text(d => d.data.name);

            const parentTitle = sunburstElement
                .select("text")
                .attr("text-anchor", "middle")
                .attr("user-select", "none")
                .attr("pointer-events", "none");
            const parent = sunburstElement
                .select("circle")
                .attr("r", radius)
                .attr("fill", "none")
                .attr("pointer-events", "all")
                .datum(data);

            const onClick = clickHandler(data, sunburstElement, parent, parentTitle, path, label, radius);
            parent.on("click", onClick);
            path.filter(d => d.children)
                .style("cursor", "pointer")
                .on("click", onClick);
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
