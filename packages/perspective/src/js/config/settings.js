/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * The default settings which populate `perspective.config.js`.
 */
module.exports.default = {
    /**
     * `types` are the type-specific configuration options.  Each key is the
     * name of a perspective type; their values are configuration objects for
     * that type.
     */
    types: {
        float: {
            /**
             * Which filter operator should be the default when a column of this
             * type is pivotted.
             */
            filter_operator: "==",

            /**
             * Which aggregate should be the default when a column of this type
             * is pivotted.
             */
            aggregate: "sum",

            /**
             * The format object for this type.  Can be either an
             * `toLocaleString()` `options` object for this type (or supertype),
             * or a function which returns the formatted string for this type.
             */
            format: {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            },
        },
        string: {
            filter_operator: "==",
            aggregate: "count",
        },
        integer: {
            filter_operator: "==",
            aggregate: "sum",
            format: {},
        },
        boolean: {
            filter_operator: "==",
            aggregate: "count",
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
                second: "numeric",
            },
            null_value: -1,
        },
        date: {
            filter_operator: "==",
            aggregate: "count",
            format: {
                week: "numeric",
                year: "numeric",
                month: "numeric",
                day: "numeric",
            },
            null_value: -1,
        },
    },
};
