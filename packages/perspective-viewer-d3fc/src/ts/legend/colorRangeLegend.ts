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
import * as fc from "d3fc/index.js";
import { getOrCreateElement } from "../utils/utils";
import { getValueFormatterForRange as getValueFormatter } from "../axis/valueFormatter";

export function colorRangeLegend() {
    let scale = null;

    function legend(container) {
        const legendSelection = getOrCreateElement(
            container,
            "div.legend-container",
            () =>
                container
                    .append("div")
                    .attr("class", "legend-container legend-color")
                    .style("z-index", "2"),
        );
        const { width, height } = legendSelection
            .node()
            .getBoundingClientRect();

        const xScale = d3.scaleBand<number>().domain([0, 1]).range([0, width]);

        const domain = scale.copy().nice().domain();
        const paddedDomain = fc
            .extentLinear()
            .pad([0.1, 0.1])
            .padUnit("percent")(domain);
        const [min, max] = paddedDomain;
        const expandedDomain = d3.range(min, max, (max - min) / height);

        const yScale = d3.scaleLinear().domain(paddedDomain).range([height, 0]);

        const svgBar = fc
            .autoBandwidth(fc.seriesSvgBar())
            .xScale(xScale)
            .yScale(yScale)
            .crossValue(0)
            .baseValue((_, i) => expandedDomain[Math.max(0, i - 1)])
            .mainValue((d) => d)
            .decorate((selection) => {
                selection.selectAll("path").style("fill", (d) => scale(d));
            });

        const middle =
            domain[0] < 0 && domain[1] > 0
                ? 0
                : Math.round((domain[1] + domain[0]) / 2);
        const tickValues = [...domain, middle];

        let valueformatter = getValueFormatter(min, max);
        const axisLabel = fc
            .axisRight(yScale)
            .tickValues(tickValues)
            .tickSizeOuter(0)
            .tickFormat((d) => valueformatter(d));

        const legendSvg = getOrCreateElement(legendSelection, "svg", () =>
            legendSelection.append("svg"),
        )
            .style("width", width)
            .style("height", height);
        const legendBar = getOrCreateElement(legendSvg, "g", () =>
            legendSvg.append("g"),
        )
            .datum(expandedDomain)
            .call(svgBar);

        const barWidth = Math.abs(legendBar.node().getBBox().x);
        getOrCreateElement(legendSvg, "#legend-axis", () =>
            legendSvg.append("g").attr("id", "legend-axis"),
        )
            .attr("transform", `translate(${barWidth})`)
            .datum(expandedDomain)
            .call(axisLabel)
            .select(".domain")
            .attr("visibility", "hidden");
    }

    legend.scale = (...args) => {
        if (!args.length) {
            return scale;
        }
        scale = args[0];
        return legend;
    };

    return legend;
}
