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

import { glob } from "glob-gitignore";
import { promises as fs } from "fs";
import * as fs_sync from "fs";

const IGNORE_PATHS = fs_sync
    .readFileSync(".gitignore")
    .toString()
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && !x.startsWith("#"))
    .concat(["llvm/*", "cmake/*", "pnpm-lock.yaml", "pnpm-workspace.yaml"]);

const FIX_PATHS = [
    ["**/*.rs", ["//", "/*", " *", " */"]],
    ["**/*.js", ["//", "/*", " *", " */"]],
    ["**/*.mjs", ["//", "/*", " *", " */"]],
    // ["**/*.css", ["//", "/*", " *", " */"]],
    ["**/*.scss", ["//", "/*", " *", " */"]],
    ["**/*.less", ["//", "/*", " *", " */"]],
    ["**/*.toml", ["# ", "#"]],
    ["**/*.yaml", ["# ", "#"]],
    ["**/*.py", ["# ", "#"]],
    ["**/*.ts", ["//", "/*", " *", " */"]],
    ["**/*.tsx", ["//", "/*", " *", " */"]],
    ["**/*.cpp", ["//", "/*", " *", " */"]],
    ["**/*.h", ["//", "/*", " *", " */"]],
    [".github/**/*.yaml", ["# ", "#"]],
];

function header_text(c, ...args) {
    return (
        `
${c} ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
${c} ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
${c} ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
${c} ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
${c} ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
${c} ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
${c} ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
${c} ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
${c} ┃ This file is part of the Perspective library, distributed under the terms ┃
${c} ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
${c} ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        `.trim() + args.join("")
    );
}

async function check(is_write, pattern, comment) {
    const matches = await glob(pattern, {
        ignore: IGNORE_PATHS,
    });

    let exit_code = 0;
    for (const match of matches) {
        if (fs_sync.lstatSync(match).isDirectory()) {
            continue;
        }

        const data = await fs.readFile(match);
        let contents = data.toString();
        let default_comment = comment;
        if (Array.isArray(comment)) {
            default_comment = comment[0];
        } else {
            comment = [comment];
        }

        const expected_header = header_text(default_comment);
        let seen_whitespace = false;
        // Nightly builds modify the version of metadata scripts in place to
        // tag the nightly, so lint will fail if we don't make an exception
        // for these files.
        const is_nightly =
            process.argv.indexOf("--nightly") > -1 &&
            (match.indexOf("Cargo.toml") > -1 ||
                match.indexOf("pyproject.toml") > -1);

        if (!contents.startsWith(expected_header) && !is_nightly) {
            console.error(`Missing header in file ${match}`);
            while (
                contents.length > 0 &&
                ((!seen_whitespace &&
                    comment.some((x) => contents.startsWith(x))) ||
                    (seen_whitespace = contents.startsWith("\n")))
            ) {
                contents = contents.substring(contents.indexOf("\n") + 1);
            }

            if (is_write) {
                await fs.writeFile(match, `${expected_header}\n\n${contents}`);
            } else {
                exit_code = 1;
            }
        }
    }

    return exit_code;
}

export default async function run(is_write) {
    let exit_code = 0;
    for (const [patt, comment] of FIX_PATHS) {
        const result = await check(is_write, patt, comment);
        exit_code = exit_code || result;
    }

    return exit_code;
}
