/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {labelFunction} from "../axis/axisLabel";

export function heatmapData(settings, data) {
    const labelfn = labelFunction(settings);

    const heatmapData = [];

    data.forEach((col, i) => {
        const crossValue = labelfn(col, i);
        Object.keys(col)
            .filter(key => key !== "__ROW_PATH__")
            .forEach(key => {
                heatmapData.push({
                    crossValue: crossValue,
                    mainValue: getMainValues(key),
                    colorValue: col[key],
                    row: col
                });
            });
    });

    return heatmapData;
}

function getMainValues(key) {
    // Key format is based on "Split By" values plus the value label at the end
    // val1|val2|....|label
    const labels = key.split("|");
    labels.pop();
    return labels.join("|");
}
