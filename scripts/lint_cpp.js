/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const { execute, bash, path, getarg } = require("./script_utils.js");

const CMD_TYPE = getarg("--fix") ? "fix" : "lint";

function lint(dir) {
    execute(
        bash`clang-format ${
            CMD_TYPE === "fix" ? "" : "--dry-run -Werror "
        } -i -style=file ${dir}`
    );
}

try {
    lint(path`./cpp/perspective/src/cpp/*.cpp`);
    lint(path`./cpp/perspective/src/include/perspective/*.h`);
    lint(path`./python/perspective/perspective/src/*.cpp`);
    lint(path`./python/perspective/perspective/include/perspective/*.h`);
    lint(path`./python/perspective/perspective/include/perspective/python/*.h`);
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
