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

import os from "node:os";
import path from "node:path";
import * as url from "node:url";
import * as fs from "node:fs";

import "zx/globals";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);

const env = process.env.PSP_DEBUG ? "debug" : "release";
const cwd = path.join(process.cwd(), "dist", env);
const cmake_dir = path.join(__dirname, "cpp", "perspective");
const { compress } = await import("pro_self_extracting_wasm");

delete process.env.NODE;

async function run_emsdk(cmd) {
    const emsdkdir = `${__dirname}/../../.emsdk`;
    const { emscripten } = JSON.parse(
        fs.readFileSync(`${__dirname}/../../package.json`),
    );

    if (!emscripten) {
        throw new Error("Emscripten version not specified in package.json");
    }

    await $({ env: { FORCE_COLOR: "1", ...process.env } })`cd ${emsdkdir} \
        && source ./emsdk_env.sh >/dev/null 2>&1 \
        && emsdk activate ${emscripten} >/dev/null \
        && cd ${cwd} \
        && ${cmd}`.verbose();
}

let cmake_flags = [];
let make_flags = [];

if (!!process.env.PSP_BUILD_VERBOSE) {
    cmake_flags.push("-Wdev");
    cmake_flags.push("--debug-output");
    make_flags.push("VERBOSE=1");
} else {
    cmake_flags.push("-Wno-dev"); // suppress developer warnings
}

try {
    fs.mkdirSync(cwd, { recursive: true });
    process.env.CLICOLOR_FORCE = 1;
    const out = await $`cargo metadata`;
    const p = JSON.parse(out.stdout).packages.find(
        (x) => x.name === "perspective-client",
    ).manifest_path;

    const pp = path.parse(p);
    await run_emsdk([
        `emcmake`,
        `cmake`,
        cmake_dir,
        ...cmake_flags,
        `-DCMAKE_BUILD_TYPE=${env}`,
        `-DRAPIDJSON_BUILD_EXAMPLES=OFF`,
        `-DPSP_PROTO_PATH=${pp.dir}`,
        `-DCMAKE_COLOR_DIAGNOSTICS=ON`,
    ]);

    await run_emsdk([
        `emmake`,
        `make`,
        `-j${process.env.PSP_NUM_CPUS || os.cpus().length}`,
        ...make_flags,
    ]);

    fs.cpSync("dist/release/web", "dist/web", { recursive: true });
    if (!process.env.PSP_HEAP_INSTRUMENTS) {
        compress(
            `./dist/web/perspective-server.wasm`,
            `./dist/web/perspective-server.wasm`,
        );
    }
} catch (e) {
    console.error(e);
    process.exit(1);
}
