/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const execSync = require("child_process").execSync;
const fs = require("fs");
const path = require("path");
const minimatch = require("minimatch");

const execute = cmd => execSync(cmd, {stdio: "inherit"});

try {
    if (fs.existsSync("node_modules/puppeteer")) {
        console.log("Switching Puppeteer from LOCAL to DOCKER");
        fs.renameSync("node_modules/puppeteer", "node_modules/puppeteer.disabled");
    } else if (fs.existsSync("node_modules/puppeteer.disabled")) {
        console.log("Switching Puppeteer from DOCKER to LOCAL");
        fs.renameSync("node_modules/puppeteer.disabled", "node_modules/puppeteer");
    } else {
        console.log("Switching Puppeteer from DOCKER to LOCAL");
        console.log("LOCAL Puppeteer not found in node_modules, installing...");
        fs.copyFileSync("package.json", "package.json.bak");
        fs.copyFileSync("yarn.lock", "yarn.lock.bak");
        execute("yarn add -W --dev puppeteer");
        fs.renameSync("package.json.bak", "package.json");
        fs.renameSync("yarn.lock.bak", "yarn.lock");
    }
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
