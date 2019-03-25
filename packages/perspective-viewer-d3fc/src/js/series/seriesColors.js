/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
import {groupFromKey} from "./seriesKey";
import {colorStyles} from "./colorStyles";

export function seriesColors(settings) {
    const col = settings.data && settings.data.length > 0 ? settings.data[0] : {};
    const domain = Object.keys(col).filter(k => k !== "__ROW_PATH__");
    return colorScale().domain(domain)();
}

export function seriesColorsFromGroups(settings) {
    const col = settings.data && settings.data.length > 0 ? settings.data[0] : {};
    const domain = [];
    Object.keys(col).forEach(key => {
        if (key !== "__ROW_PATH__") {
            const group = groupFromKey(key);
            if (!domain.includes(group)) {
                domain.push(group);
            }
        }
    });
    return colorScale().domain(domain)();
}

export function colorScale() {
    let domain = null;
    let defaultColors = [colorStyles.series];
    let mapFunction = withOpacity;

    const colors = () => {
        if (defaultColors || domain.length > 1) {
            const range = domain.length > 1 ? colorStyles.scheme : defaultColors;
            return d3.scaleOrdinal(range.map(mapFunction)).domain(domain);
        }
        return null;
    };

    colors.domain = (...args) => {
        if (!args.length) {
            return domain;
        }
        domain = args[0];
        return colors;
    };

    colors.defaultColors = (...args) => {
        if (!args.length) {
            return defaultColors;
        }
        defaultColors = args[0];
        return colors;
    };

    colors.mapFunction = (...args) => {
        if (!args.length) {
            return mapFunction;
        }
        mapFunction = args[0];
        return colors;
    };

    return colors;
}

export function withoutOpacity(color) {
    return setOpacity(1)(color);
}

export function withOpacity(color) {
    return setOpacity(colorStyles.opacity)(color);
}

export function setOpacity(opacity) {
    return color => {
        const toInt = (c, offset, length) => parseInt(c.substring(offset, offset + length) + (length === 1 ? "0" : ""), 16);
        const colorsFromRGB = c =>
            c
                .substring(c.indexOf("(") + 1)
                .split(",")
                .map(d => parseInt(d))
                .slice(0, 3);
        const colorsFromHex = c => (c.length === 4 ? [toInt(c, 1, 1), toInt(c, 2, 1), toInt(c, 3, 1)] : [toInt(c, 1, 2), toInt(c, 3, 2), toInt(c, 5, 2)]);

        const colors = color.includes("rgb") ? colorsFromRGB(color) : colorsFromHex(color);
        return opacity === 1 ? `rgb(${colors.join(",")})` : `rgba(${colors.join(",")},${opacity})`;
    };
}
