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

import sh from "./sh.mjs";
import * as fs from "fs";
import * as url from "url";
import * as os from "os";
import glob from "glob";
import { execSync } from "child_process";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);

export function lint() {
    if (process.env.PSP_PROJECT === "js") {
        const cppPath = sh.path`${__dirname}/../../cpp/perspective`;
        const cppDistPath = sh.path`${cppPath}/dist/release`;
        tidy(cppDistPath, sh.path`${cppPath}/src`);
    } else if (process.env.PSP_PROJECT === "python") {
        const cppPath = sh.path`${__dirname}/../../python/perspective`;
        const cppDistPath = sh.path`${cppPath}/build/last_build`;
        tidy(cppDistPath, sh.path`${cppPath}/perspective`);
    } else {
        console.error("Unknown project type, skipping lint");
    }
}

/** @typedef {import('./sh.mjs').Command} Command */

/**
 * Runs clang tidy on the source directory using the compile_commands.json
 * from the build directory.
 *
 * @param {string} buildDir
 * @param {string} sourceDir
 */
function tidy(buildDir, sourceDir) {
    const ctpath = clangTidyPath();
    if (!fs.existsSync(ctpath)) {
        console.warn("run-clang-tidy not found, skipping lint");
        return;
    }
    if (fs.existsSync(buildDir)) {
        const jobs = os.cpus().length;
        const sources = glob.sync(`${sourceDir}/**/*.{cpp,h}`);
        // @ts-ignore
        sh`${ctpath} -use-color -p${buildDir} -j${jobs} ${sources}`.runSync();
    } else {
        console.warn("No C++ build directory found, skipping lint");
    }
}

function clangTidyPath() {
    if (process.env.PSP_CLANG_TIDY_PATH !== undefined) {
        return process.env.PSP_CLANG_TIDY_PATH;
    } else {
        return `${__dirname}/../../.llvm/llvm-toolchain/bin/run-clang-tidy`;
    }
}

// lint();

// .llvm/llvm-toolchain/bin/clang-format
const CLANG_FMT_PATH = `${__dirname}/../../.llvm/llvm-toolchain/bin/clang-format`;

function formatLint(dir) {
    execSync(`${CLANG_FMT_PATH} -style=file --dry-run -Werror ${dir}`, {
        stdio: "inherit",
    });
}

function clangFormatFix(dir) {
    execSync(`${CLANG_FMT_PATH} -style=file -i ${dir}`, {
        stdio: "inherit",
    });
}

export function checkFormatting() {
    formatLint(sh.path`./cpp/perspective/src/cpp/*.cpp`);
    formatLint(sh.path`./cpp/perspective/src/include/perspective/*.h`);
    formatLint(sh.path`./python/perspective/perspective/src/*.cpp`);
    formatLint(
        sh.path`./python/perspective/perspective/include/perspective/*.h`
    );
    formatLint(
        sh.path`./python/perspective/perspective/include/perspective/python/*.h`
    );
}

export function fixFormatting() {
    clangFormatFix(sh.path`./cpp/perspective/src/cpp/*.cpp`);
    clangFormatFix(sh.path`./cpp/perspective/src/include/perspective/*.h`);
    clangFormatFix(sh.path`./python/perspective/perspective/src/*.cpp`);
    clangFormatFix(
        sh.path`./python/perspective/perspective/include/perspective/*.h`
    );
    clangFormatFix(
        sh.path`./python/perspective/perspective/include/perspective/python/*.h`
    );
}
