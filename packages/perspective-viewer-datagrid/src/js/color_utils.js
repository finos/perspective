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

import chroma from "chroma-js";

export function blend(a, b) {
    return chroma.mix(a, `rgb(${b[0]},${b[1]},${b[2]})`, 0.5).hex();
}

// AFAICT `chroma-js` has no alpha-aware blending? So we need a function to get
// the color of a heatmap cell over the background.
export function rgbaToRgb([r, g, b, a], source = [255, 255, 255]) {
    function f(i, c) {
        return ((1 - a) * (source[i] / 255) + a * (c / 255)) * 255;
    }

    return [f(0, r), f(1, g), f(2, b)];
}

// Chroma does this but why bother?
export function infer_foreground_from_background([r, g, b]) {
    // TODO Implement dark/light themes.
    return Math.sqrt(r * r * 0.299 + g * g * 0.587 + b * b * 0.114) > 130
        ? "#161616"
        : "#ffffff";
}

function make_gradient(chromahex) {
    const [r, g, b] = chromahex.rgb();
    const [r1, g1, b1] = chromahex
        .set("hsl.h", (chromahex.get("hsl.h") - 15) % 360)
        .rgb();
    const [r2, g2, b2] = chromahex
        .set("hsl.h", (chromahex.get("hsl.h") + 15) % 360)
        .rgb();
    return `linear-gradient(to right top,rgb(${r1},${g1},${b1}),rgb(${r},${g},${b}) 50%,rgb(${r2},${g2},${b2}))`;
}

export function make_color_record(color) {
    const chroma_neg = chroma(color);
    const _neg_grad = make_gradient(chroma_neg);
    const rgb = chroma_neg.rgb();

    return [
        color,
        ...rgb,
        _neg_grad,
        `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`,
        `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`,
    ];
}
