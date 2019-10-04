/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

require("dotenv").config({path: "./.perspectiverc"});

const execSync = require("child_process").execSync;
const _path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");

function rimraf_err(e) {
    if (e) {
        console.error(e.message);
        process.exit(1);
    }
}

exports.execute = cmd => {
    try {
        execSync(cmd, {stdio: "inherit"});
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

exports.path = function path(...strings) {
    return _path.join(...strings.join("").split("/"));
};

exports.clean = function clean(...dirs) {
    for (let dir of dirs) {
        dir = exports.path(dir);
        if (fs.existsSync(dir)) {
            rimraf(dir, rimraf_err);
        }
    }
};

exports.bash = function bash(strings, ...args) {
    let terms = [];
    for (let i = 0; i < strings.length; ++i) {
        terms = [...terms, ...strings[i].split(" ")];
        if (terms.length > 0 && (args[i] === undefined || args[i] === NaN)) {
            terms = terms.slice(0, terms.length - 1);
        } else if (i < args.length) {
            terms[terms.length - 1] = terms[terms.length - 1] + args[i];
        }
    }
    return terms.join(" ");
};
