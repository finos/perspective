/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

let initialised = false;
export const colorStyles = {};

export const initialiseStyles = (container, settings) => {
    if (!initialised || !settings.colorStyles) {
        const data = ["series"];
        for (let n = 1; n <= 10; n++) {
            data.push(`series-${n}`);
        }

        const styles = {
            scheme: []
        };

        const computed = computedStyle(container);
        data.forEach((d, i) => {
            styles[d] = computed(`--d3fc-${d}`);

            if (i > 0) {
                styles.scheme.push(styles[d]);
            }
        });

        styles.opacity = getOpacityFromColor(styles.series);

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
    if (color.includes("rgba")) {
        const rgbColors = color.substring(color.indexOf("(") + 1).split(",");
        return parseFloat(rgbColors[3]);
    }
    return 1;
};

const computedStyle = container => {
    if (window.ShadyCSS) {
        return d => window.ShadyCSS.getComputedStyleValue(container, d);
    } else {
        const containerStyles = getComputedStyle(container);
        return d => containerStyles.getPropertyValue(d);
    }
};
