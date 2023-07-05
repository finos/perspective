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

import * as d3 from "d3";
import { groupFromKey } from "./seriesKey";

export function seriesColors(settings) {
    const col =
        settings.data && settings.data.length > 0 ? settings.data[0] : {};
    const domain = Object.keys(col).filter((k) => k !== "__ROW_PATH__");
    return colorScale().settings(settings).domain(domain)();
}

// TODO: We're iterating over all the data here to get the unique values for each colorBy field.
// This is the only way to do it since we don't know the range of these values ahead of time.
// This should be WASM-side code.
export function seriesColorsFromField(settings, field) {
    const data = settings.data;
    const key = settings.realValues[field];
    // alt:
    // const domain = [...new Set(data.map((obj) => obj[key]))].sort();
    const domain = data
        .reduce((accum, obj) => {
            const val = obj[key];
            return accum.includes(val) ? accum : [...accum, val];
        }, [])
        .sort();
    return colorScale().settings(settings).domain(domain)();
}

export function seriesColorsFromDistinct(settings, data) {
    let domain = Array.from(new Set(data));
    return colorScale().settings(settings).domain(domain)();
}

export function seriesColorsFromGroups(settings) {
    const col = settings.data[0] ?? {};
    // alt:
    // const domain = [...new Set(Object.keys(col).filter(k => k !== "__ROW_PATH__").map(k => groupFromKey(k)))];
    const domain = Object.keys(col).reduce((accum, key) => {
        if (key === "__ROW_PATH__") return accum;
        const group = groupFromKey(key);
        return accum.includes(group) ? accum : [...accum, group];
    }, []);

    return colorScale().settings(settings).domain(domain)();
}

export function colorScale() {
    let domain = null;
    let defaultColors = null;
    let settings = {};
    let mapFunction = (d) =>
        withOpacity(d, settings.colorStyles && settings.colorStyles.opacity);

    const colors = () => {
        const styles = settings.colorStyles;
        const defaults = defaultColors || [styles.series];
        if (defaults || domain.length > 1) {
            const range = domain.length > 1 ? styles.scheme : defaults;
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

    colors.settings = (...args) => {
        if (!args.length) {
            return settings;
        }
        settings = args[0];
        return colors;
    };

    return colors;
}

export function withoutOpacity(color) {
    return setOpacity(1)(color);
}

export function withOpacity(color, opacity = 0.5) {
    return setOpacity(opacity)(color);
}

export function setOpacity(opacity) {
    return (color) => {
        const decoded = d3.color(color);
        if (decoded !== null && decoded !== undefined) {
            decoded.opacity = opacity;
        }
        return decoded + "";
    };
}
