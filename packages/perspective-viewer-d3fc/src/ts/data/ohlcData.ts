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
import { DataRowsWithKey, Settings } from "../types";
import { splitIntoMultiSeries } from "./splitIntoMultiSeries";
import { DataRow } from "@finos/perspective";

type MappedSeries = {
    crossValue: any;
    mainValues: any[];
    openValue: any;
    closeValue: any;
    highValue: any;
    lowValue: any;
    key: string;
    row: DataRow;
};

interface MappedSeriesArray extends Array<MappedSeries> {
    key: string;
}

export function ohlcData(settings: Settings, data: DataRowsWithKey) {
    return splitIntoMultiSeries(settings, data, { excludeEmpty: true }).map(
        (data) => seriesToOHLC(settings, data)
    );
}

function getOHLCValue(realValue: string, col: DataRow): number | undefined {
    if (!!realValue) {
        let value = col[realValue];

        if (typeof value === "string") {
            return parseFloat(value);
        }

        if (typeof value !== "number") {
            return undefined;
        }
    }

    return undefined;
}

function seriesToOHLC(
    settings: Settings,
    data: DataRowsWithKey
): MappedSeriesArray {
    const labelfn = labelFunction(settings);
    const getNextOpen = (i) =>
        data[i < data.length - 1 ? i + 1 : i][settings.realValues[0]];
    const mappedSeries: any = data.map((col, i) => {
        const openValue = getOHLCValue(settings.realValues[0], col);
        const closeValue = getOHLCValue(settings.realValues[1], col);

        return {
            crossValue: labelfn(col, i),
            mainValues: settings.mainValues.map((v) => col[v.name]),
            openValue: openValue,
            closeValue: closeValue,
            highValue: !!settings.realValues[2]
                ? col[settings.realValues[2]]
                : Math.max(openValue, closeValue),
            lowValue: !!settings.realValues[3]
                ? col[settings.realValues[3]]
                : Math.min(openValue, closeValue),
            key: data.key,
            row: col,
        };
    });

    mappedSeries.key = data.key;
    return mappedSeries;
}
