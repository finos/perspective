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

export const scale = (settings, typeField = "crossValues") => {
    switch (axisType(settings, typeField)) {
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

export const domain = (settings, labelField = "__ROW_PATH__", typeField = "crossValues") => {
    let valueName = "crossValue";
    let _labelField = labelField;

    console.log("labelField", labelField);
    console.log("typeField", typeField);

    let extentLinear = fc.extentLinear();
    let extentTime = fc.extentTime();

    const _domain = function(data) {
        const accessData = extent => {
            return extent.accessors([labelFunction(settings, _labelField, typeField)])(data);
        };
        switch (axisType(settings, typeField)) {
            case AXIS_TYPES.time:
                return accessData(extentTime);
            case AXIS_TYPES.linear:
                return accessData(extentLinear);
            default:
                console.log("Default domain: ", _labelField);
                return settings.data.map(d => d[_labelField]);
        }
    };

    fc.rebindAll(_domain, extentLinear);
    fc.rebindAll(_domain, extentTime);

    _domain.valueName = (...args) => {
        if (!args.length) {
            return valueName;
        }
        valueName = args[0];
        return _domain;
    };

    return _domain;
};

export const labelFunction = (settings, labelField = "__ROW_PATH__", typeField = "crossValues") => {
    switch (axisType(settings, typeField)) {
        case AXIS_TYPES.none:
            return d => d[labelField][0];
        case AXIS_TYPES.time:
            return d => new Date(d[labelField][0]);
        case AXIS_TYPES.linear:
            return d => d[labelField][0];
        default:
            return d => d[labelField].join("|");
    }
};

export const label = (settings, labelField = "crossValues") => settings[labelField].map(v => v.name).join(", ");

const axisType = (settings, typeField) => {
    if (settings[typeField].length === 0) {
        return AXIS_TYPES.none;
    } else if (settings[typeField].length === 1) {
        if (settings[typeField][0].type === "datetime") {
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

export const styleOptions = {
    PaddingInner: 0.5,
    PaddingOuter: 0.25,
    TickSplitter: "|",
    TickSizeInnerDefault: 5,
    TickSizeOuter: 0,
    TickPadding: 8,
    AxisSizeDefault: 5
};

export const styleAxis = (chart, prefix, settings, labelField = "crossValues", options = styleOptions, domain) => {
    chart[`${prefix}Label`](label(settings, labelField));

    //const valueSize = v => v.length * 5;
    //const valueSetSize = s => s.split && s.split("|").reduce((m, v) => Math.max(m, valueSize(v)), 0);
    //const labelSize = prefix === "x" ? 25 : domain(settings)(settings.data).reduce((m, v) => Math.max(m, valueSetSize(v)), 0);

    let labelSize = 25;

    if (prefix !== "x") {
        const maxLengths = getMaxLengthsFromDomain(domain, settings[labelField].length);
        labelSize = prefix === "x" ? 25 : maxLengths.reduce((m, v) => m + v, 0) * 5;
    }

    chart[`${prefix}PaddingInner`](options.PaddingInner)
        [`${prefix}PaddingOuter`](options.PaddingOuter)
        [`${prefix}TickGrouping`](t => t.split(options.TickSplitter))
        [`${prefix}TickSizeInner`](settings[labelField].length > 1 ? labelSize : options.TickSizeInnerDefault)
        [`${prefix}TickSizeOuter`](options.TickSizeOuter)
        [`${prefix}TickPadding`](options.TickPadding)
        [`${prefix}AxisSize`](labelSize + options.AxisSizeDefault);
};
