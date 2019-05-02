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
    // splitMainValues is an array of main-value indexes (numbers) to put into the alt-axis
    const splitMainValues = settings.splitMainValues || [];
    const altValue = (value, index) => splitMainValues.includes(index);

    const haveSplit = settings["mainValues"].some(altValue);

    // Split the data into main and alt displays
    const data = haveSplit ? sourceData.map(d => d.filter((v, i) => !altValue(v, i))) : sourceData;
    const altData = haveSplit ? sourceData.map(d => d.filter(altValue)) : null;

    // Renderer to show the special controls for moving between axes
    const splitter = selection => {
        if (settings["mainValues"].length === 1) return;

        const labelsInfo = settings["mainValues"].map((v, i) => ({
            index: i,
            name: v.name
        }));
        const mainLabels = labelsInfo.filter((v, i) => !altValue(v, i));
        const altLabels = labelsInfo.filter(altValue);

        selection.select(".y-label-container>.y-label").call(splitterLabels(settings).labels(mainLabels));
        selection.select(".y2-label-container>.y-label").call(
            splitterLabels(settings)
                .labels(altLabels)
                .alt(true)
        );
    };

    splitter.haveSplit = () => haveSplit;
    splitter.data = () => data;
    splitter.altData = () => altData;

    return splitter;
};
