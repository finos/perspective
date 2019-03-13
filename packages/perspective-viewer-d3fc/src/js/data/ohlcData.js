/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {labelFunction} from "../axis/crossAxis";
import {splitIntoMultiSeries} from "./splitIntoMultiSeries";

const flattenArray = array => {
    if (Array.isArray(array)) {
        return [].concat(...array.map(flattenArray));
    } else {
        return [array];
    }
};

export function ohlcData(settings, data) {
    return flattenArray(splitIntoMultiSeries(settings, data, {excludeEmpty: true}).map(data => seriesToOHLC(settings, data)));
}

function seriesToOHLC(settings, data) {
    const labelfn = labelFunction(settings);

    const mappedSeries = data.map((col, i) => ({
        crossValue: labelfn(col, i),
        mainValues: settings.mainValues.map(v => col[v.name]),
        openValue: settings.mainValues.length >= 4 ? col[settings.mainValues[0].name] : undefined,
        highValue: settings.mainValues.length >= 4 ? col[settings.mainValues[1].name] : undefined,
        lowValue: settings.mainValues.length >= 4 ? col[settings.mainValues[2].name] : undefined,
        closeValue: settings.mainValues.length >= 4 ? col[settings.mainValues[3].name] : undefined,
        key: data.key
    }));

    mappedSeries.key = data.key;
    return mappedSeries;
}
