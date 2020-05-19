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
const IS_PY2 = getarg("--python2");
const PYTHON = IS_PY2 ? "python2" : getarg("--python38") ? "python3.8" : "python3.7";
const IMAGE = python_image(getarg("--manylinux2010") ? "manylinux2010" : getarg("--manylinux2014") ? "manylinux2014" : "", PYTHON);

/**
 * Using Perspective's docker images, create a wheel built for the image
 * architecture and output it to the local filesystem.
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
        cmd = bash`${PYTHON} -m pip install backports.shutil_which &&`;
    } else {
        cmd = bash``;
    }

    // Create a wheel
    cmd = cmd + `${PYTHON} setup.py bdist_wheel`;
    console.log(`Building wheel for \`perspective-python\` using ${IMAGE} in Docker`);
    execute`${docker(IMAGE)} bash -c "cd python/perspective && ${cmd} && auditwheel -v show ./dist/*.whl && auditwheel -v repair ./dist/*.whl"`;
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
