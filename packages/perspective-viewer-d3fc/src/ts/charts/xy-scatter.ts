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
import { symbolTypeFromColumn } from "../series/pointSeriesCanvas";
import { pointData } from "../data/pointData";
import {
    seriesColorsFromColumn,
    seriesColorsFromDistinct,
    colorScale,
} from "../series/seriesColors";
import { seriesColorRange } from "../series/seriesRange";
import { symbolLegend, colorLegend } from "../legend/legend";
import { colorRangeLegend } from "../legend/colorRangeLegend";
import { filterDataByGroup } from "../legend/filter";
import { symbolsObj } from "../series/seriesSymbols";
import { gridLayoutMultiChart } from "../layout/gridLayoutMultiChart";
import xyScatterSeries from "../series/xy-scatter/xyScatterSeries";
import { D3Scale, HTMLSelection, Settings, Type } from "../types";

/**
 * Overrides specific symbols based on plugin settings. This modifies in-place _and_ returns the value.
 * @param {any} settings
 * @param {d3.ScaleOrdinal} symbols
 */
function overrideSymbols(settings: Settings, symbols): D3Scale {
    if (!symbols) {
        return;
    }
    const symbolCol = settings.realValues[4];
    const columnType = settings.mainValues.find(
        (val) => val.name === symbolCol,
    )?.type;
    let domain: string[] = symbols.domain();
    let range = symbols.range();
    let len = range.length;
    for (let [i, _] of domain.entries()) {
        range[i] = range[(i as number) % len];
    }
    let maybeSymbols = (settings.columns_config?.[symbolCol]?.["symbols"] ??
        {}) as Record<string, string>;
    Object.entries(maybeSymbols).forEach(([key, value]) => {
        // TODO: Define custom symbol types based on the values passed in here.
        // https://d3js.org/d3-shape/symbol#custom-symbols
        let symbolType = symbolsObj[value] ?? d3.symbolCircle;

        let i = domain.findIndex((val) => {
            switch (columnType) {
                case "date":
                case "datetime":
                    return new Date(val).valueOf() === new Date(key).valueOf();
                default:
                    return String(val) === String(key);
            }
        });

        range[i] = symbolType;
    });
    symbols.range(range);
    return symbols;
}

function xyScatter(container: HTMLSelection, settings: Settings) {
    const colorBy = settings.realValues[2];
    let hasColorBy = !!colorBy;
    let isColoredByString =
        settings.mainValues.find((x) => x.name === colorBy)?.type === "string";

    let color = null;
    let legend = null;

    const symbolCol = settings.realValues[4];
    const temp = symbolTypeFromColumn(settings, symbolCol);

    const symbols = overrideSymbols(settings, temp);

    const data = pointData(settings, filterDataByGroup(settings));

    if (hasColorBy && isColoredByString) {
        if (!!symbolCol) {
            // TODO: Legend should have cartesian product labels (ColorBy|SplitBy)
            // For now, just use monocolor legends.
            if (settings.splitValues.length > 0) {
                color = seriesColorsFromDistinct(settings, data);
            } else {
                color = seriesColorsFromDistinct(settings, data[0]);
            }
            legend = symbolLegend().settings(settings).scale(symbols);
        } else {
            color = seriesColorsFromColumn(settings, colorBy);
            legend = colorLegend().settings(settings).scale(color);
        }
    } else if (hasColorBy) {
        color = seriesColorRange(settings, data, "colorValue");
        legend = colorRangeLegend().scale(color);
    } else {
        // always use default color
        color = colorScale().settings(settings).domain([""])();
        legend = symbolLegend().settings(settings).scale(symbols);
    }

    if (settings.splitValues.length !== 0) {
        let xyGrid = gridLayoutMultiChart()
            .svg(false)
            .elementsPrefix("xy-scatter");
        xyGrid = xyGrid.padding("2.5em");

        const xLabel = container.append("div").attr("class", "multi-xlabel");
        xLabel.append("p").text(settings.mainValues[0].name);

        const yLabel = container.append("div").attr("class", "multi-ylabel");
        yLabel
            .append("p")
            .text(settings.mainValues[1].name)
            .style("transform", "rotate(-90deg)")
            .style("text-wrap", "nowrap");

        container = container.datum(data);
        container.call(xyGrid);
        const xyContainer = xyGrid.chartContainer();
        const xyEnter = xyGrid.chartEnter();
        const xyDiv = xyGrid.chartDiv();
        const xyTitle = xyGrid.chartTitle();
        const containerSize = xyGrid.containerSize();

        xyTitle.each((d, i, nodes) => d3.select(nodes[i]).text(d.key));
        xyEnter
            .merge(xyDiv)
            .attr(
                "transform",
                `translate(${containerSize.width / 2}, ${
                    containerSize.height / 2
                })`,
            )
            .each(function (data) {
                const xyElement = d3.select(this);
                xyScatterSeries()
                    .settings(settings)
                    .data([data])
                    .color(color as D3Scale)
                    .symbols(symbols)(xyElement);
            });
    } else {
        xyScatterSeries()
            .settings(settings)
            .data(data)
            .color(color as D3Scale)
            .symbols(symbols)(container);
    }

    if (legend) container.call(legend);
}

xyScatter.plugin = {
    name: "X/Y Scatter",
    category: "X/Y Chart",
    max_cells: 50000,
    max_columns: 50,
    render_warning: true,
    initial: {
        type: "number",
        count: 2,
        names: [
            "X Axis",
            "Y Axis",
            "Color",
            "Size",
            "Symbol",
            "Label",
            "Tooltip",
        ],
    },
    selectMode: "toggle",
};

xyScatter.can_render_column_styles = (type: Type, group?: string) => {
    return type === "string" && group === "Symbol";
};
xyScatter.column_style_controls = (type: Type, group?: string) => {
    if (type === "string" && group === "Symbol") {
        return {
            symbols: {
                keys: "row",
                values: Object.keys(symbolsObj),
            },
        };
    } else {
        return null;
    }
};

export default xyScatter;
