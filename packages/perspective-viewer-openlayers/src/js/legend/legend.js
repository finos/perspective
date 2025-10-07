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

import { select, axisRight, scaleLinear, range } from "d3";

const height = 100;

export function showLegend(container, colorScale, extent) {
    const legend = getOrCreateDiv(container);
    const domain = [extent.min, extent.max];
    const scale = scaleLinear().domain(domain).range([height, 0]).nice();

    // axis
    const axis = axisRight(scale).tickSize(15).tickArguments([5]);
    legend.select(".map-legend-axis").call(axis);

    // color bar
    const colorLines = range(1, height + 1, 1);
    const lines = legend
        .select(".map-legend-color")
        .selectAll("line")
        .data(colorLines);
    lines
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", 15)
        .merge(lines)
        .attr("y1", (d) => (d * height) / 100)
        .attr("y2", (d) => (d * height) / 100)
        .attr(
            "stroke",
            (d) =>
                colorScale(
                    ((100 - d) * (extent.max - extent.min)) / 100 + extent.min,
                ).stroke,
        );

    let maxLabelWidth = 0;
    legend.selectAll(".map-legend-axis .tick text").each((d, i, node) => {
        maxLabelWidth = Math.max(maxLabelWidth, node[i].getBBox().width);
    });

    legend.style("width", `${maxLabelWidth + 37}px`);
}

export function hideLegend(container) {
    select(container).select(".map-legend").remove();
}

const getOrCreateDiv = (container) => {
    const selection = select(container);
    let legend = selection.select(".map-legend");

    if (legend.size() === 0) {
        legend = selection.append("svg").attr("class", "map-legend");
        // color bar
        legend
            .append("g")
            .attr("class", "map-legend-color")
            .attr("transform", "translate(10, 10)");
        // axis
        legend
            .append("g")
            .attr("class", "map-legend-axis")
            .attr("transform", "translate(10, 10)");
    }

    return legend;
};
