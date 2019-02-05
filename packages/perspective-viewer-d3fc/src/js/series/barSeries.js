/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";

export function barSeries(settings) {
  const series = (settings.mainValues.length > 1)
    ? fc.seriesSvgGrouped(fc.seriesSvgBar())
    : fc.seriesSvgBar();

  return fc.autoBandwidth(series)
      .crossValue(d => d[0])
      .mainValue(d => d[1])
      .baseValue(d => d[2]);
}
