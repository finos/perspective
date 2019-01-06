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
    cmd += ` -v $(pwd):/usr/src/app/cpp -w /usr/src/app/cpp/cppbuild perspective/${image}`;
    return cmd;
}

try {
    execute("mkdir -p cppbuild");
    if (process.env.PSP_DOCKER) {
        execute(docker("cpp") + " cmake ../ -DPSP_WASM_BUILD=0 -DPSP_CPP_BUILD=1 -DPSP_CPP_BUILD_TESTS=1");
        execute(docker("cpp") + " make -j${PSP_CPU_COUNT-8}");
    } else {
        execute("cmake ../ -DPSP_WASM_BUILD=0 -DPSP_CPP_BUILD=1 -DPSP_CPP_BUILD_TESTS=1");
        execute("make -j${PSP_CPU_COUNT-8}");
    }
} catch (e) {
    process.exit(1);
}
