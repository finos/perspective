/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {labelFunction} from "../axis/axisLabel";
import {splitIntoMultiSeries} from "./splitIntoMultiSeries";

export function ohlcData(settings, data) {
    return splitIntoMultiSeries(settings, data, {excludeEmpty: true}).map(
        (data) => seriesToOHLC(settings, data)
    );
}

function seriesToOHLC(settings, data) {
    const labelfn = labelFunction(settings);

    const getNextOpen = (i) =>
        data[i < data.length - 1 ? i + 1 : i][settings.mainValues[0].name];
    const mappedSeries = data.map((col, i) => {
        const openValue =
            settings.mainValues.length >= 1
                ? col[settings.mainValues[0].name]
                : undefined;
        const closeValue =
            settings.mainValues.length >= 2
                ? col[settings.mainValues[1].name]
                : getNextOpen(i);
        return {
            crossValue: labelfn(col, i),
            mainValues: settings.mainValues.map((v) => col[v.name]),
            openValue: openValue,
            closeValue: closeValue,
            highValue:
                settings.mainValues.length >= 3
                    ? col[settings.mainValues[2].name]
                    : Math.max(openValue, closeValue),
            lowValue:
                settings.mainValues.length >= 4
                    ? col[settings.mainValues[3].name]
                    : Math.min(openValue, closeValue),
            key: data.key,
            row: col,
        };
    });

    mappedSeries.key = data.key;
    return mappedSeries;
}
