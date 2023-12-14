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

import { GetSetReturn } from "../types";
import { getOrCreateElement } from "../utils/utils";

export interface GridLayoutMultiChart {
    (container: any): any;

    elementsPrefix: <T extends string | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, string, GridLayoutMultiChart>;

    padding: <T extends string | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, string, GridLayoutMultiChart>;

    svg: <T extends boolean | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, boolean, GridLayoutMultiChart>;

    chartContainer: () => any;
    chartEnter: () => any;
    chartDiv: () => any;
    chartTitle: () => any;
    containerSize: () => any;
}

export function gridLayoutMultiChart(): GridLayoutMultiChart {
    let elementsPrefix = "element-prefix-unset";

    let chartContainer = null;
    let chartEnter = null;
    let chartDiv = null;
    let chartTitle = null;
    let color = null;
    let containerSize = null;
    let svg = true;
    let padding = null;

    const _gridLayoutMultiChart: any = (container) => {
        const outerContainer = getOrCreateElement(
            container,
            "div.outer-container",
            () =>
                container
                    .append("div")
                    .attr("class", "outer-container")
                    .style("width", `calc(100% - ${padding ?? 0})`)
                    .style("height", `calc(100% - ${padding ?? 0})`)
                    .style("padding-left", padding ?? 0)
        );

        const scrollContainer = getOrCreateElement(
            outerContainer,
            "div.inner-container",
            () => outerContainer.append("div").attr("class", "inner-container")
        );

        const innerRect = outerContainer.node().getBoundingClientRect();
        const containerHeight = innerRect.height;
        const containerWidth = innerRect.width - (color ? 70 : 0);

        const minSize = 300;
        const data = container.datum();

        const cols = Math.max(
            1,
            Math.min(data.length, Math.floor(containerWidth / minSize))
        );
        const rows = Math.ceil(data.length / cols);

        containerSize = {
            width: containerWidth / Math.max(cols, 1),
            height: Math.min(
                containerHeight,
                Math.max(
                    containerHeight / rows,
                    containerWidth / Math.max(cols, 1)
                )
            ),
        };

        if (containerHeight / rows > containerSize.height * 0.75) {
            containerSize.height = containerHeight / rows;
        }

        if (data.length > 1) {
            scrollContainer.style(
                "grid-template-columns",
                `repeat(${cols}, ${100 / cols}%)`
            );
            scrollContainer.style(
                "grid-template-rows",
                `repeat(${rows}, ${containerSize.height}px)`
            );
        } else {
            scrollContainer.style("grid-template-columns", `repeat(1, 100%)`);
            scrollContainer.style("grid-template-rows", `repeat(1, 100%)`);
        }

        chartDiv = scrollContainer
            .selectAll(`div.${elementsPrefix}-container`)
            .data(data, (d) => d.split);
        chartDiv.exit().remove();

        chartEnter = chartDiv
            .enter()
            .append("div")
            .attr("class", `${elementsPrefix}-container`);

        chartTitle = chartEnter
            .append("div")
            .attr("class", "title-container")
            .style("text-align", "center")
            .attr("display", "inline-block")
            .append("text")
            .attr("class", "title")
            .style("text-align", "left");

        if (svg) {
            chartContainer = chartEnter
                .append("svg")
                .append("g")
                .attr("class", elementsPrefix);
        } else {
            chartContainer = chartEnter
                .append("div")
                .attr("class", elementsPrefix);
        }
    };

    _gridLayoutMultiChart.padding = <T extends string | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, string, GridLayoutMultiChart> => {
        if (!args.length) {
            return padding as GetSetReturn<T, string, GridLayoutMultiChart>;
        }
        padding = args[0];
        return _gridLayoutMultiChart;
    };
    _gridLayoutMultiChart.svg = <T extends boolean | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, boolean, GridLayoutMultiChart> => {
        if (!args.length) {
            return svg as GetSetReturn<T, boolean, GridLayoutMultiChart>;
        }
        svg = args[0];
        return _gridLayoutMultiChart;
    };

    _gridLayoutMultiChart.elementsPrefix = <
        T extends string | undefined = undefined
    >(
        ...args: T[]
    ): GetSetReturn<T, string, GridLayoutMultiChart> => {
        if (!args.length) {
            return elementsPrefix as GetSetReturn<
                T,
                string,
                GridLayoutMultiChart
            >;
        }
        elementsPrefix = args[0];
        return _gridLayoutMultiChart;
    };

    _gridLayoutMultiChart.chartContainer = () => chartContainer;

    _gridLayoutMultiChart.chartEnter = () => chartEnter;

    _gridLayoutMultiChart.chartDiv = () => chartDiv;

    _gridLayoutMultiChart.chartTitle = () => chartTitle;

    _gridLayoutMultiChart.containerSize = () => containerSize;

    return _gridLayoutMultiChart;
}