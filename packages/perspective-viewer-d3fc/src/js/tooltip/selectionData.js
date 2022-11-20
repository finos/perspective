/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import { get_type_config } from "../../../../perspective/src/js/config";

export function toValue(type, value) {
    switch (type) {
        case "date":
        case "datetime":
            return value instanceof Date
                ? value
                : new Date(parseInt(value)).toLocaleString(
                      [],
                      get_type_config(type).format
                  );
        case "integer":
            return parseInt(value, 10);
        case "float":
            return parseFloat(value);
    }
    return value;
}

export function getGroupValues(data, settings) {
    if (settings.crossValues.length === 0) return [];
    if (data.crossValue.length === 0) return [];
    const groupValues = (data.crossValue.split
        ? data.crossValue.split("|")
        : [data.crossValue]) || [data.key];
    return groupValues.map((cross, i) => ({
        name: settings.crossValues[i].name,
        value: toValue(settings.crossValues[i].type, cross),
    }));
}

export function getSplitValues(data, settings) {
    if (settings.splitValues.length === 0) return [];
    const splitValues = data.key
        ? data.key.split("|")
        : data.mainValue.split
        ? data.mainValue.split("|")
        : [data.mainValue];
    return settings.splitValues.map((split, i) => ({
        name: split.name,
        value: toValue(split.type, splitValues[i]),
    }));
}

export function getDataValues(data, settings) {
    if (settings.mainValues.length > 1) {
        if (data.mainValue) {
            return [
                {
                    name: data.key,
                    value: data.mainValue - (data.baseValue || 0),
                },
            ];
        }
        return settings.mainValues.map((main, i) => ({
            name: main.name,
            value: toValue(main.type, data.mainValues[i]),
        }));
    }
    return [
        {
            name: settings.mainValues[0].name,
            value: toValue(
                settings.mainValues[0].type,
                data.colorValue ||
                    data.mainValue - data.baseValue ||
                    data.mainValue ||
                    data.mainValues
            ),
        },
    ];
}
