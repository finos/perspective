/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {execute, docker, clean, resolve, getarg, bash} = require("./script_utils.js");
const fs = require("fs-extra");

const IS_DOCKER = process.env.PSP_DOCKER;
const IS_PY2 = getarg("--python2");
const IS_CI = getarg("--ci");
const IS_INSTALL = getarg("--install");

try {
    const dist = resolve`${__dirname}/../python/perspective/dist`;
    const cpp = resolve`${__dirname}/../cpp/perspective`;
    const cmake = resolve`${__dirname}/../cmake`;
    const dcmake = resolve`${dist}/cmake`;
    const obj = resolve`${dist}/obj`;

    fs.mkdirpSync(dist);
    fs.copySync(cpp, dist, {preserveTimestamps: true});
    fs.copySync(cmake, dcmake, {preserveTimestamps: true});
    clean(obj);

    const python = IS_PY2 ? "python2" : "python3";
    const image = IS_PY2 ? "python2" : "python";
    let cmd;
    if (IS_CI) {
        cmd = bash`${python} -m pip install -r requirements-dev.txt && \
            ${python} setup.py build && \
            ${python} -m flake8 perspective && echo OK && \
            ${python} -m pytest -v perspective --cov=perspective`;
    } else if (IS_INSTALL) {
        cmd = `${python} -m pip install . --no-clean`;
    } else {
        cmd = bash`${python} setup.py build -v`;
    }

    if (IS_DOCKER) {
        execute`${docker(image)} bash -c "cd python/perspective && \
            ${cmd} "`;
    } else {
        const python_path = resolve`${__dirname}/../python/perspective`;
        execute`cd ${python_path} && ${cmd}`;
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
