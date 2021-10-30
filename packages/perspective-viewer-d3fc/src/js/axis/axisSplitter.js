/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {splitterLabels} from "./splitterLabels";

export const axisSplitter = (
    settings,
    sourceData,
    splitFn = dataSplitFunction
) => {
    let color;
    let data;
    let altData;

    // splitMainValues is an array of main-value names to put into the alt-axis
    const splitMainValues = settings.splitMainValues || [];
    const altValue = (name) => {
        const split = name.split("|");
        return splitMainValues.includes(split[split.length - 1]);
    };

    const haveSplit = settings["mainValues"].some((m) => altValue(m.name));

    // Split the data into main and alt displays
    data = haveSplit
        ? splitFn(sourceData, (key) => !altValue(key))
        : sourceData;
    altData = haveSplit ? splitFn(sourceData, altValue) : null;

    // Renderer to show the special controls for moving between axes
    const splitter = (selection) => {
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

    splitter.color = (...args) => {
        if (!args.length) {
            return color;
        }
        color = args[0];
        return splitter;
    };

    splitter.haveSplit = () => haveSplit;

    splitter.data = (...args) => {
        if (!args.length) {
            return data;
        }
        data = args[0];
        return splitter;
    };
    splitter.altData = (...args) => {
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
            return series.map((v) => Object.assign({}, v, {mainValue: null}));
        }
        return series;
    });
};

export const groupedBlankFunction = (sourceData, isIncludedFn) => {
    return sourceData.map((group) => dataBlankFunction(group, isIncludedFn));
};
