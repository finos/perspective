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
import * as fc from "d3fc/index.js";
import minBandwidth from "./minBandwidth";
import { flattenArray } from "./flatten";
import {
    multiAxisBottom,
    multiAxisLeft,
    multiAxisTop,
    multiAxisRight,
} from "../d3fc/axis/multi-axis";
import { getChartContainer } from "../plugin/root";
import {
    Component,
    ComponentData,
    Domain,
    Orientation,
    SettingNameValues,
    Settings,
    ValueName,
} from "../types";

// NOTE: Where is this used? Is it?
// MinBandwidth doesn't have a padding() method, so what is going on here?
// @ts-ignore
export const scale = () => minBandwidth(d3.scaleBand()).padding(0.5);

interface OrdinalAxisDomain {
    (data: any): any;

    valueName(): ValueName;
    valueName(nextValueName: ValueName): this;

    valueNames(): ValueName[];
    valueNames(nextValueNames: ValueName[]): this;

    orient(): Orientation;
    orient(nextOrient: Orientation): this;
}

export const domain = (): OrdinalAxisDomain => {
    let valueNames = ["crossValue"];
    let orient = "horizontal";

    const _domain: Partial<Domain> = (data) => {
        const flattenedData = flattenArray(data);
        return transformDomain([
            ...Array.from(new Set(flattenedData.map((d) => d[valueNames[0]]))),
        ]);
    };

    const transformDomain = (d) => (orient == "vertical" ? d.reverse() : d);

    _domain.valueName = (...args: ValueName[]): any => {
        if (!args.length) {
            return valueNames[0];
        }
        valueNames = [args[0]];
        return _domain;
    };

    _domain.valueNames = (...args: ValueName[][]): any => {
        if (!args.length) {
            return valueNames;
        }
        valueNames = args[0];
        return _domain;
    };

    _domain.orient = (...args: Orientation[]): any => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return _domain;
    };

    return _domain as Domain;
};

export const labelFunction =
    (valueName, settings?: Settings) =>
    (d): string => {
        return d[valueName]
            .map((value, i) => {
                const ty = settings.crossValues[i].type;
                if (ty === "datetime") {
                    return new Date(value).toLocaleString(undefined, {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                        fractionalSecondDigits: 3,
                    });
                } else if (ty === "date") {
                    return new Date(value).toLocaleDateString();
                }

                return value;
            })
            .join("|");
    };

export const component = (settings: Settings): Component => {
    let orient = "horizontal";
    let settingName = "crossValues";
    let domain = null;

    const getComponent: any = (): ComponentData => {
        const multiLevel = settings[settingName].length > 1;

        // Calculate the label groups and corresponding group sizes
        const levelGroups = axisGroups(domain);
        const groupTickLayout = levelGroups.map(getGroupTickLayout);

        const tickSizeInner = multiLevel
            ? groupTickLayout.map((l) => l.size)
            : groupTickLayout[0].size;
        const tickSizeOuter = groupTickLayout.reduce((s, v) => s + v.size, 0);

        const createAxis = (base) => (scale) => {
            const axis = base(scale);

            if (multiLevel) {
                axis.groups(levelGroups)
                    .tickSizeInner(tickSizeInner)
                    .tickSizeOuter(tickSizeOuter);
            }
            if (orient !== "horizontal") axis.tickPadding(10);
            return axis;
        };

        const decorate = (s, data, index) => {
            const rotation = groupTickLayout[index].rotation;
            if (orient === "horizontal") applyLabelRotation(s, rotation);
            hideOverlappingLabels(s, rotation);
        };

        const axisSet = getAxisSet(multiLevel);
        return {
            bottom: createAxis(axisSet.bottom),
            left: createAxis(axisSet.left),
            right: createAxis(axisSet.right),
            top: createAxis(axisSet.top),
            size: `${tickSizeOuter + 10}px`,
            decorate,
        };
    };

    // const pickAxis = multiLevel => {
    //     if (multiLevel) {
    //         return orient === "horizontal" ?
    //                multiAxisBottom : multiAxisLeft;
    //     }
    //     return orient === "horizontal" ?
    //                 fc.axisOrdinalBottom : fc.axisOrdinalLeft;
    // };

    const getAxisSet = (multiLevel) => {
        if (multiLevel) {
            return {
                bottom: multiAxisBottom,
                left: multiAxisLeft,
                top: multiAxisTop,
                right: multiAxisRight,
            };
        } else {
            return {
                bottom: fc.axisOrdinalBottom,
                left: fc.axisOrdinalLeft,
                top: fc.axisOrdinalTop,
                right: fc.axisOrdinalRight,
            };
        }
    };

    const axisGroups = (domain) => {
        const groups = [];
        domain.forEach((tick) => {
            const split = tick && tick.split ? tick.split("|") : [tick];
            split.forEach((s, i) => {
                while (groups.length <= i) groups.push([]);

                const group = groups[i];
                if (group.length > 0 && group[group.length - 1].text === s) {
                    group[group.length - 1].domain.push(tick);
                } else {
                    group.push({ text: s, domain: [tick] });
                }
            });
        });
        return groups.reverse();
    };

    const getGroupTickLayout = (group) => {
        const width = settings.size.width;
        const maxLength = Math.max(
            ...group.map((g) => (g.text ? g.text.length : 0)),
        );

        if (orient === "horizontal") {
            // x-axis may rotate labels and expand the available height
            if (group && group.length * 16 > width - 100) {
                // Vertical
                return {
                    size: maxLength * 6.62 + 10,
                    rotation: 90,
                };
            } else if (
                group &&
                group.length * (maxLength * 6 + 10) > width - 100
            ) {
                // Angle
                return {
                    size: maxLength * 4 + 20,
                    rotation: 45,
                };
            }

            // Horizontal
            return {
                size: 25,
                rotation: 0,
            };
        } else {
            // y-axis size always based on label size
            return {
                size: maxLength * 6.62 + 10,
                rotation: 0,
            };
        }
    };

    const hideOverlappingLabels = (s, rotated) => {
        const getTransformCoords = (transform) => {
            const splitOn = transform.indexOf(",") !== -1 ? "," : " ";
            const coords = transform
                .substring(transform.indexOf("(") + 1, transform.indexOf(")"))
                .split(splitOn)
                .map((c) => parseInt(c));
            while (coords.length < 2) coords.push(0);
            return coords;
        };

        const rectanglesOverlap = (r1, r2) =>
            r1.x <= r2.x + r2.width &&
            r2.x <= r1.x + r1.width &&
            r1.y <= r2.y + r2.height &&
            r2.y <= r1.y + r1.height;
        const rotatedLabelsOverlap = (r1, r2) =>
            r1.x + r1.width + 14 > r2.x + r2.width;
        const isOverlap = rotated ? rotatedLabelsOverlap : rectanglesOverlap;

        const rectangleContained = (r1, r2) =>
            r1.x >= r2.x &&
            r1.x + r1.width <= r2.x + r2.width &&
            r1.y >= r2.y &&
            r1.y + r1.height <= r2.y + r2.height;
        // The bounds rect is the available screen space a label can fit into
        const boundsRect =
            orient == "horizontal" ? getXAxisBoundsRect(s) : null;

        const previousRectangles = [];
        s.each((d, i, nodes) => {
            const tick = d3.select(nodes[i]);

            // How the "tick" element is transformed (x/y)
            const transformCoords = getTransformCoords(tick.attr("transform"));

            // Work out the actual rectanble the label occupies
            const tickRect = tick.node().getBBox();
            const rect = {
                x: tickRect.x + transformCoords[0],
                y: tickRect.y + transformCoords[1],
                width: tickRect.width,
                height: tickRect.height,
            };

            const overlap = previousRectangles.some((r) => isOverlap(r, rect));

            // Test that it also fits into the screen space
            const hidden =
                overlap ||
                (boundsRect && !rectangleContained(rect, boundsRect));

            tick.attr("visibility", hidden ? "hidden" : "");
            if (!hidden) {
                previousRectangles.push(rect);
            }
        });
    };

    const getXAxisBoundsRect = (s) => {
        const container = getChartContainer(s.node());
        if (container === null) {
            return;
        }
        const chart = container.querySelector(".cartesian-chart");
        const axis = chart.querySelector(".x-axis");

        const chartRect = chart.getBoundingClientRect();
        const axisRect = axis.getBoundingClientRect();
        return {
            x: chartRect.left - axisRect.left,
            width: chartRect.width,
            y: chartRect.top - axisRect.top,
            height: chartRect.height,
        };
    };

    const getLabelTransform = (rotation) => {
        if (!rotation) {
            return "translate(0, 8)";
        }
        if (rotation < 60) {
            return `rotate(-${rotation} 5 5)`;
        }
        return `rotate(-${rotation} 3 7)`;
    };

    const applyLabelRotation = (s, rotation) => {
        const transform = getLabelTransform(rotation);
        const anchor = rotation ? "end" : "";
        s.each((d, i, nodes) => {
            const tick = d3.select(nodes[i]);
            const text = tick.select("text");

            text.attr("transform", transform).style("text-anchor", anchor);
        });
    };

    getComponent.orient = (...args: Orientation[]): any => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return getComponent;
    };

    getComponent.settingName = (...args: SettingNameValues[]): any => {
        if (!args.length) {
            return settingName;
        }
        settingName = args[0];
        return getComponent;
    };

    getComponent.domain = (...args: string[][]): any => {
        if (!args.length) {
            return domain;
        }
        domain = args[0];
        return getComponent;
    };

    return getComponent;
};
