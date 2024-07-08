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

import sh from "../../tools/perspective-scripts/sh.mjs";
import { execSync } from "child_process";
import * as url from "url";
import * as fs from "fs";

const is_pyodide = !!process.env.PSP_PYODIDE;

const cwd = process.cwd();
const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);
const emsdkdir = sh.path`${__dirname}/../../.emsdk`;
const { emscripten } = JSON.parse(
    fs.readFileSync(sh.path`${__dirname}/../../package.json`)
);

const cmd = sh();

// if not windows
if (process.platform !== "win32") {
    cmd.env({
        PSP_ROOT_DIR: "../..",
    });
}

if (is_pyodide) {
    cmd.sh`cd ${emsdkdir}`.sh`. ./emsdk_env.sh`
        .sh`./emsdk activate ${emscripten}`.sh`cd ${cwd}`;
}

const python_version = process.env.PSP_PYTHON_VERSION || "3.12";

let target = "";
if (is_pyodide) {
    target = "--target=wasm32-unknown-emscripten ";
} else if (process.env.PSP_ARCH === "x86_64" && process.platform === "darwin") {
    target = "--target=x86_64-apple-darwin ";
} else if (
    process.env.PSP_ARCH === "aarch64" &&
    process.platform === "darwin"
) {
    target = "--target=aarch64-apple-darwin ";
} else if (process.env.PSP_ARCH === "x86_64" && process.platform === "linux") {
    target =
        "--target=x86_64-unknown-linux-gnu --compatibility manylinux_2_28 ";
} else if (process.env.PSP_ARCH === "aarch64" && process.platform === "linux") {
    target =
        "--target=aarch64-unknown-linux-gnu --compatibility manylinux_2_28 ";
} else {
    // Windows
    // target = `--target=${get_host_triple()} `;
}

const maturin_flags =
    (!is_pyodide ? "" : `-ipython${python_version} `) +
    target +
    (process.env.PSP_DEBUG ? "" : "--release ");

const maturin_command = !process.env.CI ? "develop" : "build";

cmd.sh(`maturin ${maturin_command} --features=external-cpp ${maturin_flags}`);
if (process.env.CI) {
    cmd.sh`maturin sdist`;
}

cmd.runSync();
