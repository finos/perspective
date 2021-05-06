/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const fs = require("fs");
const {execute, resolve} = require("./script_utils.js");

try {
    const puppeteer_path = resolve`${__dirname}/../node_modules/puppeteer`;
    const puppeter_disabled_path = resolve`${__dirname}/../node_modules/puppeteer.disabled`;

    if (fs.existsSync(puppeteer_path)) {
        console.log("Switching Puppeteer from LOCAL to DOCKER");
        fs.renameSync(puppeteer_path, puppeter_disabled_path);
    } else if (fs.existsSync(puppeter_disabled_path)) {
        console.log("Switching Puppeteer from DOCKER to LOCAL");
        fs.renameSync(puppeter_disabled_path, puppeteer_path);
    } else {
        console.log("Switching Puppeteer from DOCKER to LOCAL");
        console.log("LOCAL Puppeteer not found in node_modules, installing...");
        fs.copyFileSync("package.json", "package.json.bak");
        fs.copyFileSync("yarn.lock", "yarn.lock.bak");
        execute("yarn add -W --dev puppeteer@9.0.0");
        fs.renameSync("package.json.bak", "package.json");
        fs.renameSync("yarn.lock.bak", "yarn.lock");
    }
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
