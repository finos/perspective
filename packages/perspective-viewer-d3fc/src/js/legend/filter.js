/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {groupFromKey} from "../series/seriesKey";

export function filterData(settings, data) {
    const useData = data || settings.data;
    if (settings.hideKeys && settings.hideKeys.length > 0) {
        return useData.map((col) => {
            const clone = {...col};
            settings.hideKeys.forEach((k) => {
                delete clone[k];
            });
            return clone;
        });
    }
    return useData;
}

export function filterDataByGroup(settings, data) {
    const useData = data || settings.data;
    if (settings.hideKeys && settings.hideKeys.length > 0) {
        return useData.map((col) => {
            const clone = {};
            Object.keys(col).map((key) => {
                if (!settings.hideKeys.includes(groupFromKey(key))) {
                    clone[key] = col[key];
                }
            });
            return clone;
        });
    }
    return useData;
}
