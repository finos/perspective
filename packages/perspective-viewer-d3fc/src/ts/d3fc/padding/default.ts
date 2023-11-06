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

import { GetSetReturn, Pad, PadUnit, PaddingStrategy } from "../../types";

export const defaultPadding = (): PaddingStrategy => {
    let pad = [0, 0];
    let padUnit: PadUnit = "percent" as const;

    const padding: any = (extent) => {
        switch (padUnit) {
            case "domain": {
                extent[0] -= pad[0];
                extent[1] += pad[1];
                break;
            }
            case "percent": {
                let delta = extent[1] - extent[0];
                extent[0] -= pad[0] * delta;
                extent[1] += pad[1] * delta;
                break;
            }
            default:
                throw new Error("Unknown padUnit: " + padUnit);
        }
        return extent;
    };

    padding.pad = function <T extends Pad | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, Pad, PaddingStrategy> {
        if (args.length === 0) {
            return pad as GetSetReturn<T, Pad, PaddingStrategy>;
        }

        pad = args[0];

        return padding;
    };

    padding.padUnit = function <T extends PadUnit | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, PadUnit, PaddingStrategy> {
        if (!args.length) {
            return padUnit as GetSetReturn<T, PadUnit, PaddingStrategy>;
        }

        padUnit = args[0];

        return padding;
    };

    return padding;
};
