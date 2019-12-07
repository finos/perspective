/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {execute, getarg, resolve, docker} = require("./script_utils.js");

const IS_FIX = getarg("--fix");

try {
    let cmd;
    let lint_cmd = `python3 -m flake8 perspective && echo "lint passed!"`;
    let fix_cmd = `autopep8 -v --in-place --aggressive --recursive --exclude \
        build --exclude tests . && echo "autopep8 formatting complete!"`;

    if (process.env.PSP_DOCKER) {
        cmd = `cd python/perspective && ${IS_FIX ? fix_cmd : lint_cmd}`;
        execute`${docker("python")} bash -c "${cmd}"`;
    } else {
        const python_path = resolve`${__dirname}/../python/perspective`;
        execute`cd ${python_path} && ${IS_FIX ? fix_cmd : lint_cmd}`;
    }
} catch (e) {
    console.log(e);
    process.exit(1);
}
