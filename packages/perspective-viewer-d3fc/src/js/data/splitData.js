/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {labelFunction} from "../axis/axisLabel";

export function splitData(settings, data) {
    const labelfn = labelFunction(settings);

    return data.map((col, i) => {
        return Object.keys(col)
            .filter((key) => key !== "__ROW_PATH__")
            .map((key) => ({
                key,
                crossValue: labelfn(col, i),
                mainValue: col[key],
                row: col,
            }));
    });
}
