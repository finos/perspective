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

const { execSync } = require("child_process");
const os = require("os");
const path = require("path");

const stdio = "inherit";
const rust_env = process.env.PSP_DEBUG ? "" : "--release";
const env = process.env.PSP_DEBUG ? "debug" : "release";
const cwd = path.join(process.cwd(), "dist", env);

delete process.env.NODE;

function bootstrap(file) {
    execSync(`cargo run -p perspective-bootstrap -- ${rust_env} ${file}`, {
        cwd: path.join(process.cwd(), "..", "..", "rust", "perspective-js"),
        stdio,
    });
}

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
        `emcmake cmake ${__dirname} ${cmake_flags} -DCMAKE_BUILD_TYPE=${env}`,
        {
            cwd,
            stdio,
        }
    );

    execSync(
        `emmake make -j${
            process.env.PSP_NUM_CPUS || os.cpus().length
        } ${make_flags}`,
        {
            cwd,
            stdio,
        }
    );

    execSync(`cpy web/**/* ../web`, { cwd, stdio });
    execSync(`cpy node/**/* ../node`, { cwd, stdio });
    bootstrap(`../../cpp/perspective/dist/web/perspective-server.wasm`);
} catch (e) {
    console.error(e);
    process.exit(1);
}
