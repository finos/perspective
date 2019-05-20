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
const perspective = require("@finos/perspective");
const chalk = require("chalk");

const args = process.argv.slice(2);
const LIMIT = args.indexOf("--limit");

const BUILD_DIR = path.join(__dirname, "..", "..", "build");
const multi_template = (xs, ...ys) => ys[0].map((y, i) => [y, xs.reduce((z, x, ix) => (ys[ix] ? z + x + ys[ix][i] : z + x), "")]);

const JPMC_VERSIONS = [
    //"0.2.23", /* memory leak */
    "0.2.22",
    "0.2.21",
    "0.2.20",
    "0.2.18",
    "0.2.16",
    "0.2.15",
    "0.2.12",
    "0.2.11",
    "0.2.10",
    "0.2.9",
    "0.2.8",
    "0.2.7",
    "0.2.6",
    "0.2.5",
    "0.2.4",
    "0.2.3",
    "0.2.2",
    "0.2.1",
    "0.2.0"
];

const FINOS_VERSIONS = ["0.3.0-rc.1"];

const JPMC_URLS = multi_template`https://unpkg.com/@jpmorganchase/perspective@${JPMC_VERSIONS}/build/perspective.js`;
const FINOS_URLS = multi_template`https://unpkg.com/@finos/perspective@${FINOS_VERSIONS}/build/perspective.js`;

const OLD_FORMAT_JPMC_VERSIONS = ["0.2.0-beta.3"];
const OLD_FORMAT_JPMC_URLS = multi_template`https://unpkg.com/@jpmorganchase/perspective-examples@${OLD_FORMAT_JPMC_VERSIONS}/build/perspective.js`;

const URLS = [].concat([["master", `http://host.docker.internal:8080/perspective.js`]], FINOS_URLS, JPMC_URLS, OLD_FORMAT_JPMC_URLS);

const RUN_TEST = fs.readFileSync(path.join(__dirname, "browser_runtime.js")).toString();

function color(string) {
    string = [string];
    string.raw = string;
    return chalk(string);
}

async function run_version(browser, url, is_delta = false) {
    let page = await browser.newPage();
    page.on("console", msg => {
        if (msg.type() !== "warning") {
            console.log(` ${chalk.whiteBright(msg.type() === "error" ? " !" : "->")} ${color(msg.text())}`);
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

    let version_index = 1;
    let table = undefined;
    for (let [version, url] of psp_urls) {
        let browser = await puppeteer.launch({
            headless: true,
            args: ["--auto-open-devtools-for-tabs", "--no-sandbox"]
        });
        console.log(`Running v${version}   (${url})`);
        let bins = await run_version(browser, url, is_delta);
        bins = bins.map(result => ({...result, version, version_index}));
        version_index++;
        if (table === undefined) {
            table = perspective.table(bins);
        } else {
            table.update(bins);
        }
        const view = table.view();
        const arrow = await view.to_arrow();
        view.delete();
        fs.writeFileSync(path.join(BUILD_DIR, `${benchmark_name}.arrow`), new Buffer(arrow), "binary");
        fs.writeFileSync(path.join(BUILD_DIR, `${benchmark_name}.html`), fs.readFileSync(path.join(__dirname, "..", "html", `${benchmark_name}.html`)).toString());

        await browser.close();
    }

    console.log(`Benchmark suite has finished running - results are in ${benchmark_name}.html.`);
}

run();
