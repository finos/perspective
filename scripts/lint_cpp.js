/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const execSync = require("child_process").execSync;
const path = require("path");
const minimatch = require("minimatch");

const execute = cmd => execSync(cmd, {stdio: "inherit"});

function docker(image = "emsdk") {
    console.log("-- Creating emsdk docker image");
    let cmd = "docker run --rm";
    if (process.env.PSP_CPU_COUNT) {
        cmd += ` --cpus="${parseInt(process.env.PSP_CPU_COUNT)}.0"`;
    }
    cmd += ` -v $(pwd):/src -e PACKAGE=${process.env.PACKAGE} perspective/${image}`;
    return cmd;
}

function lint(dir) {
    if (process.env.PSP_DOCKER) {
        execute(docker() + ` bash -c "diff -u <(cat ${dir}/*) <(clang-format -style=file ${dir}/*)"`);
    } else {
        execute(`bash -c "diff -u <(cat ${dir}/*) <(clang-format -style=file ${dir}/*)"`);
    }
}

try {
    if (!process.env.PACKAGE || minimatch("perspective", process.env.PACKAGE)) {
        lint(path.join(".", "cpp", "perspective", "src", "cpp"));
        lint(path.join(".", "cpp", "perspective", "src", "include", "perspective"));
    }
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
