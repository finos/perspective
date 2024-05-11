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

import { default as sh, clean, run_with_scope } from "./sh_perspective.mjs";
import glob from "glob";

const args = process.argv.slice(2);

if (process.env.PSP_PROJECT === "python") {
    clean(
        "python/perspective/dist",
        "python/perspective/build",
        "python/perspective/docs/build",
        "python/perspective/perspective_python.egg-info",
        "python/perspective/.coverage",
        "python/perspective/.pytest_cache",
        "python/perspective/python_junit.xml",
        "python/perspective/coverage.xml",
        ...glob.sync("python/perspective/**/*.pyc"),
        ...glob.sync("python/perspective/**/__pycache__")
    );
    process.exit(0);
}

if (!process.env.PSP_PROJECT || args.indexOf("--deps") > -1) {
    clean(
        "cpp/perspective/dist",
        "cpp/perspective/build",
        "packages/perspective/build"
    );
}

const PACKAGES = process.env.PACKAGE?.split(",") || [];
if (!process.env.PACKAGE || PACKAGES.indexOf("perspective") >= 0) {
    const files = [
        "CMakeFiles",
        "build",
        "cmake_install.cmake",
        "CMakeCache.txt",
        "compile_commands.json",
        "libpsp.a",
        "Makefile",
    ];
    clean(...files.map((x) => `cpp/perspective/obj/${x}`));
}

if (
    !process.env.PACKAGE ||
    PACKAGES.indexOf("perspective") >= 0 ||
    PACKAGES.indexOf("perspective-viewer") >= 0
) {
    console.log("-- Running cargo clean\n");
    sh`cargo clean`.runSync();
    console.log();
}

await run_with_scope`clean`;
clean("docs/build", "docs/python", "docs/obj");
