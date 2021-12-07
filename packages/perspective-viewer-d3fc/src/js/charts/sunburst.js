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
import {treeData} from "../data/treeData";
import {sunburstSeries} from "../series/sunburst/sunburstSeries";
import {tooltip} from "../tooltip/tooltip";
import {gridLayoutMultiChart} from "../layout/gridLayoutMultiChart";
import {colorRangeLegend} from "../legend/colorRangeLegend";
import {colorLegend} from "../legend/legend";

function sunburst(container, settings) {
    if (settings.crossValues.length === 0) {
        console.warn("Unable to render a chart in the absence of any groups.");
        return;
    }

    const data = treeData(settings);
    const color = treeColor(settings, data);
    const sunburstGrid = gridLayoutMultiChart().elementsPrefix("sunburst");

    container.datum(data).call(sunburstGrid);

    if (color) {
        const color_column = settings.realValues[1];
        if (
            settings.mainValues.find((x) => x.name === color_column)?.type ===
            "string"
        ) {
            const legend = colorLegend().settings(settings).scale(color);
            container.call(legend);
        } else {
            const legend = colorRangeLegend().scale(color);
            container.call(legend);
        }
    }

    const sunburstContainer = sunburstGrid.chartContainer();
    const sunburstEnter = sunburstGrid.chartEnter();
    const sunburstDiv = sunburstGrid.chartDiv();
    const sunburstTitle = sunburstGrid.chartTitle();
    const containerSize = sunburstGrid.containerSize();

    sunburstTitle.each((d, i, nodes) => select(nodes[i]).text(d.split));

    sunburstContainer
        .append("circle")
        .attr("fill", "none")
        .style("pointer-events", "all");

    sunburstContainer.append("text").attr("class", "parent");
    sunburstEnter
        .merge(sunburstDiv)
        .select("svg")
        .select("g.sunburst")
        .attr(
            "transform",
            `translate(${containerSize.width / 2}, ${containerSize.height / 2})`
        )
        .each(function ({split, data}) {
            const sunburstElement = select(this);
            const svgNode = this.parentNode;
            const {width, height} = svgNode.getBoundingClientRect();

            const radius =
                (Math.min(width, height) - 24) /
                (settings.crossValues.length * 2);
            sunburstSeries()
                .settings(settings)
                .split(split)
                .data(data)
                .color(color)
                .radius(radius)(sunburstElement);

            tooltip().settings(settings)(
                sunburstElement.selectAll("g.segment")
            );
        });
}

sunburst.plugin = {
    name: "Sunburst",
    max_cells: 7500,
    max_columns: 50,
    render_warning: true,
    initial: {
        type: "number",
        count: 1,
        names: ["Size", "Color", "Tooltip"],
    },
};

export default sunburst;
