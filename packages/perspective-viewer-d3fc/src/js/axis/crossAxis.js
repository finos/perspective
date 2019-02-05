/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";

export const scale = settings => d3.scaleBand();

export const domain = settings => settings.data.map(labelFunction(settings));

export const labelFunction = settings =>
  (d => settings.crossValues.map(v => d[v.name]).join(','));

export const label = settings => settings.crossValues.map(v => v.name).join(', ');
