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
    GetSetReturn,
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
    memoValue: <T extends Axis | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, Axis, AxisFactory>;
    excludeType: <T extends string | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, string, AxisFactory>;
    orient: <T extends Orientation | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, Orientation, AxisFactory>;
    settingName: <T extends SettingNameValues | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, SettingNameValues, AxisFactory>;
    settingValue: <T extends string | null | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, string | null, AxisFactory>;
    valueName: <T extends ValueName | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, ValueName, AxisFactory>;
    valueNames: <T extends ValueName[] | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, ValueName[], AxisFactory>;
    modifyDomain: <T extends ModifyDomainFunc | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, ModifyDomainFunc, AxisFactory>;

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

    const _factory: any = (data): AxisFactoryContent => {
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
            // Not all Axis provide a tickFormatFunction, but currently it's expected to be
            // undefined if not used. Ignoring this until we have a better solution.
            // @ts-ignore
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

    _factory.memoValue = <T extends Axis | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, Axis, AxisFactory> => {
        if (!args.length) {
            return memoValue as GetSetReturn<T, Axis, AxisFactory>;
        }
        memoValue = args[0];
        return _factory;
    };

    _factory.excludeType = <T extends AxisTypeValues | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, string, AxisFactory> => {
        if (!args.length) {
            return excludeType as GetSetReturn<T, string, AxisFactory>;
        }
        excludeType = args[0];
        return _factory;
    };

    _factory.orient = <T extends Orientation | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, Orientation, AxisFactory> => {
        if (!args.length) {
            return orient as GetSetReturn<T, Orientation, AxisFactory>;
        }
        orient = args[0];
        return _factory;
    };

    _factory.settingName = <
        T extends SettingNameValues | undefined = undefined
    >(
        ...args: T[]
    ): GetSetReturn<T, SettingNameValues, AxisFactory> => {
        if (!args.length) {
            return settingName as GetSetReturn<
                T,
                SettingNameValues,
                AxisFactory
            >;
        }
        settingName = args[0];
        return _factory;
    };

    _factory.settingValue = <T extends string | null | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, string | null, AxisFactory> => {
        if (!args.length) {
            return settingValue as GetSetReturn<T, string | null, AxisFactory>;
        }
        settingValue = args[0];
        return _factory;
    };

    _factory.valueName = <T extends ValueName | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, ValueName, AxisFactory> => {
        if (!args.length) {
            return valueNames[0] as GetSetReturn<T, ValueName, AxisFactory>;
        }
        valueNames = [args[0]];
        return _factory;
    };

    _factory.valueNames = <T extends ValueName[] | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, ValueName[], AxisFactory> => {
        if (!args.length) {
            return valueNames as GetSetReturn<T, ValueName[], AxisFactory>;
        }
        valueNames = args[0];
        return _factory;
    };

    _factory.modifyDomain = <
        T extends ModifyDomainFunc | undefined = undefined
    >(
        ...args: T[]
    ): GetSetReturn<T, ModifyDomainFunc, AxisFactory> => {
        if (!args.length) {
            return modifyDomain as GetSetReturn<
                T,
                ModifyDomainFunc,
                AxisFactory
            >;
        }
        modifyDomain = args[0];
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
