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

import { seriesCanvasPoint } from "d3fc/index.js";
import { withOpacity, withoutOpacity } from "./seriesColors";
import { groupFromKey } from "./seriesKey";
import { fromDomain } from "./seriesSymbols";
import { toValue } from "../tooltip/selectionData";
import { getValuesByColumn } from "../data/utils";
import { D3Scale, Settings } from "../types";

const LABEL_PADDING = 8;
const LABEL_COSINE = 1;

/**
 *
 * @param {any} settings
 * @param {string} seriesKey
 * @param {d3.ScaleLinear} size
 * @param {d3.ScaleOrdinal} color
 * @param {string} label
 * @param {d3.ScaleOrdinal} symbols
 * @param {number?} scale_factor
 * @returns  {d3fc.seriesCanvasPoint}
 */
export function pointSeriesCanvas(
    settings,
    symbolKey,
    size,
    color,
    label,
    symbols,
    scale_factor = 1,
) {
    let series = seriesCanvasPoint()
        .crossValue((d) => d.x)
        .mainValue((d) => d.y);

    if (symbols) {
        series.type((data) => symbols(data.row[symbolKey]));
    }

    if (size) {
        series.size((d) => Math.round(scale_factor * size(d.size)));
    }

    series.decorate((context, data) => {
        const colorValue = color(data.colorValue);
        const opacity = settings.colorStyles?.opacity;
        if (label) {
            const { type } = settings.mainValues.find((x) => x.name === label);
            const value = toValue(type, data.row[label]);
            if (value !== null) {
                context.fillStyle = settings.textStyles.color;
                context.font = settings.textStyles.font;
                let magnitude = 0;
                if (size) {
                    // A = pi * r^2
                    // r = sqrt(A / pi)
                    const radius = Math.sqrt(
                        (scale_factor * size(data.size)) / Math.PI,
                    );

                    magnitude = radius * LABEL_COSINE;
                }

                const mag_with_padding = magnitude + LABEL_PADDING;
                context.fillText(value, mag_with_padding, 4);
            }
        }

        context.strokeStyle = withoutOpacity(colorValue);
        context.fillStyle = withOpacity(colorValue, opacity);
    });

    return series;
}

export function symbolTypeFromColumn(
    settings: Settings,
    column: string | null,
): D3Scale {
    let rows = [...new Set(getValuesByColumn(settings, column))];
    return fromDomain(rows);
}

export function symbolTypeFromGroups(settings: Settings) {
    const col =
        settings.data && settings.data.length > 0 ? settings.data[0] : {};
    const domain: string[] = [];
    Object.keys(col).forEach((key) => {
        if (key !== "__ROW_PATH__") {
            const group = groupFromKey(key);
            if (!domain.includes(group)) {
                domain.push(group);
            }
        }
    });
    return fromDomain(domain);
}
