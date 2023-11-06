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

import { GetSetReturn, Settings, SettingNameValues } from "../types";

export const AXIS_TYPES = {
    none: "none",
    ordinal: "ordinal",
    time: "time",
    linear: "linear",
} as const;

export type AxisTypeValues = typeof AXIS_TYPES[keyof typeof AXIS_TYPES];

export interface AxisType {
    (): AxisTypeValues;
    settingName: <T extends SettingNameValues | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, SettingNameValues, AxisType>;
    settingValue: <T extends string | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, string, AxisType>;
    excludeType: <T extends AxisTypeValues | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, AxisTypeValues, AxisType>;
}

export const axisType = (settings: Settings): AxisType => {
    let settingName = "crossValues";
    let settingValue = null;
    let excludeType = null;

    const getType: any = (): AxisTypeValues | boolean => {
        const checkTypes = (types) => {
            const list = settingValue
                ? settings[settingName].filter((s) => settingValue == s.name)
                : settings[settingName];

            if (settingName == "crossValues" && list.length > 1) {
                // TODO: the return value of this function is used as an index, but "false" can't be used as an index.
                // can't do multiple values on non-ordinal cross-axis
                return false; // can this be "none"?
            }

            return list.some((s) => types.includes(s.type));
        };

        if (settings[settingName].length === 0) {
            return AXIS_TYPES.none;
        } else if (
            excludeType != AXIS_TYPES.time &&
            checkTypes(["datetime", "date"])
        ) {
            return AXIS_TYPES.time;
        } else if (
            excludeType != AXIS_TYPES.linear &&
            checkTypes(["integer", "float"])
        ) {
            return AXIS_TYPES.linear;
        }

        if (excludeType == AXIS_TYPES.ordinal) {
            return AXIS_TYPES.linear;
        }
        return AXIS_TYPES.ordinal;
    };

    getType.settingName = <T extends SettingNameValues | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, SettingNameValues, AxisType> => {
        if (!args.length) {
            return settingName as GetSetReturn<T, SettingNameValues, AxisType>;
        }
        settingName = args[0];
        return getType;
    };

    getType.settingValue = <T extends string | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, string, AxisType> => {
        if (!args.length) {
            return settingValue as GetSetReturn<T, string, AxisType>;
        }
        settingValue = args[0];
        return getType;
    };

    getType.excludeType = <T extends AxisTypeValues | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, AxisTypeValues, AxisType> => {
        if (!args.length) {
            return excludeType as GetSetReturn<T, AxisTypeValues, AxisType>;
        }
        excludeType = args[0];
        return getType;
    };

    return getType;
};
