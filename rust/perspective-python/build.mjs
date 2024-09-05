// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import * as fs from "node:fs";
import pkg from "./package.json" assert { type: "json" };
import sh from "../../tools/perspective-scripts/sh.mjs";
import * as url from "url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);

let flags = "--release";
if (!!process.env.PSP_DEBUG) {
    flags = "";
}

const python_version = process.env.PSP_PYTHON_VERSION || "3.12";
const is_pyodide = !!process.env.PSP_PYODIDE;

const version = pkg.version.replace(/-(rc|alpha|beta)\.\d+/, (x) =>
    x.replace("-", "").replace(".", "")
);

fs.mkdirSync(`./perspective_python-${version}.data`, { recursive: true });

const cwd = process.cwd();
const cmd = sh();

if (is_pyodide) {
    const emsdkdir = sh.path`${__dirname}/../../.emsdk`;
    const { emscripten } = JSON.parse(
        fs.readFileSync(sh.path`${__dirname}/../../package.json`)
    );
    cmd.sh`cd ${emsdkdir}`.sh`. ./emsdk_env.sh`
        .sh`./emsdk activate ${emscripten}`.sh`cd ${cwd}`;
}

// if not windows
if (process.platform !== "win32") {
    cmd.env({
        PSP_ROOT_DIR: "../..",
    });
}

const build_wheel = !!process.env.PSP_BUILD_WHEEL || is_pyodide;
const build_sdist = !!process.env.PSP_BUILD_SDIST;

if (build_wheel) {
    let target = "";
    if (is_pyodide) {
        target = `--target=wasm32-unknown-emscripten -i${python_version}`;
    } else if (
        process.env.PSP_ARCH === "x86_64" &&
        process.platform === "darwin"
    ) {
        target = "--target=x86_64-apple-darwin";
    } else if (
        process.env.PSP_ARCH === "aarch64" &&
        process.platform === "darwin"
    ) {
        target = "--target=aarch64-apple-darwin";
    } else if (
        process.env.PSP_ARCH === "x86_64" &&
        process.platform === "linux"
    ) {
        target =
            "--target=x86_64-unknown-linux-gnu --compatibility manylinux_2_28";
    } else if (
        process.env.PSP_ARCH === "aarch64" &&
        process.platform === "linux"
    ) {
        target = "--target=aarch64-unknown-linux-gnu";
    }

    if (!!process.env.PSP_BUILD_VERBOSE) {
        flags += " -vv";
    }

    cmd.sh(`maturin build ${flags} --features=external-cpp ${target}`);
}

if (build_sdist) {
    cmd.sh(`maturin sdist`);
}

if (!build_wheel && !build_sdist) {
    cmd.sh(`maturin develop ${flags} --features=external-cpp`);
}

cmd.runSync();
