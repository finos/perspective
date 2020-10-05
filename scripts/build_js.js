/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const prettier = require("prettier");
const execSync = require("child_process").execSync;
const minimatch = require("minimatch");
const os = require("os");
const {bash, execute} = require("./script_utils.js");

/**
 * WASM Output Options
 */
const RUNTIMES = [
    {
        inputFile: "psp.async.js",
        inputWasmFile: "psp.async.wasm",
        format: false,
        packageName: "perspective"
    }
];

function compileRuntime({inputFile, inputWasmFile, format, packageName}) {
    console.log("-- Building %s", inputFile);

    const dir_name = process.env.PSP_DEBUG ? "debug" : "release";
    const base_dir = path.join(__dirname, "..", "packages", packageName, "build", dir_name);

    const output_dir = path.join(__dirname, "..", "packages", packageName);
    const build_dir = path.join(base_dir, "build");

    mkdirp.sync(path.join(output_dir, "dist", "obj"));
    mkdirp.sync(path.join(output_dir, "dist", "umd"));

    if (inputWasmFile) {
        console.log("-- Copying WASM file %s", inputWasmFile);
        fs.copyFileSync(path.join(build_dir, inputWasmFile), path.join(output_dir, "dist", "umd", inputWasmFile));
    }

    console.debug("-- Creating wrapped js runtime");
    const runtimeText = String(
        fs.readFileSync(path.join(build_dir, inputFile), {
            encoding: "utf8"
        })
    );

    let source = runtimeText;
    if (format) {
        console.debug("Formatting code");
        source = prettier.format(source, {
            printWidth: 200,
            tabWidth: 4,
            parser: "babylon"
        });
    }

    fs.writeFileSync(path.join(output_dir, "dist", "obj", inputFile), source);
}

function compileCPP(packageName) {
    const dir_name = process.env.PSP_DEBUG ? "debug" : "release";
    const base_dir = path.join(__dirname, "..", "packages", packageName, "build", dir_name);
    mkdirp.sync(base_dir);
    const cmd = bash`
        cd packages/${packageName}/build/${dir_name}/
        && emcmake cmake ../../../../cpp/perspective -DCMAKE_BUILD_TYPE=${dir_name}
        && emmake make -j${process.env.PSP_CPU_COUNT || os.cpus().length}
    `;
    execute`yarn emsdk-run bash -c "${cmd}"`;
}

function lerna() {
    execute`lerna run build --loglevel silent --scope="@finos/${process.env.PACKAGE}`;
}

try {
    if (!process.env.PACKAGE || minimatch("perspective", process.env.PACKAGE)) {
        try {
            execSync(`yarn emsdk-run command -v emcc`, {stdio: "ignore"});
        } catch (e) {
            console.log("-- Emscripten not detected, installing 1.39.13 ...");
            execute(`yarn emsdk-checkout`);
            execute(`yarn emsdk install 1.39.13`);
            execute(`yarn emsdk activate 1.39.13`);
        }
        compileCPP("perspective");
        RUNTIMES.map(compileRuntime);
    }
    lerna();
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
