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

export function groupAndStackData(settings, data) {
    return splitIntoMultiSeries(settings, data, {stack: true}).map(data => groupBarData(settings, data));
}

function seriesDataFn(settings, data) {
    const labelfn = labelFunction(settings);

    return mainValue => {
        const series = data
            .filter(col => !!col[mainValue.name])
            .map((col, i) => ({
                crossValue: labelfn(col, i),
                mainValue: col[mainValue.name],
                baseValue: col[`__BASE_VALUE__${mainValue.name}`] || 0,
                key: col.__KEY__ ? `${col.__KEY__}|${mainValue.name}` : mainValue.name
            }));
        series.key = mainValue.name;
        return series;
    };
}

function groupBarData(settings, data) {
    // Split data into a group for each aggregate (mainValue)
    const seriesFn = seriesDataFn(settings, data);

    if (settings.mainValues.length > 1) {
        return settings.mainValues.map(seriesFn);
    } else {
        return seriesFn(settings.mainValues[0]);
    }
}
