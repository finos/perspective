/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import * as gparser from "gradient-parser";

let initialised = false;
export const colorStyles = {};

export const initialiseStyles = (container, settings) => {
    if (!initialised || !settings.colorStyles) {
        const data = ["series"];
        for (let n = 1; n <= 10; n++) {
            data.push(`series-${n}`);
        }

        const styles = {
            scheme: [],
            gradient: {},
            interpolator: {}
        };

        const computed = computedStyle(container);
        data.forEach((d, i) => {
            styles[d] = computed(`--d3fc-${d}`);

            if (i > 0) {
                styles.scheme.push(styles[d]);
            }
        });

        styles.opacity = getOpacityFromColor(styles.series);

        const gradients = ["full", "positive", "negative"];
        gradients.forEach(g => {
            const gradient = computed(`--d3fc-gradient-${g}`);
            styles.gradient[g] = parseGradient(gradient, styles.opacity);
            styles.interpolator[g] = multiInterpolator(styles.gradient[g]);
        });

        if (!initialised) {
            Object.keys(styles).forEach(p => {
                colorStyles[p] = styles[p];
            });
            initialised = true;
        }
        settings.colorStyles = styles;
    }
};

const getOpacityFromColor = color => {
    return d3.color(color).opacity;
};

const stepAsColor = (value, opacity) => {
    const color = d3.color(`#${value}`);
    color.opacity = opacity;
    return color + "";
};

const computedStyle = container => {
    if (window.ShadyCSS) {
        return d => window.ShadyCSS.getComputedStyleValue(container, d);
    } else {
        const containerStyles = getComputedStyle(container);
        return d => containerStyles.getPropertyValue(d);
    }
};

const parseGradient = (gradient, opacity) =>
    gparser
        .parse(gradient)[0]
        .colorStops.map(g => [g.length.value / 100, stepAsColor(g.value, opacity)])
        .sort((a, b) => a[0] - b[0]);

const multiInterpolator = gradientPairs => {
    // A new interpolator that calls through to a set of
    // interpolators between each value/color pair
    const interpolators = gradientPairs.slice(1).map((p, i) => d3.interpolate(gradientPairs[i][1], p[1]));
    return value => {
        const index = gradientPairs.findIndex((p, i) => i < gradientPairs.length - 1 && value <= gradientPairs[i + 1][0] && value > p[0]);
        if (index === -1) {
            if (value <= gradientPairs[0][0]) {
                return gradientPairs[0][1];
            }
            return gradientPairs[gradientPairs.length - 1][1];
        }

        const interpolator = interpolators[index];
        const [value1] = gradientPairs[index];
        const [value2] = gradientPairs[index + 1];

        return interpolator((value - value1) / (value2 - value1));
    };
};
