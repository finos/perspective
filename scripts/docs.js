/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const execSync = require("child_process").execSync;
const execute = cmd => execSync(cmd, {stdio: "inherit"});

try {
    execute("mkdirp docs/build docs/obj");
    execute("lerna run docs --silent --stream")
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
