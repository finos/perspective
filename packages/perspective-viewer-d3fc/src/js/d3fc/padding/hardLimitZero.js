/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export const hardLimitZeroPadding = () => {
    let pad = [0, 0];
    let padUnit = "percent";
    let padAcrossZero = false;

    const padding = extent => {
        let delta = 1;
        switch (padUnit) {
            case "domain": {
                break;
            }
            case "percent": {
                delta = extent[1] - extent[0];
                break;
            }
            default:
                throw new Error("Unknown padUnit: " + padUnit);
        }

        let paddedLowerExtent = extent[0] - pad[0] * delta;
        let paddedUpperExtent = extent[1] + pad[1] * delta;

        // If datapoints are exclusively negative or positive and padAcrossZero is set false, hard limit extent to 0.
        extent[0] = !padAcrossZero && extent[0] >= 0 && paddedLowerExtent < 0 ? 0 : paddedLowerExtent;
        extent[1] = !padAcrossZero && extent[1] <= 0 && paddedUpperExtent > 0 ? 0 : paddedUpperExtent;
    };

    padding.padAcrossZero = function() {
        if (!arguments.length) {
            return padAcrossZero;
        }
        padAcrossZero = arguments.length <= 0 ? undefined : arguments[0];
        return padding;
    };

    padding.pad = function() {
        if (!arguments.length) {
            return pad;
        }
        pad = arguments.length <= 0 ? undefined : arguments[0];
        return padding;
    };

    padding.padUnit = function() {
        if (!arguments.length) {
            return padUnit;
        }
        padUnit = arguments.length <= 0 ? undefined : arguments[0];
        return padding;
    };

    return padding;
};
