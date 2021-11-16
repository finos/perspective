/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {select} from "d3";
import {getGroupValues, getSplitValues, getDataValues} from "./selectionData";
import {get_type_config} from "../../../../perspective/src/js/config";

export function generateHtml(tooltipDiv, data, settings) {
    const tooltipValues = getGroupValues(data, settings)
        .concat(getSplitValues(data, settings))
        .concat(getDataValues(data, settings));
    addDataValues(tooltipDiv, tooltipValues);
}

function addDataValues(tooltipDiv, values) {
    tooltipDiv
        .select("#tooltip-values")
        .selectAll("li")
        .data(values)
        .join("li")
        .each(function (d) {
            select(this)
                .text(`${d.name}: `)
                .append("b")
                .text(formatNumber(d.value));
        });
}

const formatNumber = (value) =>
    value === null
        ? "-"
        : value.toLocaleString(undefined, {
              style: "decimal",
              minimumFractionDigits: get_type_config("float").precision,
              maximumFractionDigits: get_type_config("float").precision,
          });
