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

export function groupData(settings, data) {
    const groupedSeries = splitIntoMultiSeries(settings, data, {stack: false}).map(data => groupPointDataByMainValue(settings, data));

    if (settings.mainValues.length > 1) {
        const flattenedSeries = groupedSeries.reduce((a, b) => a.concat(b));
        return flattenedSeries;
    }

    return groupedSeries;
}

function seriesDataFn(settings, data) {
    const labelfn = labelFunction(settings);

    return mainValue => {
        const baseValue = 0;
        const series = data.map((col, i) => ({
            crossValue: labelfn(col, i),
            mainValue: !!col[mainValue.name] ? col[mainValue.name] : null,
            baseValue: baseValue,
            key: col.__KEY__ ? `${col.__KEY__}|${mainValue.name}` : mainValue.name
        }));

        series.key = series[0].key;
        return series;
    };
}

function groupPointDataByMainValue(settings, data) {
    // Split data into a group for each aggregate (mainValue)
    const seriesFn = seriesDataFn(settings, data);

    if (settings.mainValues.length > 1) {
        return settings.mainValues.map(seriesFn);
    } else {
        return seriesFn(settings.mainValues[0]);
    }
}
