/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {
    execute,
    docker,
    python_image,
    python_version,
    manylinux_version,
} = require("./script_utils.js");

let PYTHON = python_version();
let IMAGE = "manylinux2014";
let MANYLINUX_VERSION = manylinux_version();
IMAGE = python_image(MANYLINUX_VERSION, PYTHON);

try {
    // Open a shell in the Docker image used to build perspective-python.
    execute`${docker(IMAGE)} bash`;
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
