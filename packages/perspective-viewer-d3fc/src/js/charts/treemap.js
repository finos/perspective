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
import treemapLayout from "../layout/treemapLayout";
import {treemapSeries} from "../series/treemap/treemapSeries";
import {tooltip} from "../tooltip/tooltip";
import {gridLayoutMultiChart} from "../layout/gridLayoutMultiChart";

function treemap(container, settings) {
    const treemapGrid = gridLayoutMultiChart()
        .elementsPrefix("treemap")
        .treeColor(treeColor)
        .treeColorDataMap(d => d.data);

    treemapGrid(settings, container);

    if (!treemapGrid.contentToRender()) return;

    const treemapContainer = treemapGrid.chartContainer();
    const treemapEnter = treemapGrid.chartEnter();
    const treemapDiv = treemapGrid.chartDiv();
    const color = treemapGrid.color();

    treemapContainer.append("text").attr("class", "parent");
    treemapEnter
        .merge(treemapDiv)
        .select("svg")
        .select("g.treemap")
        .each(function({split, data}) {
            const treemapElement = d3.select(this);
            const svgNode = this.parentNode;
            const {width, height} = svgNode.getBoundingClientRect();

            treemapLayout(width, height)(data);

            const title = treemapElement.select("text.title").text(split);
            title.attr("transform", `translate(0, ${-(height / 2 - 5)})`);

            treemapSeries()
                .data(data)
                .settings(settings)
                .container(d3.select(d3.select(this.parentNode).node().parentNode))
                .color(color)(treemapElement);

            tooltip().settings(settings)(treemapElement.selectAll("g"));
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
