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

import * as fc from "d3fc";
import { tooltip } from "./tooltip";
import { withOpacity } from "../series/seriesColors.js";
import { findBestFromData } from "../data/findBest";
import { raiseEvent } from "./selectionEvent";
import { SplitData } from "../data/splitData";
import { D3Scale, GetSetReturn, Settings } from "../types";

export type AltDataWithScale = {
    data: SplitData[][];
    yScale: D3Scale;
};

export interface SizeArg {
    (arg: any): any;
    copy: () => any;
}

interface NearbyTip {
    (selection: any): void;
    scaleFactor: <T extends number | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, number, NearbyTip>;
    settings: <T extends Settings | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, Settings, NearbyTip>;
    xScale: <T extends D3Scale | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, D3Scale, NearbyTip>;
    yScale: <T extends D3Scale | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, D3Scale, NearbyTip>;
    color: <T extends D3Scale | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, D3Scale, NearbyTip>;
    size: <T extends SizeArg | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, SizeArg, NearbyTip>;
    canvas: <T extends boolean | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, boolean, NearbyTip>;
    data: <T extends { [key: string]: any }[][] | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, { [key: string]: any }[][], NearbyTip>;
    xValueName: <T extends string | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, string, NearbyTip>;
    yValueName: <T extends string | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, string, NearbyTip>;
    altDataWithScale: <T extends AltDataWithScale | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, AltDataWithScale, NearbyTip>;
}

export default (): NearbyTip => {
    const base = tooltip().alwaysShow(true);

    let xScale: D3Scale | null = null;
    let yScale: D3Scale | null = null;
    let color: D3Scale | null = null;
    let size = null;
    let canvas = false;
    let data = null;
    let xValueName = "crossValue";
    let yValueName = "mainValue";
    let altDataWithScale = null;
    let scale_factor = 1;

    const nearbyTip: any = (selection) => {
        const chartPlotArea = `d3fc-${canvas ? "canvas" : "svg"}.plot-area`;
        if (xScale || yScale) {
            let tooltipData = null;
            const pointer = fc.pointer().on("point", (event) => {
                const closest = event.length
                    ? getClosestDataPoint(event[0])
                    : null;
                tooltipData = closest ? [closest.data] : [];
                const useYScale = closest ? closest.scale : yScale;

                renderTip(selection, tooltipData, useYScale);
            });

            selection
                .select(chartPlotArea)
                .on("measure.nearbyTip", () => renderTip(selection, []))
                .on("click", () => {
                    if (tooltipData.length) {
                        raiseEvent(
                            selection.node(),
                            tooltipData[0],
                            base.settings()
                        );
                    }
                })
                .call(pointer);
        }
    };

    const renderTip = (selection, tipData, useYScale = yScale) => {
        const tips = selection
            .select("d3fc-svg.plot-area svg")
            .selectAll("circle.nearbyTip")
            .data(tipData);
        tips.exit().remove();

        tips.enter()
            .append("circle")
            .attr("class", "nearbyTip")
            .merge(tips)
            .attr("r", (d) =>
                size ? scale_factor * Math.sqrt(size(d.size)) : 10
            )
            .attr(
                "transform",
                (d) =>
                    `translate(${xScale(d[xValueName])},${useYScale(
                        d[yValueName]
                    )})`
            )
            .style("stroke", "none")
            .style("fill", (d) => color && d.key && withOpacity(color(d.key)));

        base(tips);
    };

    const getClosestDataPoint = (pos) => {
        const distFn = (scale) => {
            return (v) => {
                if (
                    v[yValueName] === undefined ||
                    v[yValueName] === null ||
                    v[xValueName] === undefined ||
                    v[xValueName] === null
                )
                    return null;

                return Math.sqrt(
                    Math.pow((xScale(v[xValueName]) as number) - pos.x, 2) +
                        Math.pow(scale(v[yValueName]) - pos.y, 2)
                );
            };
        };

        // Check the main data
        const dist1 = distFn(yScale);
        const best1 = findBestFromData(data, dist1, Math.min);

        if (altDataWithScale) {
            // Check the alt data with its scale, to see if any are closer
            const dist2 = distFn(altDataWithScale.yScale);
            const best2 = findBestFromData(
                altDataWithScale.data,
                dist2,
                Math.min
            );
            return dist1(best1) <= dist2(best2)
                ? { data: best1, scale: yScale }
                : { data: best2, scale: altDataWithScale.yScale };
        }
        return { data: best1, scale: yScale };
    };

    nearbyTip.scaleFactor = <T extends number | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, number, NearbyTip> => {
        if (!args.length) {
            return scale_factor as GetSetReturn<T, number, NearbyTip>;
        }
        scale_factor = args[0];
        return nearbyTip;
    };
    nearbyTip.xScale = <T extends D3Scale | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, D3Scale, NearbyTip> => {
        if (!args.length) {
            return xScale as GetSetReturn<T, D3Scale, NearbyTip>;
        }
        xScale = args[0];
        return nearbyTip;
    };

    nearbyTip.yScale = <T extends D3Scale | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, D3Scale, NearbyTip> => {
        if (!args.length) {
            return yScale as GetSetReturn<T, D3Scale, NearbyTip>;
        }
        yScale = args[0];
        return nearbyTip;
    };

    nearbyTip.color = <T extends D3Scale | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, D3Scale, NearbyTip> => {
        if (!args.length) {
            return color as GetSetReturn<T, D3Scale, NearbyTip>;
        }
        color = args[0];
        return nearbyTip;
    };

    nearbyTip.size = <T extends SizeArg | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, SizeArg, NearbyTip> => {
        if (!args.length) {
            return size as GetSetReturn<T, SizeArg, NearbyTip>;
        }
        size = args[0] ? args[0].copy().range([40, 4000]) : null;
        return nearbyTip;
    };

    nearbyTip.canvas = <T extends boolean | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, boolean, NearbyTip> => {
        if (!args.length) {
            return canvas as GetSetReturn<T, boolean, NearbyTip>;
        }
        canvas = args[0];
        return nearbyTip;
    };

    nearbyTip.data = <
        T extends Record<string, any>[][] | undefined = undefined
    >(
        ...args: T[]
    ): GetSetReturn<T, Record<string, any>[][], NearbyTip> => {
        if (!args.length) {
            return data as GetSetReturn<T, Record<string, any>[][], NearbyTip>;
        }
        data = args[0];
        return nearbyTip;
    };

    nearbyTip.xValueName = <T extends string | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, string, NearbyTip> => {
        if (!args.length) {
            return xValueName as GetSetReturn<T, string, NearbyTip>;
        }
        xValueName = args[0];
        return nearbyTip;
    };

    nearbyTip.yValueName = <T extends string | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, string, NearbyTip> => {
        if (!args.length) {
            return yValueName as GetSetReturn<T, string, NearbyTip>;
        }
        yValueName = args[0];
        return nearbyTip;
    };

    nearbyTip.altDataWithScale = <T extends any[] | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, any[], NearbyTip> => {
        if (!args.length) {
            return altDataWithScale as GetSetReturn<T, any[], NearbyTip>;
        }
        altDataWithScale = args[0];
        return nearbyTip;
    };

    nearbyTip.settings = <T extends Settings | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, Settings, NearbyTip> => {
        if (!args.length) {
            return base.settings() as unknown as GetSetReturn<
                T,
                Settings,
                NearbyTip
            >;
        }
        base.settings(args[0]);
        return nearbyTip;
    };

    fc.rebindAll(nearbyTip, base);
    return nearbyTip;
};
