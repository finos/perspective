/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import { labelFunction } from '../axis/crossAxis';

export function groupAndStackData(settings) {
  if (settings.splitValues.length > 0) {
    const split = splitIntoMultiSeries(settings);
    return split.map(data => groupBarData(settings, data));
  }
  return [groupBarData(settings, settings.data)];
}

function splitIntoMultiSeries(settings) {
  // Create a series for each "split" value, each one containing all the "aggregate" values,
  // and "base" values to offset it from the previous series
  const multiSeries = {};

  settings.data.forEach(col => {
    // Split this column by "split", including multiple aggregates for each
    const baseValues = {};
    const split = {};

    // Keys are of the form "split1|split2|aggregate"
    Object.keys(col)
      .filter(key => key !== '__ROW_PATH__')
      .forEach(key => {
        const labels = key.split('|');
        // label="aggregate"
        const label = labels[labels.length - 1];
        // splitName="split1|split2"
        const splitName = labels.slice(0, labels.length - 1).join('|');

        // Combine aggregate values for the same split in a single object
        const splitValues = split[splitName] = (split[splitName] || { __ROW_PATH__: col.__ROW_PATH__ });
        const baseValue = baseValues[label] || 0;

        // Assign the values for this split/aggregate
        splitValues[label] = baseValue + (col[key] || 0);
        splitValues[`__BASE_VALUE__${label}`] = baseValue;
        splitValues.__KEY__ = splitName;

        baseValues[label] = splitValues[label];
      });

      // Push each object onto the correct series
      Object.keys(split).forEach(splitName => {
        const series = multiSeries[splitName] = (multiSeries[splitName] || []);
        series.push(split[splitName]);
      });
  });

  return Object.keys(multiSeries).map(k => multiSeries[k]);
}

function seriesDataFn(settings, data) {
  const labelfn = labelFunction(settings);

  return mainValue => {
    const series = data
      .filter(col => !!col[mainValue.name])
      .map(col => ({
        crossValue: labelfn(col),
        mainValue: col[mainValue.name],
        baseValue: col[`__BASE_VALUE__${mainValue.name}`] || 0,
        key: col.__KEY__ ? `${col.__KEY__}|${mainValue.name}` : mainValue.name
      }));
    series.key = mainValue.name;
    return series;
  };
}

function groupBarData(settings, data) {
  // Split data into a group for each aggregate (mainValue)
  const seriesFn = seriesDataFn(settings, data);

  if (settings.mainValues.length > 1) {
    return settings.mainValues.map(seriesFn);
  } else {
    return seriesFn(settings.mainValues[0]);
  }
}
