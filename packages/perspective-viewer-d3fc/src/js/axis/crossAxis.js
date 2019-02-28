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

export const domain = settings => {
    console.log("settings", settings);

    let valueName = "crossValue";
    let settingName = "crossValues";

    const extentTime = fc.extentTime().accessors([d => new Date(d[valueName])]);

    const _domain = function(data) {
        const flattenedData = data.flat(2);
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

const getMaxLengthsFromDomain = (domain, valueCount) => {
    const splitLengths = domain.map(d => d.split("|").map(e => e.length));

    const maxLengths = [];

    for (let i = 0; i < valueCount; i++) {
        const lengths = splitLengths.map(a => a[i]);
        maxLengths.push(Math.max(...lengths));
    }

    return maxLengths;
};

export const styleAxis = (chart, prefix, settings, settingName = "crossValues", suppliedDomain) => {
    chart[`${prefix}Label`](label(settings, settingName));

    let labelSize = 25;

    switch (axisType(settings, settingName)) {
        case AXIS_TYPES.ordinal:
            if (prefix !== "x" && suppliedDomain) {
                // calculate the label size from the data
                const maxLengths = getMaxLengthsFromDomain(suppliedDomain, settings[settingName].length);
                labelSize = maxLengths.reduce((m, v) => m + v, 0) * 5;
            }

            chart[`${prefix}TickGrouping`](t => t.split("|"))
                [`${prefix}TickSizeInner`](settings[settingName].length > 1 ? labelSize : 5)
                [`${prefix}TickSizeOuter`](0)
                [`${prefix}TickPadding`](8)
                [`${prefix}AxisSize`](settings[settingName].length * labelSize + 5)
                [`${prefix}Decorate`](hideOverlappingLabels);
            break;
    }
};

function hideOverlappingLabels(s) {
    const getTransformCoords = transform =>
        transform
            .substring(transform.indexOf("(") + 1, transform.indexOf(")"))
            .split(",")
            .map(c => parseInt(c));
    const rectanglesOverlap = (r1, r2) => r1.x <= r2.x + r2.width && r2.x <= r1.x + r1.width && r1.y <= r2.y + r2.height && r2.y <= r1.y + r1.height;

    const previousRectangles = [];
    s.each((d, i, nodes) => {
        const tick = d3.select(nodes[i]);
        const text = tick.select("text");
        const textRect = text.node().getBBox();

        const transformCoords = getTransformCoords(tick.attr("transform"));

        const rect = {x: textRect.x + transformCoords[0], y: textRect.y + transformCoords[1], width: textRect.width, height: textRect.height};
        const overlap = !!previousRectangles.find(r => rectanglesOverlap(r, rect));

        text.attr("visibility", overlap ? "hidden" : "");
        if (!overlap) {
            previousRectangles.push(rect);
        }
    });
}
