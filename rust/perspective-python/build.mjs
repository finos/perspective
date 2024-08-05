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

import { execSync } from "child_process";
import * as fs from "node:fs";
import pkg from "./package.json" assert { type: "json" };

let flags = "--release";
if (!!process.env.PSP_DEBUG) {
    flags = "";
}

const opts = {
    stdio: "inherit",
    env: {
        ...process.env,
        PSP_ROOT_DIR: "../..",
    },
};

const version = pkg.version.replace(/-(rc|alpha|beta)\.\d+/, (x) =>
    x.replace("-", "").replace(".", "")
);

fs.mkdirSync(`./perspective_python-${version}.data`, { recursive: true });

const build_wheel = !!process.env.PSP_BUILD_WHEEL;
const build_sdist = !!process.env.PSP_BUILD_SDIST;

if (build_wheel) {
    let target = "";
    if (process.env.PSP_ARCH === "x86_64" && process.platform === "darwin") {
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

    execSync(`maturin build ${flags} --features=external-cpp ${target}`, opts);
}

if (build_sdist) {
    execSync(`maturin sdist`, opts);
}

if (!build_wheel && !build_sdist) {
    execSync(`maturin develop ${flags} --features=external-cpp`, opts);
}
