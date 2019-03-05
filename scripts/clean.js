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
const fs = require("fs");
const rimraf = require("rimraf");
const minimatch = require("minimatch");
const args = process.argv.slice(2);

const IS_SCREENSHOTS = args.indexOf("--screenshots") !== -1;

const execute = cmd => execSync(cmd, {stdio: "inherit"});

function clean(dir) {
    if (fs.existsSync(dir)) {
        rimraf(dir, e => {
            if (e) {
                console.error(e.message);
                process.exit(1);
            }
        });
    }
}

function clean_screenshots() {
    execute("lerna exec -- mkdirp screenshots");
    execute(`lerna run clean:screenshots --ignore-missing ${process.env.PACKAGE ? `--scope=@jpmorganchase/${process.env.PACKAGE}` : ""}`);
}

try {
    if (!IS_SCREENSHOTS && (!process.env.PACKAGE || minimatch("perspective", process.env.PACKAGE))) {
        clean(path.join(".", "cpp", "perspective", "obj"));
        clean(path.join(".", "cpp", "perspective", "cppbuild"));
    }
    if (!IS_SCREENSHOTS) {
        execute("lerna run clean");
    }
    clean_screenshots();
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
