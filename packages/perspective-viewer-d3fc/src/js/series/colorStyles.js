/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";

let initialised = false;
export const colorStyles = {
    scheme: []
};

export const initialiseStyles = container => {
    if (!initialised) {
        const selection = d3.select(container);
        const chart = selection.append("svg").attr("class", "chart");

        const data = ["series"];
        for (let n = 1; n <= 10; n++) {
            data.push(`series-${n}`);
        }

        const testElements = chart
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", d => d);

        testElements.each((d, i, nodes) => {
            const style = getComputedStyle(nodes[i]);
            colorStyles[d] = style.getPropertyValue("fill");

            if (i > 0) {
                colorStyles.scheme.push(colorStyles[d]);
            }
        });

        colorStyles.opacity = getOpacityFromColor(colorStyles.series);

        chart.remove();
        initialised = true;
    }
};

const getOpacityFromColor = color => {
    if (color.includes("rgba")) {
        const rgbColors = color.substring(color.indexOf("(") + 1).split(",");
        return parseFloat(rgbColors[3]);
    }
    return 1;
};
