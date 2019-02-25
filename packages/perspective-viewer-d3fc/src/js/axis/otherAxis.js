/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
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

const defaultStyleOptions = {
    PaddingInner: 0.5,
    PaddingOuter: 0.25,
    TickSplitter: "|",
    TickSizeInnerDefault: 5,
    TickSizeOuter: 0,
    TickPadding: 8,
    AxisSizeDefault: 5
};

export const styleOptions = () => {
    let _styleOptions = {...defaultStyleOptions};

    const options = () => _styleOptions;

    options.paddingInner = (...args) => {
        if (!args.length) {
            return _styleOptions.PaddingInner;
        }
        _styleOptions.PaddingInner = args[0];
        return options;
    };

    options.paddingOuter = (...args) => {
        if (!args.length) {
            return _styleOptions.PaddingOuter;
        }
        _styleOptions.PaddingOuter = args[0];
        return options;
    };

    options.tickSplitter = (...args) => {
        if (!args.length) {
            return _styleOptions.TickSplitter;
        }
        _styleOptions.TickSplitter = args[0];
        return options;
    };

    options.tickSizeInnerDefault = (...args) => {
        if (!args.length) {
            return _styleOptions.TickSizeInnerDefault;
        }
        _styleOptions.TickSizeInnerDefault = args[0];
        return options;
    };

    options.tickSizeOuter = (...args) => {
        if (!args.length) {
            return _styleOptions.TickSizeOuter;
        }
        _styleOptions.TickSizeOuter = args[0];
        return options;
    };

    options.tickPadding = (...args) => {
        if (!args.length) {
            return _styleOptions.TickPadding;
        }
        _styleOptions.TickPadding = args[0];
        return options;
    };

    options.axisSizeDefault = (...args) => {
        if (!args.length) {
            return _styleOptions.AxisSizeDefault;
        }
        _styleOptions.AxisSizeDefault = args[0];
        return options;
    };

    return options;
};

export const styleAxis = (chart, prefix, settings, labelField = "crossValues", options = defaultStyleOptions, domain) => {
    chart[`${prefix}Label`](label(settings, labelField));

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
