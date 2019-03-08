/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export function getClosestDataPoint(data, xScale, yScale, xPos, yPos) {
    // data based on nested array data structure
    // top array is by crossValue, sub-array for each value.
    // e.g.
    // [ [{crossValue: "2000", key: "gold", mainValue: 130}, {crossValue: "2000", key: "silver", mainValue: 110} ],
    //   [{crossValue: "2002", key: "gold", mainValue: 10}, {crossValue: "2002", key: "silver", mainValue: 5} ] ]
    let match = [];

    const inRange = 0 < xPos && xPos < xScale.range()[1] && 0 < yPos && yPos < yScale.range()[0];
    const xDomain = xScale.domain();

    if (inRange) {
        const closestCrossValue = xDomain.reduce(
            (previousClosest, currentValue) => {
                const distanceFromX = Math.abs(xPos - xScale(currentValue));
                return previousClosest[1] == null || previousClosest[1] > distanceFromX ? [currentValue, distanceFromX] : previousClosest;
            },
            ["none", null]
        )[0];

        const mainValues = data.filter(e => e.length > 0 && e[0].crossValue === closestCrossValue);

        match = mainValues[0].reduce(
            (previousClosest, currentValue) => {
                const distanceFromY = Math.abs(yPos - yScale(currentValue.mainValue));
                return previousClosest[1] == null || previousClosest[1] > distanceFromY ? [currentValue, distanceFromY] : previousClosest;
            },
            [{}, null]
        );
    }

    return match;
}
