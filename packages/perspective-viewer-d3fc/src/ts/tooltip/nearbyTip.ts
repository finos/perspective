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

import * as fc from "d3fc/index.js";
import { tooltip } from "./tooltip";
import { withOpacity } from "../series/seriesColors.js";
import { findBestFromData } from "../data/findBest";
import { raiseEvent } from "./selectionEvent";
import { SplitData } from "../data/splitData";
import { D3Scale, Settings } from "../types";

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

    scaleFactor(): number;
    scaleFactor(scaleFactor: number): NearbyTip;

    settings(): Settings;
    settings(settings: Settings): NearbyTip;

    xScale(): D3Scale;
    xScale(xScale: D3Scale): NearbyTip;

    yScale(): D3Scale;
    yScale(yScale: D3Scale): NearbyTip;

    color(): D3Scale;
    color(color: D3Scale): NearbyTip;

    size(): SizeArg;
    size(size: SizeArg): NearbyTip;

    canvas(): boolean;
    canvas(canvas: boolean): NearbyTip;

    data(): Record<string, any>[][];
    data(data: Record<string, any>[][]): NearbyTip;

    xValueName(): string;
    xValueName(xValueName: string): NearbyTip;

    yValueName(): string;
    yValueName(yValueName: string): NearbyTip;

    altDataWithScale(): AltDataWithScale;
    altDataWithScale(altDataWithScale: AltDataWithScale): NearbyTip;
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

    const nearbyTip: Partial<NearbyTip> = (selection) => {
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
                            base.settings(),
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
                size ? scale_factor * Math.sqrt(size(d.size)) : 10,
            )
            .attr(
                "transform",
                (d) =>
                    `translate(${xScale(d[xValueName])},${useYScale(
                        d[yValueName],
                    )})`,
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
                        Math.pow(scale(v[yValueName]) - pos.y, 2),
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
                Math.min,
            );
            return dist1(best1) <= dist2(best2)
                ? { data: best1, scale: yScale }
                : { data: best2, scale: altDataWithScale.yScale };
        }
        return { data: best1, scale: yScale };
    };

    nearbyTip.scaleFactor = (...args: number[]): any => {
        if (!args.length) {
            return scale_factor;
        }
        scale_factor = args[0];
        return nearbyTip;
    };
    nearbyTip.xScale = (...args: D3Scale[]): any => {
        if (!args.length) {
            return xScale;
        }
        xScale = args[0];
        return nearbyTip;
    };

    nearbyTip.yScale = (...args: D3Scale[]): any => {
        if (!args.length) {
            return yScale;
        }
        yScale = args[0];
        return nearbyTip;
    };

    nearbyTip.color = (...args: D3Scale[]): any => {
        if (!args.length) {
            return color;
        }
        color = args[0];
        return nearbyTip;
    };

    nearbyTip.size = (...args: SizeArg[]): any => {
        if (!args.length) {
            return size;
        }
        size = args[0] ? args[0].copy().range([40, 4000]) : null;
        return nearbyTip;
    };

    nearbyTip.canvas = (...args: boolean[]): any => {
        if (!args.length) {
            return canvas;
        }
        canvas = args[0];
        return nearbyTip;
    };

    nearbyTip.data = (...args: Record<string, any>[][][]): any => {
        if (!args.length) {
            return data;
        }
        data = args[0];
        return nearbyTip;
    };

    nearbyTip.xValueName = (...args: string[]): any => {
        if (!args.length) {
            return xValueName;
        }
        xValueName = args[0];
        return nearbyTip;
    };

    nearbyTip.yValueName = (...args: string[]): any => {
        if (!args.length) {
            return yValueName;
        }
        yValueName = args[0];
        return nearbyTip;
    };

    nearbyTip.altDataWithScale = (...args: AltDataWithScale[]): any => {
        if (!args.length) {
            return altDataWithScale;
        }
        altDataWithScale = args[0];
        return nearbyTip;
    };

    nearbyTip.settings = (...args: Settings[]): any => {
        if (!args.length) {
            return base.settings();
        }
        base.settings(args[0]);
        return nearbyTip;
    };

    fc.rebindAll(nearbyTip, base);
    return nearbyTip as NearbyTip;
};
