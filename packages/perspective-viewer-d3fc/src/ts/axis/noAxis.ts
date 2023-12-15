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

import * as d3 from "d3";
import { flattenArray } from "./flatten";
import minBandwidth from "./minBandwidth";
import withoutTicks from "./withoutTicks";
import { Domain, Orientation, ValueName } from "../types";

export const scale = () => withoutTicks(minBandwidth(d3.scaleBand()));

export const domain = (): Domain => {
    let valueNames = ["crossValue"];
    let orient = "horizontal";

    const _domain: Partial<Domain> = (data: any[]) => {
        const flattenedData = flattenArray(data);
        return transformDomain([
            ...new Set(flattenedData.map((d) => d[valueNames[0]])),
        ]);
    };

    const transformDomain = (d) => (orient == "vertical" ? d.reverse() : d);

    _domain.valueName = (...args: ValueName[]): any => {
        if (!args.length) {
            return valueNames[0];
        }
        valueNames = [args[0]];
        return _domain;
    };

    _domain.valueNames = (...args: ValueName[][]): any => {
        if (!args.length) {
            return valueNames;
        }
        valueNames = args[0];
        return _domain;
    };

    _domain.orient = (...args: Orientation[]): any => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return _domain;
    };

    return _domain as Domain;
};

export const labelFunction = (valueName) => (d) => d[valueName].join("|");
