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

import { seriesCanvasPoint } from "d3fc";
import { withOpacity, withoutOpacity } from "./seriesColors";
import { groupFromKey } from "./seriesKey";
import { fromDomain } from "./seriesSymbols";
import { toValue } from "../tooltip/selectionData";

const LABEL_PADDING = 8;
const LABEL_COSINE = 1;

export function pointSeriesCanvas(
    settings,
    seriesKey,
    size,
    color,
    label,
    symbols,
    scale_factor = 1,
    useSeriesKey = False
) {
    let series = seriesCanvasPoint()
        .crossValue((d) => d.x)
        .mainValue((d) => d.y);

    if (size) {
        series.size((d) => Math.round(scale_factor * size(d.size)));
    }
    if (symbols) {
        series.type(symbols(seriesKey));
    }

    series.decorate((context, d) => {
        let colorValue = useSeriesKey ? color(seriesKey) : color(d.colorValue);

        const opacity = settings.colorStyles && settings.colorStyles.opacity;
        if (label) {
            const { type } = settings.mainValues.find((x) => x.name === label);
            const value = toValue(type, d.row[label]);
            if (value !== null) {
                context.fillStyle = settings.textStyles.color;
                context.font = settings.textStyles.font;
                let magnitude = 0;
                if (size) {
                    // A = pi * r^2
                    // r = sqrt(A / pi)
                    const radius = Math.sqrt(
                        (scale_factor * size(d.size)) / Math.PI
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

export function symbolTypeFromGroups(settings) {
    const col =
        settings.data && settings.data.length > 0 ? settings.data[0] : {};
    const domain = [];
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
