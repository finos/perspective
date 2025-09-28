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
import * as d3Legend from "d3-svg-legend";
import scrollableLegend from "./scrollableLegend";
import { withoutOpacity } from "../series/seriesColors";
import { getChartElement } from "../plugin/root";
import { getOrCreateElement } from "../utils/utils";
import { D3Scale } from "../types";

export type LegendComponentSettings = {
    hideKeys?: any[];
    mainValues?: any[];
};

const scrollColorLegend = (settings) =>
    scrollableLegend(
        d3Legend.legendColor().shape("circle").shapeRadius(6),
        settings,
    );

const scrollSymbolLegend = (settings) =>
    scrollableLegend(
        d3Legend.legendSymbol().shapePadding(1).labelOffset(3),
        settings,
    );

export const colorLegend = () => legendComponent(scrollColorLegend);
export const symbolLegend = () =>
    legendComponent(scrollSymbolLegend, symbolScale);
export const colorGroupLegend = () =>
    legendComponent(scrollColorLegend, symbolScale);

function symbolScale(fromScale) {
    if (!fromScale) return null;

    const domain = fromScale.domain();
    const range = fromScale.range().map((r) => d3.symbol().type(r)());

    return d3.scaleOrdinal().domain(domain).range(range);
}

interface LegendComponent {
    (container): void;

    settings(): LegendComponentSettings;
    settings(nextSettings: LegendComponentSettings): LegendComponent;

    scale(): D3Scale | null;
    scale(nextScale: D3Scale | null): LegendComponent;

    color(): d3.ScaleOrdinal<string, unknown>;
    color(nextColor: d3.ScaleOrdinal<string, unknown>): LegendComponent;
}

function legendComponent(
    scrollLegendComponent,
    scaleModifier = undefined,
): LegendComponent {
    let settings: LegendComponentSettings = {};
    let scale = null; // type?
    let color: D3Scale | null = null;

    const legend: Partial<LegendComponent> = (container) => {
        if (scale && scale.range().length > 1) {
            const scrollLegend = scrollLegendComponent(settings);
            scrollLegend
                .scale(scale)
                .orient("vertical")
                .on("cellclick", function (_d) {
                    // d3-svg-legend is very outdated and incompat with d3 6.x
                    const d = this.__data__;
                    settings.hideKeys = settings.hideKeys || [];
                    if (settings.hideKeys.includes(d)) {
                        settings.hideKeys = settings.hideKeys.filter(
                            (k) => k !== d,
                        );
                    } else {
                        settings.hideKeys.push(d);
                    }

                    getChartElement(this)._draw();
                });

            scrollLegend.labels((options) => {
                const parts = String(options.domain[options.i]).split("|");
                return settings.mainValues.length <= 1 && parts.length > 1
                    ? parts.slice(0, parts.length - 1).join("|")
                    : options.domain[options.i];
            });

            const legendSelection = getOrCreateElement(
                container,
                "div.legend-container",
                () => container.append("div"),
            );

            scrollLegend.decorate((selection) => {
                const isHidden = (data) =>
                    settings.hideKeys && settings.hideKeys.includes(data);

                const cells = selection
                    .select("g.legendCells")
                    .attr("transform", "translate(20,20)")
                    .selectAll("g.cell");

                cells.classed("hidden", isHidden);
                cells.append("title").html((d) => d);

                if (color) {
                    cells
                        .select("circle, path")
                        .style("fill", (d) => (isHidden(d) ? null : color(d)))
                        .style("stroke", (d) =>
                            isHidden(d) ? null : withoutOpacity(color(d)),
                        );
                }
            });

            // render the legend
            legendSelection
                .attr("class", "legend-container")
                .attr("borderbox-on-hover", true)
                .style("z-index", "2")
                .call(scrollLegend);
        }
    };

    legend.settings = (...args: LegendComponentSettings[]): any => {
        if (args.length === 0) {
            return settings;
        }
        settings = args[0];

        return legend;
    };

    legend.scale = (...args: (D3Scale | null)[]): any => {
        if (!args.length) {
            return scale;
        }
        scale = scaleModifier ? scaleModifier(args[0]) : args[0];
        return legend;
    };

    legend.color = (...args: D3Scale[]): any => {
        if (!args.length) {
            return color;
        }
        color = args[0];
        return legend;
    };

    return legend as LegendComponent;
}
