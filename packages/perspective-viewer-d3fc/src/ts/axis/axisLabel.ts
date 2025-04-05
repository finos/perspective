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

import { rebindAll } from "d3fc/index.js";
import { axisType } from "./axisType";
import { labelFunction as noLabel } from "./noAxis";
import { labelFunction as timeLabel } from "./timeAxis";
import { labelFunction as linearLabel } from "./linearAxis";
import { labelFunction as ordinalLabel } from "./ordinalAxis";
import { Settings } from "../types";

const labelFunctions = {
    none: noLabel,
    ordinal: ordinalLabel,
    time: timeLabel,
    linear: linearLabel,
};

export interface LabelFunction {
    // NOTE: this "i" is not used...
    (d, i?: any): string;
    valueName(): string;
    valueName(nextValueName: string): this;
}

export const labelFunction = (settings: Settings): LabelFunction => {
    const base = axisType(settings);
    let valueName = "__ROW_PATH__";
    const fn = labelFunctions[base()];
    const label: Partial<LabelFunction> = (d, _i) => {
        return fn(valueName, settings)(d);
    };

    rebindAll(label, base);
    label.valueName = (...args: string[]): any => {
        if (!args.length) {
            return valueName;
        }

        valueName = args[0];
        return label;
    };

    return label as LabelFunction;
};
