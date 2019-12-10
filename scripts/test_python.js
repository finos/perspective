/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const {execute, docker, clean, resolve, getarg, bash, python_image} = require("./script_utils.js");

const VERBOSE = getarg("--verbose");
const IS_DOCKER = process.env.PSP_DOCKER;
const IS_PY2 = getarg("--python2"); 
const PYTHON = IS_PY2 ? "python2" : (getarg("--python38") ? "python3.8": "python3.7");
const IMAGE = python_image(getarg("--manylinux2010") ? "manylinux2010": 
                           getarg("--manylinux2014") ? "manylinux2014":
                           "", PYTHON);
const IS_FIX = getarg("--fix");

try {
    // dependencies need to be installed for test_python:table and
    // test_python:node
    if (process.env.PSP_DOCKER) {
        execute`${docker(IMAGE)} bash -c "cd \
            python/perspective && TZ=UTC ${PYTHON} -m pytest \
            ${VERBOSE ? "-vv" : "-v"} perspective --cov=perspective"`;
    } else {
        const python_path = resolve`${__dirname}/../python/perspective`;
        execute`cd ${python_path} && TZ=UTC ${PYTHON} -m pytest \
            ${VERBOSE ? "-vv" : "-v"} perspective --cov=perspective`;
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
