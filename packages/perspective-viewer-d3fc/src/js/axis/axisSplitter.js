/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {splitterLabels} from "./splitterLabels";

export const axisSplitter = (settings, sourceData) => {
    let color;

    // splitMainValues is an array of main-value names to put into the alt-axis
    const splitMainValues = settings.splitMainValues || [];
    const altValue = name => {
        const split = name.split("|");
        return splitMainValues.includes(split[split.length - 1]);
    };

    const haveSplit = settings["mainValues"].some(m => altValue(m.name));

    // Split the data into main and alt displays
    const data = haveSplit ? sourceData.map(d => d.filter(v => !altValue(v.key))) : sourceData;
    const altData = haveSplit ? sourceData.map(d => d.filter(v => altValue(v.key))) : null;

    // Renderer to show the special controls for moving between axes
    const splitter = selection => {
        if (settings["mainValues"].length === 1) return;

        const labelsInfo = settings["mainValues"].map((v, i) => ({
            index: i,
            name: v.name
        }));
        const mainLabels = labelsInfo.filter(v => !altValue(v.name));
        const altLabels = labelsInfo.filter(v => altValue(v.name));

        const labeller = () => splitterLabels(settings).color(color);

        selection.select(".y-label-container>.y-label").call(labeller().labels(mainLabels));
        selection.select(".y2-label-container>.y-label").call(
            labeller()
                .labels(altLabels)
                .alt(true)
        );
    };

    splitter.color = (...args) => {
        if (!args.length) {
            return color;
        }
        color = args[0];
        return splitter;
    };

    splitter.haveSplit = () => haveSplit;
    splitter.data = () => data;
    splitter.altData = () => altData;

    return splitter;
};
