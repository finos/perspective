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
    execute_throw,
    docker,
    resolve,
    getarg,
    bash,
    python_version,
    python_image,
    manylinux_version,
    copy_files_to_python_folder,
} = require("./script_utils.js");

let PYTHON = python_version();

let IMAGE = "manylinux2014";
const IS_DOCKER = process.env.PSP_DOCKER;

if (IS_DOCKER) {
    let MANYLINUX_VERSION = manylinux_version();
    IMAGE = python_image(MANYLINUX_VERSION, PYTHON);
}

const IS_CI = getarg("--ci");
// Use symlinks for C++ source rather than copying - handy for development
const LINK_CPP = getarg("--link-cpp");
const SETUP_ONLY = getarg("--setup-only");
const IS_INSTALL = getarg("--install");
const IS_PYODIDE = getarg("--pyodide");

// Check that the `PYTHON` command is valid, else default to `python`.
try {
    execute_throw`${PYTHON} --version`;
} catch (e) {
    console.warn(`\`${PYTHON}\` not found - using \`python\` instead.`);
    PYTHON = "python";
}
try {
    copy_files_to_python_folder(LINK_CPP);

    if (SETUP_ONLY) {
        // don't execute any build steps, just copy
        // the C++ assets into the python folder
        process.exit(0);
    }

    let cmd;
    if (IS_CI) {
        cmd = bash`${PYTHON} -m pip install -e .[dev] --no-clean`;
    } else if (IS_INSTALL) {
        cmd = `${PYTHON} -m pip install .`;
    } else if (IS_PYODIDE) {
        cmd = `pyodide build . --exports=pyinit`;
    } else {
        cmd = bash`${PYTHON} setup.py build -v`;
    }

    if (IS_DOCKER) {
        execute`${docker(IMAGE)} bash -c "cd python/perspective && ${cmd} "`;
    } else {
        const python_path = resolve`${__dirname}/../python/perspective`;
        execute`cd ${python_path} && ${cmd}`;
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
