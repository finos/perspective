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

const rimraf = require("rimraf");
const execute = cmd => execSync(cmd, {stdio: "inherit"});

const PY2 = args.indexOf("--python2") != -1;

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
    fs.mkdirp(resolve(__dirname, "..", "python", "perspective", "dist"));
    fs.copySync(resolve(__dirname, "..", "cpp", "perspective"), resolve(__dirname, "..", "python", "perspective", "dist"), {preserveTimestamps: true});
    fs.copySync(resolve(__dirname, "..", "cmake"), resolve(__dirname, "..", "python", "perspective", "dist", "cmake"), {preserveTimestamps: true});
    rimraf.sync(resolve(__dirname, "..", "python", "perspective", "dist", "obj"));

    let cmd;
    let python = PY2 ? "python2" : "python3";
    let image = PY2 ? "python2" : "python";
    let build_cmd = `${python} -m pip install -r requirements-dev.txt &&\
        ${python} setup.py build &&\
        ${python} -m flake8 perspective && echo OK &&\
        ${python} -m pytest -v perspective --cov=perspective &&\
        codecov --token 0f25973b-091f-42fe-a469-95d1c6f7a957`;
    if (!PY2) {
        // dont build docs/install check for python2
        build_cmd += `&&\
        make -C ./docs html &&\
        ${python} -m pip install -U pip &&\
        ${python} -m pip install . &&\
        ${python} setup.py sdist &&\
        ${python} -m pip install -U ./dist/perspective*`;
    }

    if (process.env.PSP_DOCKER) {
        cmd = `cd python/perspective && ${build_cmd}`;
        execute(`${docker("perspective", image)} bash -c "${cmd}"`);
    } else {
        const python_path = resolve(__dirname, "..", "python", "perspective");
        cmd = `cd ${python_path} && ${build_cmd}`;
        execute(cmd);
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
