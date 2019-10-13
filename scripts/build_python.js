/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const args = process.argv.slice(2);
const resolve = require("path").resolve;
const execSync = require("child_process").execSync;
const fs = require("fs-extra");
const mkdir = require("mkdirp");
const execute = cmd => execSync(cmd, {stdio: "inherit"});

const IS_DOCKER = process.env.PSP_DOCKER;
const VALID_TARGETS = ["node", "table"];
const HAS_TARGET = args.indexOf("--target") != -1;

function docker(target = "perspective", image = "python") {
    console.log(`-- Creating ${image} docker image`);
    let cmd = "docker run --rm -it";
    if (process.env.PSP_CPU_COUNT) {
        cmd += ` --cpus="${parseInt(process.env.PSP_CPU_COUNT)}.0"`;
    }
    cmd += ` -v $(pwd):/usr/src/app/python/${target} -w /usr/src/app/python/${target} perspective/${image}`;
    return cmd;
}

try {
    // copy C++ assets
    mkdir(resolve(__dirname, "..", "python", "perspective", "cmake"));
    fs.copySync(resolve(__dirname, "..", "cpp", "perspective"), resolve(__dirname, "..", "python", "perspective"));

    fs.copySync(resolve(__dirname, "..", "cmake"), resolve(__dirname, "..", "python", "perspective", "cmake"));

    let cmd;
    if (IS_DOCKER) {
        cmd = `cd python/perspective && python3 setup.py build`;
        execute(`${docker(target, "python")} bash -c "${cmd}"`);
    } else {
        const python_path = resolve(__dirname, "..", "python", "perspective");
        cmd = `cd ${python_path} && python3 setup.py build`;
        execute(cmd);
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
