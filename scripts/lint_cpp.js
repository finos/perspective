/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const minimatch = require("minimatch");

const {execute, docker, path} = require("./script_utils.js");

function lint(dir) {
    if (process.env.PSP_DOCKER) {
        execute`${docker()} bash -c "diff -u <(cat ${dir}/*) <(clang-format -style=file ${dir}/*)"`;
    } else {
        execute`bash -c "diff -u <(cat ${dir}/*) <(clang-format -style=file ${dir}/*)"`;
    }
}

try {
    if (!process.env.PACKAGE || minimatch("perspective", process.env.PACKAGE)) {
        lint(path`./cpp/perspective/src/cpp`);
        lint(path`./cpp/perspective/src/include/perspective`);
    }
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
