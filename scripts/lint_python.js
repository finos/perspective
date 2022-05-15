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
    python_version,
    python_image,
    manylinux_version,
} = require("./script_utils.js");

const IS_DOCKER = process.env.PSP_DOCKER;
let PYTHON = python_version();
let IMAGE = "manylinux2014";

if (IS_DOCKER) {
    let MANYLINUX_VERSION = manylinux_version();
    IMAGE = python_image(MANYLINUX_VERSION, PYTHON);
}

const CMD_TYPE = getarg("--fix")
    ? "fix"
    : getarg("--check-manifest")
    ? "manifest"
    : "lint";

// Check that the `PYTHON` command is valid, else default to `python`.
try {
    execute_throw`${PYTHON} --version`;
} catch (e) {
    console.warn(`\`${PYTHON}\` not found - using \`python\` instead.`);
    PYTHON = "python";
}

try {
    let cmd;
    let lint_cmd = "flake8 perspective bench setup.py";
    let fix_cmd = "black perspective bench setup.py --exclude tests";
    let check_cmd = "check-manifest";

    if (CMD_TYPE === "fix") {
        cmd = fix_cmd;
    } else if (CMD_TYPE === "manifest") {
        cmd = check_cmd;
    } else {
        cmd = lint_cmd;
    }

    if (process.env.PSP_DOCKER) {
        cmd = `cd python/perspective && ${cmd}`;
        execute`${docker(IMAGE)} bash -c "${cmd}"`;
    } else {
        const python_path = resolve`${__dirname}/../python/perspective`;
        execute`cd ${python_path} && ${cmd}`;
    }
} catch (e) {
    console.log(e);
    process.exit(1);
}
