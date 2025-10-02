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

import * as d3 from "d3";
import { treeColor } from "../series/treemap/treemapColor";
import { treeData } from "../data/treeData";
import { treemapSeries } from "../series/treemap/treemapSeries";
import { tooltip } from "../tooltip/tooltip";
import { gridLayoutMultiChart } from "../layout/gridLayoutMultiChart";
import { colorRangeLegend } from "../legend/colorRangeLegend";
import { colorLegend } from "../legend/legend";
import { HTMLSelection, Settings } from "../types";

function treemap(container: HTMLSelection, settings: Settings) {
    if (!settings.treemaps) settings.treemaps = {};

    const data = treeData(settings);
    const color = treeColor(
        settings,
        data.map((d) => d.data),
    );

    if (color) {
        this._container.classList.add("has-legend");
    }

    const treemapGrid = gridLayoutMultiChart().elementsPrefix("treemap");
    container.datum(data).call(treemapGrid);
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

    const treemapEnter = treemapGrid.chartEnter();
    const treemapDiv = treemapGrid.chartDiv();
    const treemapTitle = treemapGrid.chartTitle();

    treemapTitle.each((d, i, nodes) => d3.select(nodes[i]).text(d.split));
    treemapEnter
        .merge(treemapDiv)
        .select("svg")
        .select("g.treemap")
        .each(function ({ split, data }: { split: string; data: any[] }) {
            const treemapSvg = d3.select(this);

            // Can't tell if TreemapValue type should have optional properties, which means
            // that this setting of `{}` should have some default values on it.
            if (!settings.treemaps[split]) settings.treemaps[split] = {};

            treemapSeries()
                .settings(settings.treemaps[split], settings)
                .data(data)
                .container(
                    d3.select(d3.select(this.parentNode).node().parentNode),
                )
                .color(color)(treemapSvg);

            tooltip().settings(settings).centered(true)(
                treemapSvg.selectAll("g"),
            );
        });
}

treemap.plugin = {
    type: "Treemap",
    name: "Treemap",
    category: "Hierarchial Chart",
    max_cells: 3000,
    max_columns: 50,
    render_warning: true,
    initial: {
        type: "number",
        count: 1,
        names: ["Size", "Color", "Tooltip"],
    },
};
export default treemap;
