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

const args = process.argv.slice(2);
const LIMIT = args.indexOf("--limit");

const multi_template = (xs, ...ys) => ys[0].map((y, i) => [y, xs.reduce((z, x, ix) => (ys[ix] ? z + x + ys[ix][i] : z + x), "")]);

const UNPKG_VERSIONS = ["0.2.21", "0.2.20", "0.2.18", "0.2.16", "0.2.15", "0.2.12", "0.2.11", "0.2.10", "0.2.9", "0.2.8", "0.2.7", "0.2.6", "0.2.5", "0.2.4", "0.2.3", "0.2.2", "0.2.1", "0.2.0"];
const UNPKG_URLS = multi_template`https://unpkg.com/@jpmorganchase/perspective@${UNPKG_VERSIONS}/build/perspective.js`;

const OLD_FORMAT_UNPKG_VERSIONS = ["0.2.0-beta.3"];
const OLD_FORMAT_UNPKG_URLS = multi_template`https://unpkg.com/@jpmorganchase/perspective-examples@${OLD_FORMAT_UNPKG_VERSIONS}/build/perspective.js`;

const URLS = [].concat([["master", `http://host.docker.internal:8080/perspective.js`]], UNPKG_URLS, OLD_FORMAT_UNPKG_URLS);

const RUN_TEST = fs.readFileSync(path.join(__dirname, "browser_runtime.js")).toString();

async function run_version(browser, url, is_delta = false) {
    let page = await browser.newPage();
    page.on("console", msg => {
        if (msg.type() !== "warning") {
            console.log(` ${msg.type() === "error" ? " !" : "->"} ${msg.text()}`);
        }
    });
    page.on("pageerror", msg => console.log(` -> ${msg.message}`));

    await page.setContent(`<html><head><script src="${url}" async></script><script>${RUN_TEST}</script></head><body></body></html>`);
    await page.waitFor(() => window.hasOwnProperty("perspective"));

    let results;
    if (is_delta) {
        results = await page.evaluate(async () => await window.run_delta_test());
    } else {
        results = await page.evaluate(async () => await window.run_test());
    }
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
    // Allow users to set a limit on version lookbacks
    let psp_urls = URLS;
    let is_delta = false;
    let benchmark_name = "benchmark";
    if (LIMIT !== -1) {
        let limit_num = Number(args[LIMIT + 1]);
        if (!isNaN(limit_num) && limit_num > 0 && limit_num <= psp_urls.length) {
            console.log(`Benchmarking the last ${limit_num} versions`);
            psp_urls = URLS.slice(0, limit_num);
        }
    }

    let data = [],
        version_index = 1;
    for (let [version, url] of psp_urls) {
        let browser = await puppeteer.launch({
            headless: true,
            args: ["--auto-open-devtools-for-tabs", "--no-sandbox"]
        });
        console.log(`Running v${version}   (${url})`);
        let bins = await run_version(browser, url, is_delta);
        bins = bins.map(result => ({...result, version, version_index}));
        version_index++;
        data = data.concat(bins);
        fs.writeFileSync(path.join(__dirname, "..", "..", "build", `${benchmark_name}.json`), JSON.stringify(transpose(data)));
        fs.writeFileSync(path.join(__dirname, "..", "..", "build", `${benchmark_name}.html`), fs.readFileSync(path.join(__dirname, "..", "html", `${benchmark_name}.html`)).toString());

        await browser.close();
    }

    console.log(`Benchmark suite has finished running - results are in ${benchmark_name}.html.`);
}

run();
