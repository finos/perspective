/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export function getMapData(config) {
    const points = [];

    // Enumerate through supplied data
    config.data.forEach((row, i) => {
        // Exclude "total" rows that don't have all values
        const groupCount = row.__ROW_PATH__ ? row.__ROW_PATH__.length : 0;
        if (groupCount < config.group_by.length) return;

        // Get the group from the row path
        const group = row.__ROW_PATH__ ? row.__ROW_PATH__.join("|") : `${i}`;
        const rowPoints = {};

        // Split the rest of the row into a point for each category
        Object.keys(row)
            .filter((key) => key !== "__ROW_PATH__" && row[key] !== null)
            .forEach((key) => {
                const split = key.split("|");
                const category =
                    split.length > 1
                        ? split.slice(0, split.length - 1).join("|")
                        : "__default__";
                rowPoints[category] = rowPoints[category] || {group, row};
                rowPoints[category][split[split.length - 1]] = row[key];
            });

        // Add the points for this row to the data set
        Object.keys(rowPoints).forEach((key) => {
            const rowPoint = rowPoints[key];
            const cols = config.columns.map((c) => rowPoint[c]);
            points.push({
                cols,
                group: rowPoint.group,
                row: rowPoint.row,
                category: key,
            });
        });
    });

    return points;
}

export function getDataExtents(data) {
    let extents = null;
    data.forEach((point) => {
        if (!extents) {
            extents = point.cols.map((c) => ({min: c, max: c}));
        } else {
            extents = point.cols.map((c, i) =>
                c
                    ? {
                          min: Math.min(c, extents[i].min),
                          max: Math.max(c, extents[i].max),
                      }
                    : extents[i]
            );
        }
    });
    return extents;
}
