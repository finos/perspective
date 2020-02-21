/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {execute, docker, clean, resolve, getarg, bash, python_image} = require("./script_utils.js");
const fs = require("fs-extra");

const IS_DOCKER = process.env.PSP_DOCKER;
const IS_PY2 = getarg("--python2");
const PYTHON = IS_PY2 ? "python2" : getarg("--python38") ? "python3.8" : "python3.7";
const IMAGE = IS_DOCKER ? python_image(getarg("--manylinux2010") ? "manylinux2010" : getarg("--manylinux2014") ? "manylinux2014" : "", PYTHON) : "";

const IS_CI = getarg("--ci");
const IS_INSTALL = getarg("--install");

try {
    const dist = resolve`${__dirname}/../python/perspective/dist`;
    const cpp = resolve`${__dirname}/../cpp/perspective`;
    const lic = resolve`${__dirname}/../LICENSE`;
    const cmake = resolve`${__dirname}/../cmake`;
    const dcmake = resolve`${dist}/cmake`;
    const dlic = resolve`${dist}/LICENSE`;
    const obj = resolve`${dist}/obj`;

    fs.mkdirpSync(dist);
    fs.copySync(cpp, dist, {preserveTimestamps: true});
    fs.copySync(lic, dlic, {preserveTimestamps: true});
    fs.copySync(cmake, dcmake, {preserveTimestamps: true});
    clean(obj);

    let cmd;
    if (IS_CI) {
        if (IS_PY2)
            // shutil_which is required in setup.py
            cmd = bash`${PYTHON} -m pip install backports.shutil_which &&`;
        else cmd = bash``;

        cmd =
            cmd +
            `${PYTHON} -m pip install -e .[dev] && \
            ${PYTHON} -m flake8 perspective && echo OK && \
            ${PYTHON} -m pytest -vvv --noconftest perspective/tests/client && \
            ${PYTHON} -m pytest -vvv perspective \
            --ignore=perspective/tests/client \
            --junitxml=python_junit.xml --cov-report=xml --cov-branch \
            --cov=perspective`;
        if (IMAGE == "python") {
            cmd =
                cmd +
                `&& \
                ${PYTHON} setup.py sdist && \
                ${PYTHON} -m pip install -U dist/*.tar.gz`;
        }
    } else if (IS_INSTALL) {
        cmd = `${PYTHON} -m pip install . --no-clean`;
    } else {
        cmd = bash`${PYTHON} setup.py build -v`;
    }

    if (IS_DOCKER) {
        execute`${docker(IMAGE)} bash -c "cd python/perspective && \
            ${cmd} "`;
    } else {
        const python_path = resolve`${__dirname}/../python/perspective`;
        execute`cd ${python_path} && ${cmd}`;
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
