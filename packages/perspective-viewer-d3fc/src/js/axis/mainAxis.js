/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
import * as fc from "d3fc";

export const scale = settings => d3.scaleLinear();

export const domain = (settings, data) => {
    const accessors = (settings.mainValues.length > 1)
        ? settings.mainValues.map((m, i) => (d => d.reduce((max, v) => Math.max(max, v[1]), 0)))
        : [d => d[1]];
    
    return fc.extentLinear()
        .include([0])
        .pad([0, 0.5])
        .accessors(accessors)
        (data[data.length -1]);
    }

export const label = settings => settings.mainValues.map(v => v.name).join(', ');