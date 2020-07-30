/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {labelFunction} from "../axis/axisLabel";

export function xySplitData(settings, data) {
    const labelfn = labelFunction(settings);

    return data.map((col, i) => {
        const cols = Object.keys(col).filter(key => key !== "__ROW_PATH__");
        const row = new Array(cols.length / 2);
        for (let i = 0; i < cols.length / 2; i++) {
            row[i] = {
                key: cols[i * 2],
                crossValue: col[cols[i * 2]],
                mainValue: col[cols[i * 2 + 1]],
                row: col
            };
        }
        return row;
    });
}
