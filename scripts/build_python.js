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
const execute = cmd => execSync(cmd, {stdio: "inherit"});

const IS_DOCKER = process.env.PSP_DOCKER;
const VALID_TARGETS = ["node", "table"];
const HAS_TARGET = args.indexOf("--target") != -1;

function docker(target = "perspective", image = "emsdk") {
    console.log(`-- Creating ${image} docker image`);
    let cmd = "docker run --rm -it";
    if (process.env.PSP_CPU_COUNT) {
        cmd += ` --cpus="${parseInt(process.env.PSP_CPU_COUNT)}.0"`;
    }
    cmd += ` -v $(pwd):/usr/src/app/python/${target} -w /usr/src/app/python/${target} perspective/${image}`;
    return cmd;
}

try {
    // install dependencies
    let target = "perspective";

    if (HAS_TARGET) {
        const new_target = args[args.indexOf("--target") + 1];
        if (VALID_TARGETS.includes(new_target)) {
            target = new_target;
        }
    }

    let cmd;
    let pip_target = "";

    if (IS_DOCKER) {
        pip_target = " --target=`pwd`";
    }

    let build_cmd = `python3 setup.py build`;

    if (IS_DOCKER) {
        cmd = `cd python/${target} && ${build_cmd}`;
        execute(`${docker(target, "python")} bash -c "${cmd}"`);
    } else {
        const python_path = resolve(__dirname, "..", "python", target);
        cmd = `cd ${python_path} && ${build_cmd}`;
        execute(cmd);
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
