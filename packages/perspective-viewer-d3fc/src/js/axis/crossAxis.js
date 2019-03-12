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
import {axisOrdinalBottom, axisOrdinalLeft} from "../d3fc/axis/axisOrdinal";
import {multiAxisBottom, multiAxisLeft} from "../d3fc/axis/multi-axis";

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

export const domain = settings => {
    let valueName = "crossValue";
    let settingName = "crossValues";

    const extentTime = fc.extentTime().accessors([d => new Date(d[valueName])]);

    const _domain = function(data) {
        const flattenedData = flattenArray(data);
        switch (axisType(settings, settingName)) {
            case AXIS_TYPES.time:
                return extentTime(flattenedData);
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
                    axis.tickLineAlign("right").tickPadding(8);

                    if (multiLevel) {
                        axis.groups(levelGroups)
                            .tickSizeInner(tickSizeInner)
                            .tickSizeOuter(tickSizeOuter);
                    }
                    return axis;
                };

                const decorate = (s, data, index) => {
                    const rotated = groupTickLayout[index].rotate;
                    hideOverlappingLabels(s, rotated);
                    if (orient === "horizontal") applyLabelRotation(s, rotated);
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
        return orient === "horizontal" ? axisOrdinalBottom : axisOrdinalLeft;
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
            if (group.length * (maxLength * 6 + 10) > width - 100) {
                return {
                    size: maxLength * 3 + 20,
                    rotate: true
                };
            }
            return {
                size: 25,
                rotate: false
            };
        } else {
            // y-axis size always based on label size
            return {
                size: maxLength * 5 + 10,
                rotate: false
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
        const rotatedLabelsOverlap = (r1, r2) => r1.x + 14 > r2.x;

        const previousRectangles = [];
        s.each((d, i, nodes) => {
            const tick = d3.select(nodes[i]);
            const text = tick.select("text");

            const transformCoords = getTransformCoords(tick.attr("transform"));

            let rect = {};
            let overlap = false;
            if (rotated) {
                rect = {x: transformCoords[0], y: transformCoords[1]};
                overlap = previousRectangles.some(r => rotatedLabelsOverlap(r, rect));
            } else {
                const textRect = text.node().getBBox();
                rect = {x: textRect.x + transformCoords[0], y: textRect.y + transformCoords[1], width: textRect.width, height: textRect.height};
                overlap = previousRectangles.some(r => rectanglesOverlap(r, rect));
            }

            text.attr("visibility", overlap ? "hidden" : "");
            if (!overlap) {
                previousRectangles.push(rect);
            }
        });
    };

    const applyLabelRotation = (s, rotate) => {
        s.each((d, i, nodes) => {
            const tick = d3.select(nodes[i]);
            const text = tick.select("text");

            text.attr("transform", rotate ? "rotate(-45 5 5)" : "translate(0, 8)").style("text-anchor", rotate ? "end" : "");
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
