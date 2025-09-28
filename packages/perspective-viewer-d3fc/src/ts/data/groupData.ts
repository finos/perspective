// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { labelFunction } from "../axis/axisLabel";
import { Settings } from "../types";
import { splitIntoMultiSeries } from "./splitIntoMultiSeries";

export function groupData(settings: Settings, data: any[]): any[] {
    const stack = { stack: false };
    const groupedSeries = splitIntoMultiSeries(settings, data, stack).map(
        (data) => groupPointDataByMainValue(settings, data, stack),
    );

    if (settings.mainValues.length > 1) {
        const flattenedSeries: any[] = groupedSeries.reduce((a, b) =>
            a.concat(b),
        );
        return flattenedSeries;
    }

    return groupedSeries;
}

export function groupAndStackData(settings: Settings, data) {
    const stack = { stack: true };
    return splitIntoMultiSeries(settings, data, stack).map((data) =>
        groupPointDataByMainValue(settings, data, stack),
    );
}

function seriesDataFn(settings: Settings, data, { stack = false }) {
    const labelfn = labelFunction(settings);

    return (mainValue) => {
        const baseValue = (col) =>
            stack ? col[`__BASE_VALUE__${mainValue.name}`] || 0 : 0;
        const series = data.map((col, i) => ({
            crossValue: labelfn(col, i),
            mainValue: !!col[mainValue.name] ? col[mainValue.name] : null,
            baseValue: baseValue(col),
            key: col.__KEY__
                ? `${col.__KEY__}|${mainValue.name}`
                : mainValue.name,
            row: col.row || col,
        }));
        series.key = series[0].key;
        return series;
    };
}

function groupPointDataByMainValue(
    settings: Settings,
    data,
    { stack = false },
) {
    // Split data into a group for each aggregate (mainValue)
    const seriesFn = seriesDataFn(settings, data, { stack });

    if (settings.mainValues.length > 1) {
        return settings.mainValues.map(seriesFn);
    } else {
        return seriesFn(settings.mainValues[0]);
    }
}
