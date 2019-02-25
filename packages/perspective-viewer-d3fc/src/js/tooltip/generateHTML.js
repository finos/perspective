/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {select} from "d3";

export function generateHtmlDefault(tooltipDiv, data, settings) {
    console.log("data", data);
    console.log("settings", settings);

    // Add group data
    if (settings.crossValues.length) {
        const groups = data.crossValue.split ? data.crossValue.split("|") : [data.crossValue];
        tooltipDiv
            .select("#cross-values")
            .selectAll("li")
            .data(groups)
            .join("li")
            .each(eachValue(settings.crossValues));
    }

    const splitValues = getSplitValues(settings, data);
    // Add data value
    tooltipDiv
        .select("#split-values")
        .selectAll("li")
        .data(splitValues.values)
        .join("li")
        .each(eachValue(splitValues.labels));

    const dataValues = getDataValues(settings, data);

    // Add data value
    tooltipDiv
        .select("#data-values")
        .selectAll("li")
        .data(dataValues.values)
        .join("li")
        .each(eachValue(dataValues.labels));
}

export function generateHtmlForHeatmap(tooltipDiv, data, settings) {
    console.log("data", data);
    console.log("settings", settings);

    // Add cross value(s)
    if (settings.crossValues.length) {
        const groups = data.crossValue.split ? data.crossValue.split("|") : [data.crossValue];
        tooltipDiv
            .select("#cross-values")
            .selectAll("li")
            .data(groups)
            .join("li")
            .each(eachValue(settings.crossValues));
    }

    // Add main value(s)
    if (settings.splitValues.length) {
        const splits = data.mainValue.split ? data.mainValue.split("|") : [data.mainValue];
        tooltipDiv
            .select("#split-values")
            .selectAll("li")
            .data(splits)
            .join("li")
            .each(eachValue(settings.splitValues));
    }

    //const dataValues = getDataValues(settings, data);
    const dataValues = {
        values: [data.colorValue],
        labels: settings.mainValues
    };
    // Add data value
    tooltipDiv
        .select("#data-values")
        .selectAll("li")
        .data(dataValues.values)
        .join("li")
        .each(eachValue(dataValues.labels));
}

function getSplitValues(settings, data) {
    const splits = data.key ? data.key.split("|") : [];

    return {
        values: data.mainValues ? splits : splits.slice(0, -1),
        labels: settings.splitValues
    };
}

function getDataValues(settings, data) {
    if (data.mainValues) {
        return {
            values: data.mainValues,
            labels: settings.mainValues
        };
    } else {
        const splits = data.key.split("|");
        return {
            values: [data.mainValue - data.baseValue],
            labels: [{name: splits[splits.length - 1]}]
        };
    }
}

function eachValue(list) {
    return function(d, i) {
        select(this)
            .text(`${list[i].name}: `)
            .append("b")
            .text(formatNumber(d));
    };
}

function formatNumber(value) {
    return value.toLocaleString(undefined, {style: "decimal"});
}
