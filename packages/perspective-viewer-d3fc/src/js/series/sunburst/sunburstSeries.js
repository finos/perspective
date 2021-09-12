/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {drawArc, arcVisible} from "./sunburstArc";
import {labelVisible, labelTransform, cropLabel} from "./sunburstLabel";
import {clickHandler} from "./sunburstClick";

export function sunburstSeries() {
    let settings = null;
    let split = null;
    let data = null;
    let color = null;
    let radius = null;

    const _sunburstSeries = (sunburstElement) => {
        const segment = sunburstElement
            .selectAll("g.segment")
            .data(data.descendants().slice(1));
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
            .attr("fill-opacity", (d) => (arcVisible(d.current) ? 1 : 0))
            .attr("user-select", (d) =>
                arcVisible(d.current) ? "initial" : "none"
            )
            .attr("pointer-events", (d) =>
                arcVisible(d.current) ? "initial" : "none"
            )
            .attr("d", (d) => drawArc(radius)(d.current));
        color && path.style("fill", (d) => color(d.data.color));

        const label = segmentMerge
            .select("text")
            .attr("fill-opacity", (d) => +labelVisible(d.current))
            .attr("transform", (d) => labelTransform(d.current, radius))
            .text((d) => d.label)
            .each(function (d) {
                cropLabel.call(this, d, radius);
            });

        const parentTitle = sunburstElement.select("text.parent");
        const parent = sunburstElement
            .select("circle")
            .attr("r", radius)
            .datum(data);

        const onClick = clickHandler(
            data,
            sunburstElement,
            parent,
            parentTitle,
            path,
            label,
            radius,
            split,
            settings
        );
        if (settings.sunburstLevel) {
            const currentLevel = data
                .descendants()
                .find((d) => d.data.name === settings.sunburstLevel[split]);
            currentLevel && onClick(currentLevel, true);
        } else {
            settings.sunburstLevel = {};
        }
        parent.on("click", (d) => onClick(d, false));
        path.filter((d) => d.children)
            .style("cursor", "pointer")
            .on("click", (d) => onClick(d, false));
    };

    _sunburstSeries.settings = (...args) => {
        if (!args.length) {
            return settings;
        }
        settings = args[0];
        return _sunburstSeries;
    };

    _sunburstSeries.split = (...args) => {
        if (!args.length) {
            return split;
        }
        split = args[0];
        return _sunburstSeries;
    };

    _sunburstSeries.data = (...args) => {
        if (!args.length) {
            return data;
        }
        data = args[0];
        return _sunburstSeries;
    };

    _sunburstSeries.color = (...args) => {
        if (!args.length) {
            return color;
        }
        color = args[0];
        return _sunburstSeries;
    };

    _sunburstSeries.radius = (...args) => {
        if (!args.length) {
            return radius;
        }
        radius = args[0];
        return _sunburstSeries;
    };

    return _sunburstSeries;
}
