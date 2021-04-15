/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export const PLUGIN_SYMBOL = Symbol("Plugin Symbol");

export function hexToRgb(hex) {
    var bigint = parseInt(hex.trim().slice(1), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return [r, g, b];
}

export function rgbaToRgb([r, g, b, a], source = [255, 255, 255]) {
    function f(i, c) {
        return ((1 - a) * (source[i] / 255) + a * (c / 255)) * 255;
    }

    return [f(0, r), f(1, g), f(2, b)];
}

export function infer_foreground_from_background([r, g, b]) {
    return Math.sqrt(r * r * 0.299 + g * g * 0.587 + b * b * 0.114) > 130 ? "#161616" : "#ffffff";
}
