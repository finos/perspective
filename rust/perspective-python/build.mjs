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

if (!!process.env.CI) {
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
        target = "--target=x86_64-unknown-linux-gnu";
    } else if (
        process.env.PSP_ARCH === "aarch64" &&
        process.platform === "linux"
    ) {
        target = "--target=aarch64-unknown-linux-gnu";
    }

    execSync(`maturin build ${flags} --features=external-cpp ${target}`, opts);
    execSync(`maturin sdist`, opts);
} else {
    execSync(`maturin develop ${flags} --features=external-cpp`, opts);
}
