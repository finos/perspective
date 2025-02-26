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
import { AxisTypeValues, axisType } from "./axisType";
import * as none from "./noAxis";
import * as linear from "./linearAxis";
import * as time from "./timeAxis";
import * as ordinal from "./ordinalAxis";

import {
    Axis,
    D3Scale,
    Domain,
    DomainTuple,
    Orientation,
    SettingNameValues,
    Settings,
    ValueName,
} from "../types";

export type AxisComponent = (scale) => Axis;

export interface AxisFactoryContent {
    scale: D3Scale;
    domain: DomainTuple;
    domainFunction: Function;
    labelFunction: (valueName: any) => (d: any) => string | Date;
    component: {
        bottom: AxisComponent;
        left: AxisComponent;
        top: AxisComponent;
        right: AxisComponent;
    };
    size: number | undefined;
    decorate: Function; // (s, data, index) => unknown
    label: string;
    tickFormatFunction: Function;
}

interface AxisFactory {
    (data: any[]): any;
    memoValue(): Axis;
    memoValue(a: Axis): AxisFactory;

    excludeType(): () => AxisTypeValues;
    excludeType(nextExcludeType?: AxisTypeValues): this;

    orient(): () => Orientation;
    orient(nextOrient?: Orientation): this;

    settingName(): () => SettingNameValues;
    settingName(nextSettingName?: SettingNameValues): this;

    settingValue(): () => string | null;
    settingValue(nextSettingValue?: string | null): this;

    valueName(): () => ValueName;
    valueName(nextValueName?: ValueName): this;

    valueNames(): () => ValueName[];
    valueNames(nextValueNames?: ValueName[]): this;

    modifyDomain(): () => ModifyDomainFunc;
    modifyDomain(nextModifyDomain?: ModifyDomainFunc): this;

    // optional params, no idea yet if these are right or not.
    include?: (nextInclude?: number[]) => any;
    paddingStrategy?: (nextPaddingStrategy?: any) => any;
    pad?: (nextPad?: [number, number]) => any;
}

export type ModifyDomainFunc = (domain: any[]) => any[];

const axisTypes = {
    none,
    ordinal,
    time,
    linear,
};

export const axisFactory = (settings: Settings): AxisFactory => {
    let excludeType: AxisTypeValues | null = null;
    let orient: Orientation = "horizontal";
    let settingName: SettingNameValues = "crossValues";
    let settingValue: string | undefined = undefined;
    let valueNames: ValueName[] = ["crossValue"];
    let modifyDomain = null;
    let memoValue = null;

    const optionalParams = ["include", "paddingStrategy", "pad"];
    const optional = {};

    const _factory: Partial<AxisFactory> = (data): AxisFactoryContent => {
        const useType = axisType(settings)
            .excludeType(excludeType)
            .settingName(settingName)
            .settingValue(settingValue)();

        const axis = axisTypes[useType];
        const domainFunction = (axis.domain() as Domain).valueNames(valueNames);

        optionalParams.forEach((p) => {
            if (optional[p] && domainFunction[p])
                domainFunction[p](optional[p]);
        });
        if (domainFunction.orient) domainFunction.orient(orient);

        let domain = domainFunction(data);
        if (modifyDomain !== null) {
            domain = modifyDomain(domain);
        }

        if (memoValue && typeof domain[0] === "number") {
            memoValue[0] = domain[0] = Math.min(domain[0], memoValue[0]);
            memoValue[1] = domain[1] = Math.max(domain[1], memoValue[1]);
        }

        const component = axis.hasOwnProperty("component")
            ? createComponent(axis, domain, data)
            : defaultComponent();

        const tickFormatFunction =
            axis == linear
                ? linear.tickFormatFunction(domain[0], domain[1])
                : undefined;

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
            tickFormatFunction,
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

    _factory.memoValue = (...args: Axis[]): any => {
        if (!args.length) {
            return memoValue;
        }

        memoValue = args[0];
        return _factory;
    };

    _factory.excludeType = (...args: AxisTypeValues[]): any => {
        if (!args.length) {
            return excludeType;
        }

        excludeType = args[0];
        return _factory;
    };

    _factory.orient = (...args: Orientation[]): any => {
        if (!args.length) {
            return orient;
        }

        orient = args[0];
        return _factory;
    };

    _factory.settingName = (...args: SettingNameValues[]): any => {
        if (!args.length) {
            return settingName;
        }

        settingName = args[0];
        return _factory;
    };

    _factory.settingValue = (...args: (string | null)[]): any => {
        if (!args.length) {
            return settingValue;
        }

        settingValue = args[0];
        return _factory;
    };

    _factory.valueName = (...args: ValueName[]): any => {
        if (!args.length) {
            return valueNames[0];
        }

        valueNames = [args[0]];
        return _factory;
    };

    _factory.valueNames = (...args: ValueName[][]): any => {
        if (!args.length) {
            return valueNames;
        }

        valueNames = args[0];
        return _factory;
    };

    _factory.modifyDomain = (nextModifyDomain?: ModifyDomainFunc) => {
        if (!nextModifyDomain) {
            return modifyDomain;
        }

        modifyDomain = nextModifyDomain;
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

    return _factory as AxisFactory;
};
