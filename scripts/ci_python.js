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
    let build_cmd =
        "python3 -m pip install -r requirements.txt &&\
        python3 -m pip install pytest pytest-cov flake8 codecov pylantern numpy scipy pandas matplotlib pytz faker sphinx sphinx_markdown_builder &&\
        python3 setup.py build &&\
        python3 -m flake8 perspective && echo OK &&\
        python3 -m pytest -v perspective --cov=perspective &&\
        make -C ./docs html &&\
        codecov --token 0f25973b-091f-42fe-a469-95d1c6f7a957";

    if (process.env.PSP_DOCKER) {
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
