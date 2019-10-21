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
const rimraf = require("rimraf");
const execute = cmd => execSync(cmd, {stdio: "inherit"});

const VALID_TARGETS = ["node", "table"];

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
    // copy C++ assets
    rimraf.sync(resolve(__dirname, "..", "python", "perspective", "obj")); // unused obj folder
    fs.copySync(resolve(__dirname, "..", "cpp", "perspective"),
        resolve(__dirname, "..", "python", "perspective"),
        {overwrite: true});

    mkdir(resolve(__dirname, "..", "python", "perspective", "cmake"));
    fs.copySync(resolve(__dirname, "..", "cmake"),
        resolve(__dirname, "..", "python", "perspective", "cmake"),
        {overwrite: true});


    let cmd;
    let build_cmd =
        "python3 -m pip install -r requirements-dev.txt &&\
        python3 setup.py build &&\
        python3 -m flake8 perspective && echo OK &&\
        python3 -m pytest -v perspective --cov=perspective &&\
        make -C ./docs html &&\
        python3 -m pip install . &&\
        codecov --token 0f25973b-091f-42fe-a469-95d1c6f7a957 &&\
        python3 setup.py sdist &&\
        cd dist/ && python3 -m pip install ./perspective*";

    if (process.env.PSP_DOCKER) {
        cmd = `cd python/perspective && ${build_cmd}`;
        execute(`${docker("perspective", "python")} bash -c "${cmd}"`);
    } else {
        const python_path = resolve(__dirname, "..", "python", "perspective");
        cmd = `cd ${python_path} && ${build_cmd}`;
        execute(cmd);
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
