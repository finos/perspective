/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export const findBestFromData = (array, valueFn, compareFn = Math.min) => {
    const findBestFromArray = (array) => {
        return array.reduce((best, v) => {
            const thisValue = findBestFromItem(v, valueFn);
            return thisValue &&
                (!best ||
                    compareFn(best.value, thisValue.value) === thisValue.value)
                ? thisValue
                : best;
        }, null);
    };
    const findBestFromItem = (item) => {
        if (Array.isArray(item)) {
            return findBestFromArray(item, valueFn);
        }
        const value = valueFn(item);
        return value !== null
            ? {
                  item,
                  value,
              }
            : null;
    };

    const bestItem = findBestFromArray(array, valueFn);
    return bestItem ? bestItem.item : null;
};
