/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const execSync = require("child_process").execSync;

const execute = cmd => execSync(cmd, {stdio: "inherit"});

const args = process.argv.slice(2);

function docker() {
    console.log("Creating puppeteer docker image");
    let cmd = "docker run -it --rm --shm-size=2g -u root -e PACKAGE=${PACKAGE} -v $(pwd):/src -w /src";
    if (process.env.PSP_CPU_COUNT) {
        cmd += ` --cpus="${parseInt(process.env.PSP_CPU_COUNT)}.0"`;
    }
    cmd += " perspective/puppeteer node packages/perspective/bench/js/bench.js";
    return cmd;
}

try {
    execute(docker());
} catch (e) {
    process.exit(1);
}
