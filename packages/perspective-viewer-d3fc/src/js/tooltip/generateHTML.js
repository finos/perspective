/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {select} from "d3";

export function generateHtml(tooltipDiv, data, settings) {
    let tooltipValues = getGroupValues(data, settings);
    tooltipValues = tooltipValues.concat(getSplitValues(data, settings));
    tooltipValues = tooltipValues.concat(getDataValues(data, settings));
    addDataValues(tooltipDiv, tooltipValues);
}

function getGroupValues(data, settings) {
    if (settings.crossValues.length === 0) return [];
    const groupValues = data.crossValue.split("|");
    return settings.crossValues.map((cross, i) => ({name: cross.name, value: groupValues[i]}));
}

function getSplitValues(data, settings) {
    if (settings.splitValues.length === 0) return [];
    const splitValues = data.key ? data.key.split("|").slice(0, -1) : data.mainValue.split("|");
    return settings.splitValues.map((split, i) => ({name: split.name, value: splitValues[i]}));
}

function getDataValues(data, settings) {
    if (settings.mainValues.length > 1) {
        return settings.mainValues.map((main, i) => ({name: main.name, value: data.mainValues[i]}));
    }
    return {
        name: settings.mainValues[0].name,
        value: data.colorValue || data.mainValue - data.baseValue
    };
}

function addDataValues(tooltipDiv, values) {
    tooltipDiv
        .select("#tooltip-values")
        .selectAll("li")
        .data(values)
        .join("li")
        .each(function(d) {
            select(this)
                .text(`${d.name}: `)
                .append("b")
                .text(formatNumber(d.value));
        });
}

const formatNumber = value => value.toLocaleString(undefined, {style: "decimal"});
