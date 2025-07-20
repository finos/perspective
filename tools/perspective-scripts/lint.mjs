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

import { get_scope, default as sh } from "./sh_perspective.mjs";
import * as url from "url";
import * as dotenv from "dotenv";
import * as cppLint from "./lint_cpp.mjs";

export function lint_js(is_fix = false) {
    const prettier_flags = is_fix ? "--write" : "--check";
    const cmd = sh`prettier ${prettier_flags} "examples/**/*.js" "examples/**/*.tsx" "tools/perspective-scripts/*.mjs" "rust/**/*.ts" "rust/**/*.js" "packages/**/*.js" "packages/**/*.ts"`;
    cmd.sh`prettier --prose-wrap=always ${prettier_flags} "rust/*/docs/**/*.md"`;
    // cmd.sh`prettier ${prettier_flags} "**/*.yaml"`;
    cmd.sh`prettier ${prettier_flags} "**/less/*.less"`;
    cmd.sh`prettier ${prettier_flags} "**/html/*.html"`;
    cmd.sh`prettier ${prettier_flags} "packages/**/package.json" "rust/**/package.json" "examples/**/package.json" "docs/package.json"`;

    const check = is_fix ? undefined : "--check";
    const dirty = is_fix ? "--allow-dirty" : undefined;
    const staged = is_fix ? "--allow-staged" : undefined;
    const fix = is_fix ? "--fix" : undefined;
    cmd.sh`cd rust/perspective-viewer`;
    cmd.sh`cargo build -p perspective-lint`;
    cmd.sh`cargo clippy ${fix} ${dirty} ${staged} -- -Dwarnings`;
    cmd.sh`RUSTFMT="../target/debug/lint" cargo fmt ${check}`;
    cmd.runSync();
}

export function lint_python(is_fix = false) {
    if (get_scope().indexOf("perspective-python") > -1) {
        if (is_fix) {
            sh`ruff check --fix`.runSync();
        } else {
            sh`ruff check`.runSync();
        }
    }
}

if (import.meta.url.startsWith("file:")) {
    if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
        dotenv.config({ path: "./.perspectiverc" });
        const { default: run } = await import("./lint_headers.mjs");
        const exit_code = await run(false);
        // if (process.env.PSP_PROJECT === "python") {
        // await import("./lint_python.mjs");
        // } else {
        lint_js();
        lint_python();
        // }

        cppLint.checkFormatting();
        process.exit(exit_code);
    }
}
