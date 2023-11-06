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

import * as fc from "d3fc";
import { getChartElement } from "../plugin/root";
import { withoutOpacity } from "../series/seriesColors.js";
import { GetSetReturn, HTMLSelection, Settings } from "../types";

export type SplitterLabel = {
    index: number;
    name: string;
};

export interface SplitterLabels {
    (selection: any): void;
    labels: <T extends SplitterLabel[] | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, any[], SplitterLabels>;
    color: <T extends d3.ScaleOrdinal<string, unknown> | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, d3.ScaleOrdinal<string, unknown>, SplitterLabels>;
    alt: <T extends boolean | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, boolean, SplitterLabels>;
}

// Render a set of labels with the little left/right arrows for moving
// between axes
export const splitterLabels = (settings: Settings): SplitterLabels => {
    let labels: SplitterLabel[] = [];
    let alt = false;
    let color;

    const _render: any = (selection: HTMLSelection) => {
        selection.text("");

        const labelDataJoin = fc
            .dataJoin("span", "splitter-label")
            .key((d) => d);

        const disabled = !alt && labels.length === 1;
        const coloured = color && settings.splitValues.length === 0;
        labelDataJoin(selection, labels)
            .classed("disabled", disabled)
            .text((d) => d.name)
            .style("color", (d) =>
                coloured ? withoutOpacity(color(d.name)) : undefined
            )
            .on("click", (event, d) => {
                if (disabled) return;

                if (alt) {
                    settings.splitMainValues = settings.splitMainValues.filter(
                        (v) => v != d.name
                    );
                } else {
                    settings.splitMainValues = [d.name].concat(
                        settings.splitMainValues || []
                    );
                }

                event.target
                    .getRootNode()
                    .host.closest("perspective-viewer")
                    ?.dispatchEvent(new Event("perspective-config-update"));

                redrawChart(selection);
            });
    };

    const redrawChart = (selection: HTMLSelection) => {
        const chartElement = getChartElement(selection.node());
        chartElement._container.innerHTML = "";
        chartElement._draw();
    };

    _render.labels = <T extends SplitterLabel[] | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, SplitterLabel[], SplitterLabels> => {
        if (!args.length) {
            return labels as GetSetReturn<T, SplitterLabel[], SplitterLabels>;
        }
        labels = args[0];
        return _render;
    };
    _render.alt = <T extends boolean | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, boolean, SplitterLabels> => {
        if (!args.length) {
            return alt as GetSetReturn<T, boolean, SplitterLabels>;
        }
        alt = args[0];
        return _render;
    };

    _render.color = (...args) => {
        if (!args.length) {
            return color;
        }
        color = args[0];
        return _render;
    };
    return _render;
};
