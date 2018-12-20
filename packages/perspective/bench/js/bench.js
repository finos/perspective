/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const multi_template = (xs, ...ys) => ys[0].map((y, i) => [y, xs.reduce((z, x, ix) => (ys[ix] ? z + x + ys[ix][i] : z + x), "")]);

const UNPKG_VERSIONS = ["0.2.0", "0.2.1", "0.2.2", "0.2.3", "0.2.4", "0.2.5", "0.2.6", "0.2.7", "0.2.8", "0.2.9", "0.2.10"];
const UNPKG_URLS = multi_template`https://unpkg.com/@jpmorganchase/perspective@${UNPKG_VERSIONS}/build/perspective.js`;

const OLD_FORMAT_UNPKG_VERSIONS = ["0.2.0-beta.3"];
const OLD_FORMAT_UNPKG_URLS = multi_template`https://unpkg.com/@jpmorganchase/perspective-examples@${OLD_FORMAT_UNPKG_VERSIONS}/build/perspective.js`;

const URLS = [].concat(OLD_FORMAT_UNPKG_URLS, UNPKG_URLS, [["master", "http://localhost:8080/perspective.js"]]);

const RUN_TEST = fs.readFileSync(path.join(__dirname, "browser_runtime.js")).toString();

async function run_version(browser, url) {
    let page = await browser.newPage();
    page.on("console", msg => console.log(` -> ${msg.text()}`));
    page.on("pageerror", msg => console.log(` -> ${msg.message}`));

    await page.setContent(`<html><head><script src="${url}" async></script><script>${RUN_TEST}</script></head><body></body></html>`);
    await page.waitFor(() => window.hasOwnProperty("perspective"));

    let results = await page.evaluate(async () => await window.run_test());
    await page.close();

    return results;
}

function transpose(json) {
    const obj = {};
    for (let key of Object.keys(json[0])) {
        obj[key] = json.map(x => x[key]);
    }
    return obj;
}

async function run() {
    let data = [],
        version_index = 1;
    for (let [version, url] of URLS) {
        let browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox"]
        });
        console.log(`Running v${version}   (${url})`);
        let bins = await run_version(browser, url);
        bins = bins.map(result => ({...result, version, version_index}));
        version_index++;
        data = data.concat(bins);
        fs.writeFileSync(path.join(__dirname, "..", "..", "build", "benchmark.json"), JSON.stringify(transpose(data)));
        fs.writeFileSync(path.join(__dirname, "..", "..", "build", "benchmark.html"), fs.readFileSync(path.join(__dirname, "..", "html", "benchmark.html")).toString());

        await browser.close();
    }
}

run();
