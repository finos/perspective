/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const fs = require("fs");
const path = require("path");

/**
 * Returns an `ArrayBuffer` containing the contents of a `.arrow` file
 * located at `arrow_path`.
 *
 * Because `fs.readFileSync` shares its underlying buffer
 * between calls to `readFileSync`, we need to get a slice
 * of the `ArrayBuffer` specifically at its byte offset.
 *
 * See https://github.com/nodejs/node/issues/11132 for more details.
 *
 * @param arrow_path {String} a path to an arrow file.
 * @returns {ArrayBuffer} an ArrayBuffer containing the arrow-serialized data.
 */
function load_arrow(arrow_path) {
    const data = fs.readFileSync(arrow_path);
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

const chunked_arrow = load_arrow(path.join(__dirname, "..", "arrow", "chunked.arrow"));
const test_null_arrow = load_arrow(path.join(__dirname, "..", "arrow", "test_null.arrow"));
const test_arrow = load_arrow(path.join(__dirname, "..", "arrow", "test.arrow"));
const partial_arrow = load_arrow(path.join(__dirname, "..", "arrow", "partial.arrow"));
const partial_missing_rows_arrow = load_arrow(path.join(__dirname, "..", "arrow", "partial_missing_rows.arrow"));
const date32_arrow = load_arrow(path.join(__dirname, "..", "arrow", "date32.arrow"));
const date64_arrow = load_arrow(path.join(__dirname, "..", "arrow", "date64.arrow"));

module.exports = {
    chunked_arrow,
    test_null_arrow,
    test_arrow,
    partial_arrow,
    partial_missing_rows_arrow,
    date32_arrow,
    date64_arrow
};
