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

import { drawArc, arcVisible } from "./sunburstArc";
import { labelVisible, labelTransform, cropLabel } from "./sunburstLabel";
import { clickHandler } from "./sunburstClick";
import { D3Scale, GetSetReturn, Settings } from "../../types";

export interface SunburstData extends d3.HierarchyNode<any> {
    children: this[];
    crossValue: string[];
    current: this;
    data: {
        name: string;
        children: d3.HierarchyNode<any>[];
    };
    depth: number;
    height: number;
    key: string;
    label: any; // is NaN, but should this be string?
    mainValues: number;
    parent: any;
    value: number;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
}

export interface SunburstSeries {
    (sunburstElement: any): void;

    settings: <T extends Settings | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, Settings, SunburstSeries>;

    split: <T extends string | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, string, SunburstSeries>;

    data: <T extends SunburstData | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, SunburstData, SunburstSeries>;

    color: <T extends D3Scale | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, D3Scale, SunburstSeries>;

    radius: <T extends number | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, number, SunburstSeries>;
}

export function sunburstSeries(): SunburstSeries {
    let settings: Settings | null = null;
    let split: string | null = null;
    let data: SunburstData | null = null;
    let color: D3Scale | null = null;
    let radius = null;

    const _sunburstSeries: any = (sunburstElement) => {
        const segment = sunburstElement
            .selectAll("g.segment")
            .data(data.descendants().slice(1));
        const segmentEnter = segment
            .enter()
            .append("g")
            .attr("class", "segment");

        segmentEnter.append("path");
        segmentEnter
            .append("text")
            .attr("class", "segment")
            .attr("dy", "0.35em");
        const segmentMerge = segmentEnter.merge(segment);

        const path = segmentMerge
            .select("path")
            .attr("fill-opacity", (d) => (arcVisible(d.current) ? 1 : 0))
            .attr("user-select", (d) =>
                arcVisible(d.current) ? "initial" : "none"
            )
            .style("pointer-events", (d) =>
                arcVisible(d.current) ? "initial" : "none"
            )
            .attr("d", (d) => drawArc(radius)(d.current));
        color && path.style("fill", (d) => color(d.data.color));

        const label = segmentMerge
            .select("text")
            .attr("fill-opacity", (d) => +labelVisible(d.current))
            .attr("transform", (d) => labelTransform(d.current, radius))
            .text((d) => d.label)
            .each(function (d) {
                cropLabel.call(this, d, radius);
            });

        const parentTitle = sunburstElement.select("text.parent");
        const parent = sunburstElement
            .select("circle")
            .attr("r", radius)
            .datum(data);

        const onClick = clickHandler(
            data,
            sunburstElement,
            parent,
            parentTitle,
            path,
            label,
            radius,
            split,
            settings
        );
        // NOTE: Double check to make sure that settings.sunburstLevel is a thing.
        if (settings.sunburstLevel) {
            const currentLevel = data
                .descendants()
                .find((d) => d.data.name === settings.sunburstLevel[split]);
            currentLevel && onClick(currentLevel, true);
        } else {
            settings.sunburstLevel = {};
        }
        parent.on("click", (d) => onClick(d, false));
        path.filter((d) => d.children)
            .style("cursor", "pointer")
            .on("click", (d) => onClick(d, false));
    };

    _sunburstSeries.settings = <T extends Settings | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, Settings, SunburstSeries> => {
        if (!args.length) {
            return settings as GetSetReturn<T, Settings, SunburstSeries>;
        }
        settings = args[0];
        return _sunburstSeries;
    };

    _sunburstSeries.split = <T extends string | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, string, SunburstSeries> => {
        if (!args.length) {
            return split as GetSetReturn<T, string, SunburstSeries>;
        }
        split = args[0];
        return _sunburstSeries;
    };

    _sunburstSeries.data = <T extends SunburstData | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, SunburstData, SunburstSeries> => {
        if (!args.length) {
            return data as GetSetReturn<T, SunburstData, SunburstSeries>;
        }
        data = args[0];
        return _sunburstSeries;
    };

    _sunburstSeries.color = <T extends D3Scale | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, D3Scale, SunburstSeries> => {
        if (!args.length) {
            return color as GetSetReturn<T, D3Scale, SunburstSeries>;
        }
        color = args[0];
        return _sunburstSeries;
    };

    _sunburstSeries.radius = <T extends number | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, number, SunburstSeries> => {
        if (!args.length) {
            return radius as GetSetReturn<T, number, SunburstSeries>;
        }
        radius = args[0];
        return _sunburstSeries;
    };

    return _sunburstSeries;
}
