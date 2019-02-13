/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {splitIntoMultiSeries} from "./splitIntoMultiSeries";

export function pointData(settings, data) {
    return splitIntoMultiSeries(settings, data).map(data => seriesToPoints(settings, data));
}

function seriesToPoints(settings, data) {
    const mappedSeries = data.map(col => ({
        crossValue: col[settings.mainValues[0].name],
        mainValue: col[settings.mainValues[1].name],
        size: settings.mainValues.length > 2 ? col[settings.mainValues[2].name] : undefined
    }));
    mappedSeries.key = data.key;
    return mappedSeries;
}
