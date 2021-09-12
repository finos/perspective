/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {execute, docker, getarg, python_image} = require("./script_utils.js");

const IS_PY2 = getarg("--python2");

let PYTHON = IS_PY2
    ? "python2"
    : getarg("--python38")
    ? "python3.8"
    : getarg("--python36")
    ? "python3.6"
    : "python3.7";
let IMAGE = "manylinux2010";

// defaults to 2010
let MANYLINUX_VERSION = "manylinux2010";

if (!IS_PY2) {
    // switch to 2014 only on python3
    (MANYLINUX_VERSION = getarg("--manylinux2010")
        ? "manylinux2010"
        : getarg("--manylinux2014")
        ? "manylinux2014"
        : "manylinux2010"),
        PYTHON;
}
IMAGE = python_image(MANYLINUX_VERSION, PYTHON);

try {
    // Open a shell in the Docker image used to build perspective-python.
    execute`${docker(IMAGE)} bash`;
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
