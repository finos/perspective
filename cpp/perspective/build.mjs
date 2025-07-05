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

import { execSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import * as url from "node:url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);

const stdio = "inherit";
const env = process.env.PSP_DEBUG ? "debug" : "release";
const cwd = path.join(process.cwd(), "dist", env);

const { compress } = await import("pro_self_extracting_wasm");

delete process.env.NODE;

let cmake_flags = "";
let make_flags = "";

if (!!process.env.PSP_BUILD_VERBOSE) {
    cmake_flags += "-Wdev --debug-output ";
    make_flags += "VERBOSE=1 ";
} else {
    cmake_flags = "-Wno-dev "; // suppress developer warnings
}

try {
    execSync(`mkdirp ${cwd}`, { stdio });
    process.env.CLICOLOR_FORCE = 1;
    execSync(
        `emcmake cmake ${__dirname} ${cmake_flags} -DCMAKE_BUILD_TYPE=${env} -DRAPIDJSON_BUILD_EXAMPLES=OFF`,
        {
            cwd,
            stdio,
        }
    );

    execSync(
        `emmake make -j${process.env.PSP_NUM_CPUS || os.cpus().length
        } ${make_flags}`,
        {
            cwd,
            stdio,
        }
    );

    execSync(`cpy web/**/* ../web`, { cwd, stdio });
    execSync(`cpy node/**/* ../node`, { cwd, stdio });
    if (!process.env.PSP_HEAP_INSTRUMENTS) {
        compress(
            `../../cpp/perspective/dist/web/perspective-server.wasm`,
            `../../cpp/perspective/dist/web/perspective-server.wasm`
        );
    }
} catch (e) {
    console.error(e);
    process.exit(1);
}
