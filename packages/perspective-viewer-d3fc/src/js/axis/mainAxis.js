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
    // For multiple main values, we need to check the maximum and minimum (+ve and -ve)
    const mainValueAccessors = aggFn => settings.mainValues.map((m, i) => (d => d.reduce((max, v) => aggFn(max, v.mainValue), 0)));

    const accessors = (settings.mainValues.length > 1)
        ? mainValueAccessors(Math.max).concat(mainValueAccessors(Math.min))
        : [d => d.mainValue];
    
    return fc.extentLinear()
        .include([0])
        .pad([0, 0.1])
        .accessors(accessors)
        (data.flat());
    }

export const label = settings => settings.mainValues.map(v => v.name).join(', ');