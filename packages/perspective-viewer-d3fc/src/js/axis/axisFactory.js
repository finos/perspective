/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import { axisType } from "./axisType";
import * as none from "./noAxis";
import * as linear from "./linearAxis";
import * as time from "./timeAxis";
import * as ordinal from "./ordinalAxis";

const axisTypes = {
    none,
    ordinal,
    time,
    linear,
};

export const axisFactory = (settings) => {
    let excludeType = null;
    let orient = "horizontal";
    let settingName = "crossValues";
    let settingValue = null;
    let valueNames = ["crossValue"];

    const optionalParams = ["include", "paddingStrategy", "pad"];
    const optional = {};

    const _factory = (data) => {
        const useType = axisType(settings)
            .excludeType(excludeType)
            .settingName(settingName)
            .settingValue(settingValue)();

        const axis = axisTypes[useType];
        const domainFunction = axis.domain().valueNames(valueNames);

        optionalParams.forEach((p) => {
            if (optional[p] && domainFunction[p])
                domainFunction[p](optional[p]);
        });
        if (domainFunction.orient) domainFunction.orient(orient);

        const domain = domainFunction(data);
        const component = axis.component
            ? createComponent(axis, domain, data)
            : defaultComponent();

        return {
            scale: axis.scale(),
            domain,
            domainFunction,
            labelFunction: axis.labelFunction,
            component: {
                bottom: component.bottom,
                left: component.left,
                top: component.top,
                right: component.right,
            },
            size: component.size,
            decorate: component.decorate,
            label: settings[settingName].map((v) => v.name).join(", "),
            tickFormatFunction: axis.tickFormatFunction,
        };
    };

    const createComponent = (axis, domain, data) =>
        axis
            .component(settings)
            .orient(orient)
            .settingName(settingName)
            .domain(domain)(data);

    const defaultComponent = () => ({
        bottom: fc.axisBottom,
        left: fc.axisLeft,
        top: fc.axisTop,
        right: fc.axisRight,
        decorate: () => {},
    });

    _factory.excludeType = (...args) => {
        if (!args.length) {
            return excludeType;
        }
        excludeType = args[0];
        return _factory;
    };

    _factory.orient = (...args) => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return _factory;
    };

    _factory.settingName = (...args) => {
        if (!args.length) {
            return settingName;
        }
        settingName = args[0];
        return _factory;
    };

    _factory.settingValue = (...args) => {
        if (!args.length) {
            return settingValue;
        }
        settingValue = args[0];
        return _factory;
    };

    _factory.valueName = (...args) => {
        if (!args.length) {
            return valueNames[0];
        }
        valueNames = [args[0]];
        return _factory;
    };

    _factory.valueNames = (...args) => {
        if (!args.length) {
            return valueNames;
        }
        valueNames = args[0];
        return _factory;
    };

    optionalParams.forEach((p) => {
        _factory[p] = (...args) => {
            if (!args.length) {
                return optional[p];
            }
            optional[p] = args[0];
            return _factory;
        };
    });

    return _factory;
};
