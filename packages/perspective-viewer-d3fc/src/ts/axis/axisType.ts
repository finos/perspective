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

import { Settings, SettingNameValues } from "../types";

export const AXIS_TYPES = {
    none: "none",
    ordinal: "ordinal",
    time: "time",
    linear: "linear",
} as const;

export type AxisTypeValues = (typeof AXIS_TYPES)[keyof typeof AXIS_TYPES];

export interface AxisType {
    (): AxisTypeValues;

    settingName(): SettingNameValues;
    settingName(nextSettingName: SettingNameValues): this;

    settingValue(): string;
    settingValue(nextSettingValue: string): this;

    excludeType(): AxisTypeValues;
    excludeType(nextExcludeType: AxisTypeValues): this;
}

export const axisType = (settings: Settings): AxisType => {
    let settingName = "crossValues";
    let settingValue = null;
    let excludeType = null;

    const getType: Partial<AxisType> = (): AxisTypeValues | boolean => {
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

    getType.settingName = (...args: SettingNameValues[]): any => {
        if (!args.length) {
            return settingName;
        }
        settingName = args[0];
        return getType;
    };

    getType.settingValue = (...args: (string | undefined)[]): any => {
        if (!args.length) {
            return settingValue;
        }

        settingValue = args[0];
        return getType;
    };

    getType.excludeType = (...args: AxisTypeValues[]): any => {
        if (!args.length) {
            return excludeType;
        }
        excludeType = args[0];
        return getType;
    };

    return getType as AxisType;
};
