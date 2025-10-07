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

import { Settings } from "../types";

export function splitIntoMultiSeries(
    settings: Settings,
    data,
    { stack = false, excludeEmpty = false } = {},
) {
    const useData = data || settings.data;

    if (settings.splitValues.length > 0) {
        return splitByValuesIntoMultiSeries(settings, useData, {
            stack,
            excludeEmpty,
        });
    }
    return [useData];
}

function splitByValuesIntoMultiSeries(
    settings,
    data,
    { stack = false, excludeEmpty = false },
) {
    // Create a series for each "split" value, each one containing all the
    // "aggregate" values, and "base" values to offset it from the previous
    // series
    const multiSeries = {};

    data.forEach((col) => {
        // Split this column by "split", including multiple aggregates for each
        const baseValues = {};
        const split = {};

        // Keys are of the form "split1|split2|aggregate"
        Object.keys(col)
            .filter((key) => key !== "__ROW_PATH__")
            .filter(
                (key) =>
                    !excludeEmpty ||
                    (col[key] != null && col[key] != undefined),
            )
            .forEach((key) => {
                const labels = key.split("|");
                // label="aggregate"
                const label = labels[labels.length - 1];
                const value = col[key] || 0;
                const baseKey = `${label}${value >= 0 ? "+ve" : "-ve"}`;
                // splitName="split1|split2"
                const splitName = labels.slice(0, labels.length - 1).join("|");

                // Combine aggregate values for the same split in a single
                // object
                const splitValues = (split[splitName] = split[splitName] || {
                    __ROW_PATH__: col.__ROW_PATH__,
                });
                const baseValue = baseValues[baseKey] || 0;

                splitValues.__KEY__ = splitName;

                // Assign the values for this split/aggregate
                if (stack) {
                    splitValues[label] = baseValue + value;
                    splitValues[`__BASE_VALUE__${label}`] = baseValue;
                    baseValues[baseKey] = splitValues[label];
                } else {
                    splitValues[label] = value;
                }
                splitValues.row = col;
            });

        // Push each object onto the correct series
        Object.keys(split).forEach((splitName) => {
            const series = (multiSeries[splitName] =
                multiSeries[splitName] || []);
            series.push(split[splitName]);
        });
    });

    return Object.keys(multiSeries).map((k) => {
        const series = multiSeries[k];
        series.key = k;
        return series;
    });
}
