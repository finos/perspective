/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {treeColor} from "../series/treemap/treemapColor";
import {treeData} from "../data/treeData";
import {treemapSeries} from "../series/treemap/treemapSeries";
import {tooltip} from "../tooltip/tooltip";
import {gridLayoutMultiChart} from "../layout/gridLayoutMultiChart";
import {colorRangeLegend} from "../legend/colorRangeLegend";

function treemap(container, settings) {
    if (settings.crossValues.length === 0) {
        console.warn("Unable to render a chart in the absence of any groups.");
        return;
    }

    const data = treeData(settings);
    const color = treeColor(settings, data.map(d => d.data));
    const treemapGrid = gridLayoutMultiChart().elementsPrefix("treemap");

    container.datum(data).call(treemapGrid);

    if (color) {
        const legend = colorRangeLegend().scale(color);
        container.call(legend);
    }

    const treemapContainer = treemapGrid.chartContainer();
    const treemapEnter = treemapGrid.chartEnter();
    const treemapDiv = treemapGrid.chartDiv();

    treemapContainer.append("text").attr("class", "parent");
    treemapEnter
        .merge(treemapDiv)
        .select("svg")
        .select("g.treemap")
        .each(function({split, data}) {
            const treemapSvg = d3.select(this);
            const svgNode = this.parentNode;
            const {height} = svgNode.getBoundingClientRect();

            const title = treemapSvg.select("text.title").text(split);
            title.attr("transform", `translate(0, ${-(height / 2 - 5)})`);

            treemapSeries()
                .settings(settings)
                .data(data)
                .container(d3.select(d3.select(this.parentNode).node().parentNode))
                .color(color)(treemapSvg);

            tooltip().settings(settings)(treemapSvg.selectAll("g"));
        });
}

treemap.plugin = {
    type: "d3_treemap",
    name: "[D3] Treemap",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2
    }
};
export default treemap;
