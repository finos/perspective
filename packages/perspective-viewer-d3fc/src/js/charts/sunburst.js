/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {select} from "d3";
import {treeColor} from "../series/sunburst/sunburstColor";
import {sunburstSeries} from "../series/sunburst/sunburstSeries";
import {tooltip} from "../tooltip/tooltip";
import {gridLayoutMultiChart} from "../layout/gridLayoutMultiChart";

function sunburst(container, settings) {
    const sunburstGrid = gridLayoutMultiChart()
        .elementsPrefix("sunburst")
        .treeColor(treeColor)
        .treeColorDataMap(d => d.extents);

    sunburstGrid(settings, container);

    if (!sunburstGrid.contentToRender()) return;

    const sunburstContainer = sunburstGrid.chartContainer();
    const sunburstEnter = sunburstGrid.chartEnter();
    const sunburstDiv = sunburstGrid.chartDiv();
    const color = sunburstGrid.color();
    const containerSize = sunburstGrid.containerSize();

    sunburstContainer
        .append("circle")
        .attr("fill", "none")
        .attr("pointer-events", "all");

    sunburstContainer.append("text").attr("class", "parent");
    sunburstEnter
        .merge(sunburstDiv)
        .select("svg")
        .select("g.sunburst")
        .attr("transform", `translate(${containerSize.width / 2}, ${containerSize.height / 2})`)
        .each(function({split, data}) {
            const sunburstElement = select(this);
            const svgNode = this.parentNode;
            const {width, height} = svgNode.getBoundingClientRect();

            const title = sunburstElement.select("text.title").text(split);
            title.attr("transform", `translate(0, ${-(height / 2 - 5)})`);

            const radius = (Math.min(width, height) - 120) / 6;
            sunburstSeries()
                .settings(settings)
                .split(split)
                .data(data)
                .color(color)
                .radius(radius)(sunburstElement);

            tooltip().settings(settings)(sunburstElement.selectAll("g.segment"));
        });
}
sunburst.plugin = {
    type: "d3_sunburst",
    name: "[D3] Sunburst",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2,
        names: ["Size", "Color"]
    }
};

export default sunburst;
