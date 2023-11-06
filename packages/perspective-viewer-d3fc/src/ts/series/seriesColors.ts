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
import { getValuesByColumn } from "../data/utils";
import { GetSetReturn, Settings } from "../types";

export function seriesColors(
    settings: Settings
): d3.ScaleOrdinal<string, unknown> | null {
    const col =
        settings.data && settings.data.length > 0 ? settings.data[0] : {};
    const domain = Object.keys(col).filter((k) => k !== "__ROW_PATH__");
    return colorScale().settings(settings).domain(domain)();
}

export function seriesColorsFromColumn(
    settings: Settings,
    column
): d3.ScaleOrdinal<string, unknown> | null {
    const data = getValuesByColumn(settings, column);
    const domain = [...new Set(data)].sort();
    return colorScale().settings(settings).domain(domain)();
}

export function seriesColorsFromDistinct(
    settings: Settings,
    data
): d3.ScaleOrdinal<string, unknown> | null {
    let domain = [...new Set(data)];
    return colorScale().settings(settings).domain(domain)();
}

export function seriesColorsFromGroups(
    settings: Settings
): d3.ScaleOrdinal<string, unknown> | null {
    const col = settings.data[0] ?? {};
    const inner = Object.keys(col)
        .filter((k) => k !== "__ROW_PATH__")
        .map((k) => groupFromKey(k));
    const domain = [...new Set(inner)];
    return colorScale().settings(settings).domain(domain)();
}

type ColorScaleSettings = {
    colorStyles?: any;
};

type ColorScaleMapFunc = (d: any) => string;

interface ColorScale {
    (): d3.ScaleOrdinal<string, unknown> | null;
    settings: <T extends Settings | undefined = undefined>(
        nextSettings?: T
    ) => GetSetReturn<T, Settings, ColorScale>;
    domain: <T extends any[] | undefined = undefined>(
        nextDomain?: T
    ) => GetSetReturn<T, any[], ColorScale>;
    defaultColors: <T extends string[] | undefined = undefined>(
        nextDefaultColors?: T
    ) => GetSetReturn<T, string[], ColorScale>;
    mapFunction: <T extends ColorScaleMapFunc | undefined = undefined>(
        nextMapFunction?: T
    ) => GetSetReturn<T, ColorScaleMapFunc, ColorScale>;
}

export function colorScale(): ColorScale {
    let domain = null;
    let defaultColors: string[] | null = null;
    let settings: ColorScaleSettings = {};
    let mapFunction = (d) =>
        withOpacity(d, settings.colorStyles && settings.colorStyles.opacity);

    const colors: any = (): d3.ScaleOrdinal<string, unknown> | null => {
        const styles = settings.colorStyles;
        const defaults = defaultColors || [styles.series];
        if (defaults || domain.length > 1) {
            const range = domain.length > 1 ? styles.scheme : defaults;
            return d3.scaleOrdinal(range.map(mapFunction)).domain(domain); // ordinal.js
        }
        return null;
    };

    colors.domain = <T extends any[] | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, any[], ColorScale> => {
        if (args.length === 0) {
            return domain as GetSetReturn<T, any[], ColorScale>;
        }
        domain = args[0];
        return colors;
    };

    colors.defaultColors = <T extends string[] | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, string[], ColorScale> => {
        if (!args.length) {
            return defaultColors as GetSetReturn<T, string[], ColorScale>;
        }
        defaultColors = args[0];
        return colors;
    };

    colors.mapFunction = <T extends ColorScaleMapFunc | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, ColorScaleMapFunc, ColorScale> => {
        if (!args.length) {
            return mapFunction as GetSetReturn<
                T,
                ColorScaleMapFunc,
                ColorScale
            >;
        }
        mapFunction = args[0];
        return colors;
    };

    colors.settings = <T extends Settings | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, Settings, ColorScale> => {
        if (!args.length) {
            return settings as GetSetReturn<T, Settings, ColorScale>;
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
