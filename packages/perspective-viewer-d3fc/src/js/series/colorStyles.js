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

export const initialiseStyles = (container, settings) => {
    if (!settings.colorStyles) {
        const data = ["series"];
        for (let n = 1; n <= 10; n++) {
            data.push(`series-${n}`);
        }

        const styles = {
            scheme: [],
            gradient: {},
            interpolator: {},
            grid: {},
        };

        const computed = computedStyle(container);
        data.forEach((d, i) => {
            styles[d] = computed(`--d3fc-${d}`);

            if (i > 0) {
                styles.scheme.push(styles[d]);
            }
        });

        styles.opacity = getOpacityFromColor(styles.series);
        styles.grid.gridLineColor = computed`--d3fc-gridline--color`;

        const gradients = ["full", "positive", "negative"];
        gradients.forEach((g) => {
            const gradient = computed(`--d3fc-${g}--gradient`);
            styles.gradient[g] = parseGradient(gradient, styles.opacity);
        });

        settings.colorStyles = styles;
    }
};

const getOpacityFromColor = (color) => {
    return d3.color(color).opacity;
};

const stepAsColor = (value, opacity) => {
    const color = d3.color(`#${value}`);
    color.opacity = opacity;
    return color + "";
};

const computedStyle = (container) => {
    if (window.ShadyCSS) {
        return (d) => window.ShadyCSS.getComputedStyleValue(container, d);
    } else {
        const containerStyles = getComputedStyle(container);
        return (d) => containerStyles.getPropertyValue(d);
    }
};

const parseGradient = (gradient, opacity) => {
    const parsed = gparser.parse(gradient)[0].colorStops;
    return parsed
        .map((g, i) => [
            g.length ? g.length.value / 100 : i / (parsed.length - 1),
            stepAsColor(g.value, opacity),
        ])
        .sort((a, b) => a[0] - b[0]);
};
