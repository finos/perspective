/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";

const SI_MIN = 100000;

export default (d) =>
    Math.abs(d) >= SI_MIN
        ? d3.format(".3s")(d)
        : Number.isInteger(d)
        ? d3.format(",.0f")(d)
        : d3.format(",.2f")(d);
