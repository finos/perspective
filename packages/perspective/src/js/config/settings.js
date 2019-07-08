/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

module.exports.default = {
    types: {
        string: {
            filter_operator: "==",
            aggregate: "count"
        },
        float: {
            filter_operator: "==",
            aggregate: "sum",
            format: {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        },
        integer: {
            filter_operator: "==",
            aggregate: "sum",
            format: {}
        },
        boolean: {
            filter_operator: "==",
            aggregate: "count"
        },
        datetime: {
            filter_operator: "==",
            aggregate: "count",
            format: {
                week: "numeric",
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric"
            }
        },
        date: {
            filter_operator: "==",
            aggregate: "count",
            format: {
                week: "numeric",
                year: "numeric",
                month: "numeric",
                day: "numeric"
            }
        }
    }
};
