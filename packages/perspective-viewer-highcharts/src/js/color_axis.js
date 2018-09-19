/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as gparser from "gradient-parser";

function _get_gradient(type) {
    const thermometer = document.createElement("rect");
    thermometer.style.display = "none";
    thermometer.className = `highcharts-heatmap-gradient-${type}`;
    const chart = this.querySelector("#pivot_chart");
    chart.appendChild(thermometer);
    const gradient = window.getComputedStyle(thermometer).getPropertyValue("background-image");
    chart.removeChild(thermometer);
    return gparser.parse(gradient)[0].colorStops.map(x => [Number.parseFloat(x.length.value) / 100, `rgb(${x.value.join(",")})`]);
}

const _get_gradients = (() => {
    let gradients;
    return function() {
        if (gradients === undefined) {
            gradients = {};
            for (let type of ["positive", "negative", "full"]) {
                gradients[type] = _get_gradient.bind(this)(type);
            }
        }
        return gradients;
    };
})();

export function color_axis(config, colorRange) {
    let gradient,
        {positive, negative, full} = _get_gradients.bind(this)();
    if (colorRange[0] >= 0) {
        gradient = positive;
    } else if (colorRange[1] <= 0) {
        gradient = negative;
    } else {
        gradient = full;
    }
    Object.assign(config, {
        colorAxis: {
            min: colorRange[0],
            max: colorRange[1],
            stops: gradient,
            reversed: false,
            startOnTick: false,
            endOnTick: false
        }
    });
    config.legend.reversed = true;
    config.legend.floating = false;
    config.legend.enabled = true;
}
