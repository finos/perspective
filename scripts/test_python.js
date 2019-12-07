/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const {execute, docker, resolve, getarg} = require("./script_utils.js");

const VERBOSE = getarg("--verbose");
const IS_PY2 = getarg("--python2");

try {
    // dependencies need to be installed for test_python:table and
    // test_python:node
    let python = IS_PY2 ? "python2" : "python3";
    const image = IS_PY2 ? "python2" : "python";
    if (process.env.PSP_DOCKER) {
        execute`${docker(image)} bash -c "cd \
            python/perspective && TZ=UTC ${python} -m pytest \
            ${VERBOSE ? "-vv" : "-v"} perspective --cov=perspective"`;
    } else {
        const python_path = resolve`${__dirname}/../python/perspective`;
        execute`cd ${python_path} && TZ=UTC ${python} -m pytest \
            ${VERBOSE ? "-vv" : "-v"} perspective --cov=perspective`;
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
