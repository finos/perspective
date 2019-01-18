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

function docker(image = "emsdk") {
    console.log(`-- Creating ${image} docker image`);
    let cmd = "docker run --rm -it";
    if (process.env.PSP_CPU_COUNT) {
        cmd += ` --cpus="${parseInt(process.env.PSP_CPU_COUNT)}.0"`;
    }
    if (process.env.PSP_DEBUG) {
        cmd += ` -e PSP_DEBUG=1`;
    }
    cmd += ` -v $(pwd):/usr/src/app/cpp -w /usr/src/app/cpp/cppbuild perspective/${image}`;
    return cmd;
}

let flags = " -DPSP_WASM_BUILD=0 -DPSP_CPP_BUILD=1 -DPSP_CPP_BUILD_TESTS=1 -DPSP_CPP_BUILD_STRICT=1";

try {
    execute("mkdir -p cppbuild");

    let cmd;

    if (process.env.PSP_DOCKER) {
        cmd = " ";
    } else {
        cmd = "cd cppbuild && ";
    }

    cmd += ` cmake ../ ${flags}`;

    if (process.env.PSP_DEBUG) {
        cmd += ` -DCMAKE_BUILD_TYPE=debug`;
    }

    if (process.env.PSP_DOCKER) {
        execute(docker("cpp") + cmd);
        execute(docker("cpp") + " make -j${PSP_CPU_COUNT-8}");
    } else {
        execute(cmd);
        execute("cd cppbuild && make -j${PSP_CPU_COUNT-8}");
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
