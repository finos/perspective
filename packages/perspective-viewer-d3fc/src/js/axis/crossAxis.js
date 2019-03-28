/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
import * as fc from "d3fc";
import minBandwidth from "./minBandwidth";
import withoutTicks from "./withoutTicks";
import {multiAxisBottom, multiAxisLeft} from "../d3fc/axis/multi-axis";
import {getChartContainer} from "../plugin/root";

const AXIS_TYPES = {
    none: "none",
    ordinal: "ordinal",
    time: "time",
    linear: "linear"
};

export const scale = (settings, settingName = "crossValues") => {
    switch (axisType(settings, settingName)) {
        case AXIS_TYPES.none:
            return withoutTicks(defaultScaleBand());
        case AXIS_TYPES.time:
            return d3.scaleTime();
        case AXIS_TYPES.linear:
            return d3.scaleLinear();
        default:
            return defaultScaleBand();
    }
};

const defaultScaleBand = () => minBandwidth(d3.scaleBand());

const flattenArray = array => {
    if (Array.isArray(array)) {
        return [].concat(...array.map(flattenArray));
    } else {
        return [array];
    }
};

const getMinimumGap = (data, dataMap) =>
    data
        .map(dataMap)
        .sort((a, b) => a - b)
        .filter((d, i, a) => i === 0 || d !== a[i - 1])
        .reduce((acc, d, i, src) => (i === 0 || acc <= d - src[i - 1] ? acc : d - src[i - 1]));

export const domain = settings => {
    let valueName = "crossValue";
    let settingName = "crossValues";

    const extentTime = fc
        .extentTime()
        .accessors([d => new Date(d[valueName])])
        .padUnit("domain");

    const _domain = function(data) {
        const flattenedData = flattenArray(data);
        switch (axisType(settings, settingName)) {
            case AXIS_TYPES.time:
                const dataWidth = getMinimumGap(flattenedData, d => new Date(d[valueName]).getTime());
                return extentTime.pad([dataWidth / 2, dataWidth / 2])(flattenedData);
            default:
                return [...new Set(flattenedData.map(d => d[valueName]))];
        }
    };

    switch (axisType(settings)) {
        case AXIS_TYPES.time:
            fc.rebindAll(_domain, extentTime);
            break;
    }

    _domain.valueName = (...args) => {
        if (!args.length) {
            return valueName;
        }
        valueName = args[0];
        return _domain;
    };

    _domain.settingName = (...args) => {
        if (!args.length) {
            return settingName;
        }
        settingName = args[0];
        return _domain;
    };

    return _domain;
};

export const labelFunction = (settings, valueName = "__ROW_PATH__", settingName = "crossValues") => {
    switch (axisType(settings, settingName)) {
        case AXIS_TYPES.none:
            return d => d[valueName][0];
        case AXIS_TYPES.time:
            return d => new Date(d[valueName][0]);
        case AXIS_TYPES.linear:
            return d => d[valueName][0];
        default:
            return d => d[valueName].join("|");
    }
};

export const label = (settings, settingName = "crossValues") => settings[settingName].map(v => v.name).join(", ");

const axisType = (settings, settingName = "crossValues") => {
    if (settings[settingName].length === 0) {
        return AXIS_TYPES.none;
    } else if (settings[settingName].length === 1) {
        if (settings[settingName][0].type === "datetime") {
            return AXIS_TYPES.time;
        }
    }
    return AXIS_TYPES.ordinal;
};

export const axisFactory = settings => {
    let orient = "horizontal";
    let settingName = "crossValues";
    let domain = null;

    const factory = () => {
        switch (axisType(settings, settingName)) {
            case AXIS_TYPES.ordinal:
                const multiLevel = settings[settingName].length > 1 && settings[settingName].every(v => v.type !== "datetime");

                // Calculate the label groups and corresponding group sizes
                const levelGroups = axisGroups(domain);
                const groupTickLayout = levelGroups.map(getGroupTickLayout);

                const tickSizeInner = multiLevel ? groupTickLayout.map(l => l.size) : groupTickLayout[0].size;
                const tickSizeOuter = groupTickLayout.reduce((s, v) => s + v.size, 0);

                const createAxis = scale => {
                    const axis = pickAxis(multiLevel)(scale);

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

                return {
                    bottom: createAxis,
                    left: createAxis,
                    size: `${tickSizeOuter + 10}px`,
                    decorate
                };
        }

        // Default axis
        return {
            bottom: fc.axisBottom,
            left: fc.axisLeft,
            decorate: () => {}
        };
    };

    const pickAxis = multiLevel => {
        if (multiLevel) {
            return orient === "horizontal" ? multiAxisBottom : multiAxisLeft;
        }
        return orient === "horizontal" ? fc.axisOrdinalBottom : fc.axisOrdinalLeft;
    };

    const axisGroups = domain => {
        const groups = [];
        domain.forEach(tick => {
            const split = tick.split("|");
            split.forEach((s, i) => {
                while (groups.length <= i) groups.push([]);

                const group = groups[i];
                if (group.length > 0 && group[group.length - 1].text === s) {
                    group[group.length - 1].domain.push(tick);
                } else {
                    group.push({text: s, domain: [tick]});
                }
            });
        });
        return groups.reverse();
    };

    const getGroupTickLayout = group => {
        const width = settings.size.width;
        const maxLength = Math.max(...group.map(g => g.text.length));

        if (orient === "horizontal") {
            // x-axis may rotate labels and expand the available height
            if (group.length * 16 > width - 100) {
                return {
                    size: maxLength * 5 + 10,
                    rotation: 90
                };
            } else if (group.length * (maxLength * 6 + 10) > width - 100) {
                return {
                    size: maxLength * 3 + 20,
                    rotation: 45
                };
            }
            return {
                size: 25,
                rotation: 0
            };
        } else {
            // y-axis size always based on label size
            return {
                size: maxLength * 5 + 10,
                rotation: 0
            };
        }
    };

    const hideOverlappingLabels = (s, rotated) => {
        const getTransformCoords = transform =>
            transform
                .substring(transform.indexOf("(") + 1, transform.indexOf(")"))
                .split(",")
                .map(c => parseInt(c));

        const rectanglesOverlap = (r1, r2) => r1.x <= r2.x + r2.width && r2.x <= r1.x + r1.width && r1.y <= r2.y + r2.height && r2.y <= r1.y + r1.height;
        const rotatedLabelsOverlap = (r1, r2) => r1.x + r1.width + 14 > r2.x + r2.width;
        const isOverlap = rotated ? rotatedLabelsOverlap : rectanglesOverlap;

        const rectangleContained = (r1, r2) => r1.x >= r2.x && r1.x + r1.width <= r2.x + r2.width && r1.y >= r2.y && r1.y + r1.height <= r2.y + r2.height;
        // The bounds rect is the available screen space a label can fit into
        const boundsRect = orient == "horizontal" ? getXAxisBoundsRect(s) : null;

        const previousRectangles = [];
        s.each((d, i, nodes) => {
            const tick = d3.select(nodes[i]);

            // How the "tick" element is transformed (x/y)
            const transformCoords = getTransformCoords(tick.attr("transform"));

            // Work out the actual rectanble the label occupies
            const tickRect = tick.node().getBBox();
            const rect = {x: tickRect.x + transformCoords[0], y: tickRect.y + transformCoords[1], width: tickRect.width, height: tickRect.height};

            const overlap = previousRectangles.some(r => isOverlap(r, rect));

            // Test that it also fits into the screen space
            const hidden = overlap || (boundsRect && !rectangleContained(rect, boundsRect));

            tick.attr("visibility", hidden ? "hidden" : "");
            if (!hidden) {
                previousRectangles.push(rect);
            }
        });
    };

    const getXAxisBoundsRect = s => {
        const chart = getChartContainer(s.node())
            .getRootNode()
            .querySelector(".cartesian-chart");
        const axis = chart.querySelector(".x-axis");

        const chartRect = chart.getBoundingClientRect();
        const axisRect = axis.getBoundingClientRect();
        return {
            x: chartRect.x - axisRect.x,
            width: chartRect.width,
            y: chartRect.y - axisRect.y,
            height: chartRect.height
        };
    };

    const getLabelTransform = rotation => {
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

    factory.orient = (...args) => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return factory;
    };

    factory.settingName = (...args) => {
        if (!args.length) {
            return settingName;
        }
        settingName = args[0];
        return factory;
    };

    factory.domain = (...args) => {
        if (!args.length) {
            return domain;
        }
        domain = args[0];
        return factory;
    };

    return factory;
};
