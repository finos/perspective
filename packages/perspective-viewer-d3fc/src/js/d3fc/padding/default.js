/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export const defaultPadding = () => {
    let pad = [0, 0];
    let padUnit = "percent";

    const padding = (extent) => {
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

    padding.pad = function () {
        if (!arguments.length) {
            return pad;
        }
        pad = arguments.length <= 0 ? undefined : arguments[0];
        return padding;
    };

    padding.padUnit = function () {
        if (!arguments.length) {
            return padUnit;
        }
        padUnit = arguments.length <= 0 ? undefined : arguments[0];
        return padding;
    };

    return padding;
};
