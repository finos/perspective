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
    const split = splitData(settings);
    return split.map(data => groupBarData(settings, data));
  }
  return [groupBarData(settings, settings.data)];
}

function splitData(settings) {
  const split = [];
  const getOrCreateSplitSeries = label => {
    const existing = split.find(s => s.label === label);
    if (existing)
      return existing.series;
    split.push({ label, series: [] });
    return split[split.length - 1].series;
  };

  const isSplitValue = k => k !== '__ROW_PATH__' && !settings.crossValues.find(v => v.name === k);

  settings.data.forEach(col => {
    const baseValues = {};

    Object.keys(col).forEach(key => {
      if (isSplitValue(key)) {
        const series = getOrCreateSplitSeries(key);
        const labels = key.split('|');
        const label = labels[labels.length - 1];
        let baseValue = baseValues[label] || 0;

        const dataPoint = {
          __BASE_VALUE__: baseValue
        };
        dataPoint[label] = baseValue + (col[key] || 0);
        baseValues[label] = dataPoint[label];

        Object.keys(col).forEach(k => {
          if (!isSplitValue(k)) dataPoint[k] = col[k];
        });

        series.push(dataPoint)
      }
    });
  });

  return split.map(s => s.series);
}

function groupBarData(settings, data) {
  const labelfn = labelFunction(settings);

  if (settings.mainValues.length > 1) {
    return settings.mainValues.map(mainValue => {
      const series = data.map(col => ([
        labelfn(col),
        col[mainValue.name],
        col.__BASE_VALUE__ || 0
      ]));
      series.key = mainValue.name;
      return series;
    });
  } else {
    return data.map(col => ([
      labelfn(col),
      col[settings.mainValues[0].name],
      col.__BASE_VALUE__ || 0
    ]));
  }
}
