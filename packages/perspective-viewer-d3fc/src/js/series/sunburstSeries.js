/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {select, arc, interpolate} from "d3";

export function sunburstSeries(sunburstElement, settings, split, data, color, radius) {
    const segment = sunburstElement.selectAll("g.segment").data(data.descendants().slice(1));
    const segmentEnter = segment
        .enter()
        .append("g")
        .attr("class", "segment");

    segmentEnter.append("path");
    segmentEnter
        .append("text")
        .attr("class", "segment")
        .attr("dy", "0.35em");
    const segmentMerge = segmentEnter.merge(segment);

    const path = segmentMerge
        .select("path")
        .attr("fill-opacity", d => (arcVisible(d.current) ? 1 : 0))
        .attr("user-select", d => (arcVisible(d.current) ? "initial" : "none"))
        .attr("pointer-events", d => (arcVisible(d.current) ? "initial" : "none"))
        .attr("d", d => drawArc(radius)(d.current));
    color && path.style("fill", d => color(d.data.color));

    const label = segmentMerge
        .select("text")
        .attr("fill-opacity", d => +labelVisible(d.current))
        .attr("transform", d => labelTransform(d.current, radius))
        .text(d => d.data.name)
        .each(function(d) {
            cropLabel.call(this, d, radius);
        });

    const parentTitle = sunburstElement.select("text.parent");
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
}

const drawArc = radius =>
    arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

const arcVisible = d => d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;

const labelVisible = d => d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.06;

function labelTransform(d, radius) {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    const y = ((d.y0 + d.y1) / 2) * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
}

function cropLabel(d, targetWidth) {
    let actualWidth = this.getBBox().width;
    if (actualWidth > targetWidth) {
        let labelText = d.data.name;
        const textSelection = select(this);
        while (actualWidth > targetWidth) {
            labelText = labelText.substring(0, labelText.length - 1);
            textSelection.text(() => labelText);
            actualWidth = this.getBBox().width;
        }
        textSelection.text(() => `${labelText.substring(0, labelText.length - 3).replace(/\s+$/, "")}...`);
    }
}

const clickHandler = (data, g, parent, parentTitle, path, label, radius, split, settings) => (p, skipTransition) => {
    settings.sunburstLevel[split] = p.data.name;
    if (p.parent) {
        parent.datum(p.parent);
        parent.style("cursor", "pointer");
        parentTitle.html(`&#8682; ${p.parent.data.name}`);
    } else {
        parent.datum(data);
        parent.style("cursor", "default");
        parentTitle.html("");
    }
    data.each(
        d =>
            (d.target = {
                x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                y0: Math.max(0, d.y0 - p.depth),
                y1: Math.max(0, d.y1 - p.depth)
            })
    );

    const t = g.transition().duration(skipTransition ? 0 : 750);
    path.transition(t)
        .tween("data", d => {
            const i = interpolate(d.current, d.target);
            return t => (d.current = i(t));
        })
        .filter(function(d) {
            return +this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
        .attr("fill-opacity", d => (arcVisible(d.target) ? 0.8 : 0))
        .attr("user-select", d => (arcVisible(d.target) ? "initial" : "none"))
        .attr("pointer-events", d => (arcVisible(d.target) ? "initial" : "none"))
        .attrTween("d", d => () => drawArc(radius)(d.current));

    label
        .filter(function(d) {
            return +this.getAttribute("fill-opacity") || labelVisible(d.target);
        })
        .transition(t)
        .attr("fill-opacity", d => +labelVisible(d.target))
        .attrTween("transform", d => () => labelTransform(d.current, radius));
};
