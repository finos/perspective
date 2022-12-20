/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import { labelFunction } from "../axis/axisLabel";
import { splitIntoMultiSeries } from "./splitIntoMultiSeries";

export function pointData(settings, data) {
    return splitIntoMultiSeries(settings, data, { excludeEmpty: true }).map(
        (data) => seriesToPoints(settings, data)
    );
}

export function seriesToPoints(settings, data) {
    const labelfn = labelFunction(settings);

    const mappedSeries = data.map((col, i) => ({
        crossValue: labelfn(col, i),
        // crossValue: "",
        mainValues: settings.mainValues.map((v) => col[v.name]),
        x: col[settings.mainValues[0].name],
        y: col[settings.mainValues[1].name],
        colorValue: settings.realValues[2]
            ? col[settings.realValues[2]]
            : undefined,
        size: settings.realValues[3] ? col[settings.realValues[3]] : undefined,
        key: data.key,
        row: col,
    }));

    mappedSeries.key = data.key;
    return mappedSeries;
}
