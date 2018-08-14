/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * @constructor
 * @returns
 */
function Range() {}

/**
 * Creates a new {@link Range} and sets it's start and end rows.
 * @param start_row
 * @param end_row
 */
Range.create = function(start_row, end_row) {
    var range = new Range;
    range.reset(start_row, end_row);
    return range;
};

/**
 * Creates a new {@link Range} and sets it to the estimated range of the given `grid` + `padding`.
 * @param grid
 * @param padding
 */
Range.estimate = function(grid) {
    var range = new Range;
    range.estimatedGridRange(grid);
    return range;
};

/**
 * How many rows to pad the cache by.
 * @todo This should really be calculated from the parameters of the theme.
 */
Range.padding = 5;

/**
 * @constructor
 * @param {number} start_row
 * @param {number} end_row
 * @returns
 */
Range.prototype.reset = function(start_row, end_row) {
    this.start_row = start_row;
    this.end_row = end_row;
};

/**
 * Estimate the visible range of rows of a Hypergrid based on:
 * * Index of top visible row; and
 * * Number of rows that can fit in the canvas based at its current height
 *
 * This calculation assumes all rows have the default row height.
 * If any of the rows are taller than the default, this will be an overestimate, which is fine.
 * (If on the other hand the average row height of the visible rows is _less_ than the default,
 * this will be an underestimate, which would be a problem.)
 * @param {Hypergrid} grid
 * @returns
 */
Range.prototype.estimatedGridRange = function(grid) {
    var start_row = grid.renderer.getScrollTop(),
        row_count = Math.ceil(grid.canvas.height / grid.properties.defaultRowHeight),
        end_row = start_row + row_count + Range.padding;

    this.reset(start_row, end_row);
};

/**
 * @returns {boolean} Range is invalid.
 */
Range.prototype.isInvalid = function() {
    return Number.isNaN(this.start_row) || Number.isNaN(this.end_row);
};

/**
 * The estimated range is within the given range.
 * @param {number[]} [range]
 * @returns {boolean}
 */
Range.prototype.within = function(range) {
    return range instanceof Range &&
        range.start_row <= this.start_row &&
        this.end_row <= range.end_row;
};

/**
 * The estimated range contains the given range.
 * @param {number[]} [range]
 * @returns {boolean}
 */
Range.prototype.contains = function(range) {
    return range instanceof Range && range.within(this);
};


module.exports = Range;
