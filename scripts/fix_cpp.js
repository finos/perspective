/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const execSync = require("child_process").execSync;
const path = require("path");
const minimatch = require("minimatch");

const execute = cmd => execSync(cmd, {stdio: "inherit"});

function lint(dir) {
    execute(`clang-format -i -style=file ${dir}`);
}

try {
    if (!process.env.PACKAGE || minimatch("perspective", process.env.PACKAGE)) {
        lint(path.join(".", "cpp", "perspective", "src", "cpp", "*.cpp"));
        lint(path.join(".", "cpp", "perspective", "src", "include", "perspective", "*.h"));
    }
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
