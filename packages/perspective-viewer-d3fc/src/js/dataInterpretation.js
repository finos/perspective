/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {isNullOrUndefined} from "util";

export function interpretLabels(config) {
    let labels = {
        mainLabel: null,
        crossLabel: null,
        splitLabel: null
    };

    labels.mainLabel = config.series.map(s => s.stack).filter((value, index, self) => self.indexOf(value) === index);
    labels.crossLabel = config.row_pivots.filter((value, index, self) => self.indexOf(value) === index);
    labels.splitLabel = config.col_pivots.filter((value, index, self) => self.indexOf(value) === index);

    console.log("labels:", labels);

    return labels;
}

export function interpretGroupBys(categories) {
    let flatmap = [];

    if (categories.length === 0) {
        return flatmap;
    }

    flattenAllArrays(flatmap, categories.map(subCat => flattenGroupBy(subCat, [])));
    return flatmap;
}

export function interpretDataset(isSplitBy, series, groupBys, hiddenElements) {
    if (isSplitBy) {
        let [dataset, stackedBarData, color] = interpretStackDataset(series, groupBys, hiddenElements);
        console.log("dataset: ", dataset);
        return [dataset, stackedBarData, color];
    }

    //simple array of data
    let dataset = series[0].data.map((mainValue, i) => ({
        mainValue: mainValue,
        crossValue: interpretCrossValue(i, groupBys)
    }));

    console.log("dataset: ", dataset);
    return [dataset, null, null];
}

function interpretStackDataset(series, groupBys, hiddenElements) {
    //Convert data to Stacked Bar Chart Format
    let keys = groupBys.length > 0 ? groupBys : [...Array(series[0].data.length)].map((_, i) => i);

    let stackedBarData = keys.map((group, i) => {
        let row = {group};
        series
            .filter(d => !hiddenElements.includes(d.name))
            .forEach(split => {
                row[split.name] = split.data[i] || 0;
            });
        return row;
    });

    let stack = d3.stack().keys(Object.keys(stackedBarData[0]).filter(r => r !== "group"));
    let dataset = stack(stackedBarData);
    let color = d3.scaleOrdinal(d3.schemeCategory10).domain(series.map(s => s.name));
    return [dataset, stackedBarData, color];
}

function interpretCrossValue(i, categories) {
    if (categories.length <= 0) {
        return i;
    }

    return categories[i];
}

function flattenGroupBy(category, parentCategories) {
    if (isNullOrUndefined(category.name)) {
        // We've reached the end of the nesting!
        return [...parentCategories, category];
    }

    let catName = category.name;
    let flatmap = category.categories.map(subCat => flattenGroupBy(subCat, [...parentCategories, catName]));
    return flatmap;
}

function flattenAllArrays(completeList, array) {
    if (!Array.isArray(array[0])) {
        completeList.push(array);
        return;
    }

    array.forEach(x => flattenAllArrays(completeList, x));
    return;
}
