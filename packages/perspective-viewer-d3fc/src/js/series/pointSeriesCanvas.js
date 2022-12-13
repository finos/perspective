/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import { seriesCanvasPoint } from "d3fc";
import { withOpacity, withoutOpacity } from "./seriesColors";
import { groupFromKey } from "./seriesKey";
import { fromDomain } from "./seriesSymbols";
import { toValue } from "../tooltip/selectionData";

const LABEL_PADDING = 5;
const LABEL_COSINE = 0.7071067811865476; // cos(45 * Math.PI / 180)

export function pointSeriesCanvas(
    settings,
    seriesKey,
    size,
    color,
    label,
    symbols,
    scale_factor = 1
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
        const colorValue = color(
            d.colorValue !== undefined ? d.colorValue : seriesKey
        );
        const opacity = settings.colorStyles && settings.colorStyles.opacity;

        if (label) {
            context.fillStyle = settings.textStyles.color;
            context.font = settings.textStyles.font;
            const { type } = settings.mainValues.find((x) => x.name === label);
            const value = toValue(type, d.row[label]);

            let magnitude = 10;

            if (size) {
                // `size(d.size)` is area (A) of circle.
                // A = pi * r^2
                // r = sqrt(A / pi)
                const radius = Math.sqrt(
                    (scale_factor * size(d.size)) / Math.PI
                );

                // magnitude = r * cos(45 * Math.PI / 180)
                magnitude = radius * LABEL_COSINE;
            }

            const mag_with_padding = magnitude + LABEL_PADDING;

            // NOTE: Point origin is at the center of the circle, so we need to invert the y-axis.
            context.fillText(value, mag_with_padding, -mag_with_padding);
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
