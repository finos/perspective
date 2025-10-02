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

import { Settings } from "../types";
import { splitterLabels } from "./splitterLabels";

export interface AxisSplitter {
    (selection: any): void;

    color(): d3.ScaleOrdinal<string, unknown>;
    color(nextColor: d3.ScaleOrdinal<string, unknown>): AxisSplitter;

    haveSplit: () => boolean;

    data(): any[];
    data(nextData: any[]): AxisSplitter;

    altData(): any[];
    altData(nextData: any[]): AxisSplitter;
}

export const axisSplitter = (
    settings: Settings,
    sourceData,
    splitFn = dataSplitFunction,
): AxisSplitter => {
    let color: d3.ScaleOrdinal<string, unknown> | undefined = undefined;
    let data;
    let altData;

    // splitMainValues is an array of main-value names to put into the alt-axis
    const splitMainValues = settings.splitMainValues || [];
    const altValue = (name) => {
        const split = name.split("|");
        return splitMainValues.includes(split[split.length - 1]);
    };

    const haveSplit: boolean = settings["mainValues"].some((m) =>
        altValue(m.name),
    );

    // Split the data into main and alt displays
    data = haveSplit
        ? splitFn(sourceData, (key) => !altValue(key))
        : sourceData;
    altData = haveSplit ? splitFn(sourceData, altValue) : null;

    // Renderer to show the special controls for moving between axes
    const splitter: any = (selection) => {
        if (settings["mainValues"].length === 1) return;

        const labelsInfo = settings["mainValues"].map((v, i) => ({
            index: i,
            name: v.name,
        }));
        const mainLabels = labelsInfo.filter((v) => !altValue(v.name));
        const altLabels = labelsInfo.filter((v) => altValue(v.name));

        const labeller = () => splitterLabels(settings).color(color);

        selection
            .select(".y-label.left-label")
            .call(labeller().labels(mainLabels));
        selection
            .select(".y-label.right-label")
            .call(labeller().labels(altLabels).alt(true));
    };

    splitter.color = (...args: d3.ScaleOrdinal<string, unknown>[]): any => {
        if (!args.length) {
            return color;
        }
        color = args[0];
        return splitter;
    };

    splitter.haveSplit = (): boolean => haveSplit;

    splitter.data = (...args: any[][]): any => {
        if (!args.length) {
            return data;
        }
        data = args[0];
        return splitter;
    };

    splitter.altData = (...args: any[][]): any => {
        if (!args.length) {
            return altData;
        }
        altData = args[0];
        return splitter;
    };

    return splitter;
};

export const dataSplitFunction = (sourceData, isIncludedFn) => {
    return sourceData.map((d) => d.filter((v) => isIncludedFn(v.key)));
};

export const dataBlankFunction = (sourceData, isIncludedFn) => {
    return sourceData.map((series) => {
        if (!isIncludedFn(series.key)) {
            // Blank this data
            return series.map((v) => Object.assign({}, v, { mainValue: null }));
        }
        return series;
    });
};

export const groupedBlankFunction = (sourceData, isIncludedFn) => {
    return sourceData.map((group) => dataBlankFunction(group, isIncludedFn));
};
