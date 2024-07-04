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

import { clean, get_scope } from "./sh_perspective.mjs";
import { execSync } from "child_process";

const PACKAGES = get_scope();
const JS_PKGS = [];
const RUST_PKGS = [];
for (const pkg of PACKAGES) {
    if (pkg === "perspective-cpp") {
        console.log("-- Cleaning perspective-cpp");
        clean("cpp/perspective/dist", "cpp/perspective/build");
    } else if (
        [
            "perspective-cli",
            "perspective-esbuild-plugin",
            "perspective-jupyterlab",
            "perspective-viewer-d3fc",
            "perspective-viewer-datagrid",
            "perspective-viewer-openlayers",
            "perspective-webpack-plugin",
            "perspective-workspace",
        ].indexOf(pkg) > -1
    ) {
        JS_PKGS.push(pkg);
    } else {
        RUST_PKGS.push(pkg);
    }
}

if (JS_PKGS.length > 0) {
    console.log(`-- Cleaning ${JS_PKGS.join(", ")} via pnpm`);
    execSync(
        `pnpm run ${JS_PKGS.map((x) => `--filter ${x} --if-present`).join(
            " "
        )} clean`,
        { stdio: "inherit" }
    );
}

if (RUST_PKGS.length > 0) {
    console.log(`-- Cleaning ${RUST_PKGS.join(", ")} via cargo`);
    execSync(`cargo clean ${RUST_PKGS.map((x) => `-p ${x}`).join(" ")}`);
}

clean("docs/build", "docs/python", "docs/obj");
