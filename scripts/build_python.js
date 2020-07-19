/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {execute, execute_throw, docker, clean, resolve, getarg, bash, python_image} = require("./script_utils.js");
const fs = require("fs-extra");
const rimraf = require("rimraf");
const tar = require("tar");

const IS_PY2 = getarg("--python2");

let PYTHON = IS_PY2 ? "python2" : getarg("--python38") ? "python3.8" : getarg("--python36") ? "python3.6" : "python3.7";
let IMAGE = "manylinux2010";
const IS_DOCKER = process.env.PSP_DOCKER;
const PSP_SYSTEM_TBB = process.env.PSP_SYSTEM_TBB;


if (IS_DOCKER) {
    // defaults to 2010
    let MANYLINUX_VERSION = "manylinux2010";
    if (!IS_PY2) {
        // switch to 2014 only on python3
        (MANYLINUX_VERSION = getarg("--manylinux2010") ? "manylinux2010" : getarg("--manylinux2014") ? "manylinux2014" : ""), PYTHON;
    }
    IMAGE = python_image(MANYLINUX_VERSION, PYTHON);
}

const IS_CI = getarg("--ci");
const IS_INSTALL = getarg("--install");

// Check that the `PYTHON` command is valid, else default to `python`.
try {
    execute_throw`${PYTHON} --version`;
} catch (e) {
    console.warn(`\`${PYTHON}\` not found - using \`python\` instead.`);
    PYTHON = "python";
}

try {
    const dist = resolve`${__dirname}/../python/perspective/dist`;
    const dist_src = resolve`${__dirname}/../python/perspective/dist/src`;
    const dist_third = resolve`${__dirname}/../python/perspective/dist/third`;
    const dist_third_boost = resolve`${__dirname}/../python/perspective/dist/third/boost`;
    const dist_third_date = resolve`${__dirname}/../python/perspective/dist/third/date`;
    const dist_third_hopscotch = resolve`${__dirname}/../python/perspective/dist/third/hopscotch`;
    const dist_third_ordered_map = resolve`${__dirname}/../python/perspective/dist/third/ordered-map`;
    const dist_third_pybind11 = resolve`${__dirname}/../python/perspective/dist/third/pybind11`;
    const dist_third_tbb = resolve`${__dirname}/../python/perspective/dist/third/tbb`;

    const third = resolve`${__dirname}/../cpp/perspective/third`;
    const third_boost = resolve`${__dirname}/../cpp/perspective/third/boost`;
    const third_date = resolve`${__dirname}/../cpp/perspective/third/date`;
    const third_hopscotch = resolve`${__dirname}/../cpp/perspective/third/hopscotch`;
    const third_ordered_map = resolve`${__dirname}/../cpp/perspective/third/ordered-map`;
    const third_pybind11 = resolve`${__dirname}/../cpp/perspective/third/pybind11`;
    const third_tbb = resolve`${__dirname}/../cpp/perspective/third/tbb`;

    const cpp_src = resolve`${__dirname}/../cpp/perspective/src`;
    const lic = resolve`${__dirname}/../LICENSE`;
    const dlic = resolve`${dist}/LICENSE`;
    const obj = resolve`${dist}/obj`;

    // clone third party deps
    console.log("Cloning third party dependencies");
    if (!fs.existsSync(third)) {
        fs.mkdirpSync(third);
    }

    if (!fs.existsSync(third_boost)) {
        console.log("Downloading boost");
        fs.mkdirpSync(third_boost);

        const tarball = resolve`${third_boost}/boost.tgz`;
        execute`curl -L https://dl.bintray.com/boostorg/release/1.71.0/source/boost_1_71_0.tar.gz -o ${tarball}`;
        console.log("Downloading boost...done!");

        console.log("Extracting boost");
        tar.x({sync: true, file: `${tarball}`, cwd: `${third_boost}`});
        rimraf.sync(`${tarball}`);
        console.log("Extracting boost...done!");
    }

    if (!fs.existsSync(third_date)) {
        console.log("Cloning date");
        execute`git clone https://github.com/HowardHinnant/date.git ${third_date}`;
        rimraf.sync(`${third_date}/.git`);
        console.log("Cloning date...done!");
    }

    if (!fs.existsSync(third_hopscotch)) {
        console.log("Cloning hopscotch");
        execute`git clone https://github.com/Tessil/hopscotch-map.git ${third_hopscotch}`;
        rimraf.sync(`${third_hopscotch}/.git`);
        console.log("Cloning hopscotch...done!");
    }

    if (!fs.existsSync(third_ordered_map)) {
        console.log("Cloning ordered-map");
        execute`git clone https://github.com/Tessil/ordered-map.git ${third_ordered_map}`;
        rimraf.sync(`${third_ordered_map}/.git`);
        console.log("Cloning ordered-map...done!");
    }

    if (!fs.existsSync(third_pybind11)) {
        console.log("Cloning pybind11");
        execute`git clone https://github.com/pybind/pybind11.git ${third_pybind11}`;
        rimraf.sync(`${third_pybind11}/.git`);
        console.log("Cloning pybind11...done!");
    }

    if (!fs.existsSync(third_tbb)) {
        console.log("Cloning tbb");
        execute`git clone  https://github.com/wjakob/tbb.git ${third_tbb}`;
        rimraf.sync(`${third_tbb}/.git`);
        console.log("Cloning tbb...done!");
    }
    console.log("Cloning third party dependencies...done!");

    fs.mkdirpSync(dist);
    fs.mkdirpSync(dist_src);
    fs.mkdirpSync(dist_third);

    console.log("Copying C++ to python dist");
    fs.copySync(cpp_src, dist_src, {preserveTimestamps: true});
    console.log("Copying C++ to python dist...done!");

    if (!fs.existsSync(dist_third_boost)) {
        console.log("Copying boost to python dist");
        fs.copySync(third_boost, dist_third_boost, {preserveTimestamps: true});
        console.log("Copying boost to python dist...done!");
    }

    if (!fs.existsSync(dist_third_date)) {
        console.log("Copying date to python dist");
        fs.copySync(third_date, dist_third_date, {preserveTimestamps: true});
        console.log("Copying date to python dist...done!");
    }

    if (!fs.existsSync(dist_third_hopscotch)) {
        console.log("Copying hopscotch to python dist");
        fs.copySync(third_hopscotch, dist_third_hopscotch, {preserveTimestamps: true});
        console.log("Copying hopscotch to python dist...done!");
    }

    if (!fs.existsSync(dist_third_ordered_map)) {
        console.log("Copying ordered-map to python dist");
        fs.copySync(third_ordered_map, dist_third_ordered_map, {preserveTimestamps: true});
        console.log("Copying ordered-map to python dist...done!");
    }

    if (!fs.existsSync(dist_third_pybind11)) {
        console.log("Copying pybind11 to python dist");
        fs.copySync(third_pybind11, dist_third_pybind11, {preserveTimestamps: true});
        console.log("Copying pybind11 to python dist...done!");
    }
    if (!fs.existsSync(dist_third_tbb)) {
        console.log("Copying tbb to python dist");
        fs.copySync(third_tbb, dist_third_tbb, {preserveTimestamps: true});
        console.log("Copying tbb to python dist...done!");
    }

    console.log("Copying LICENSE to python dist");
    fs.copySync(lic, dlic, {preserveTimestamps: true});
    console.log("Copying LICENSE to python dist...done!");
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
            ${PYTHON} setup.py build_ext --inplace && \
            ${PYTHON} -m flake8 perspective && echo OK && \
            ${PYTHON} -m pytest -vvv perspective \
            --ignore=perspective/tests/client \
            --junitxml=python_junit.xml --cov-report=xml --cov-branch \
            --cov=perspective && \
            ${PYTHON} -m pytest -vvv --noconftest perspective/tests/client`;
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
        cmd = bash`${PYTHON} setup.py build -v && ${PYTHON} setup.py build_ext --inplace`;
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
