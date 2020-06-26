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
const IS_MACOS = getarg("--macos");
const IS_PY2 = getarg("--python2");
const PYTHON = IS_PY2 ? "python2" : getarg("--python38") ? "python3.8" : getarg("--python36") ? "python3.6" : "python3.7";

let IMAGE = "manylinux2014";
let MANYLINUX_VERSION;

if (IS_DOCKER) {
    // defaults to 2010
    MANYLINUX_VERSION = "manylinux2010";
    if (!IS_PY2) {
        // switch to 2014 only on python3
        MANYLINUX_VERSION = getarg("--manylinux2010") ? "manylinux2010" : getarg("--manylinux2014") ? "manylinux2014" : "manylinux2014";
    }
    IMAGE = python_image(MANYLINUX_VERSION, PYTHON);
}

/**
 * Using Perspective's docker images, create a wheel built for the image
 * architecture and output it to the local filesystem. A thin wrapper around
 * `bdist_wheel`, except it also automatically calls `auditwheel` (Linux) or
 * `delocate` on Mac.
 */
try {
    console.log("Copying assets to `dist` folder");
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

    if (IS_PY2) {
        // shutil_which is required in setup.py
        cmd = bash`${PYTHON} -m pip install backports.shutil_which && `;
    } else {
        cmd = bash``;
    }

    // Create a wheel
    cmd += `${PYTHON} setup.py bdist_wheel`;

    if (MANYLINUX_VERSION && !IS_PY2) {
        // Use auditwheel on Linux - repaired wheels are in
        // `python/perspective/wheelhouse`.
        cmd += `&& ${PYTHON} -m auditwheel -v show ./dist/*.whl && ${PYTHON} -m auditwheel -v repair -L .lib ./dist/*.whl`;
    } else if (IS_MACOS) {
        cmd += " && mkdir -p ./wheelhouse && cp ./dist/*.whl ./wheelhouse";
    }

    // TODO: MacOS wheel processed with delocate segfaults on
    // `import perspective`.

    if (IS_DOCKER) {
        console.log(`Building wheel for \`perspective-python\` using image \`${IMAGE}\` in Docker`);
        execute`${docker(IMAGE)} bash -c "cd python/perspective && ${cmd}"`;
    } else {
        console.log(`Building wheel for \`perspective-python\``);
        const python_path = resolve`${__dirname}/../python/perspective`;
        execute`cd ${python_path} && ${cmd}`;
    }
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
