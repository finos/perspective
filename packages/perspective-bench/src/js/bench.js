/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const fs = require("fs");
const path = require("path");
const perspective = require("@finos/perspective");
const chalk = require("chalk");
const program = require("commander");

const execSync = require("child_process").execSync;

chalk.enabled = true;
chalk.level = 1;

const BROWSER_RUNTIME = arg1 =>
    fs
        .readFileSync(path.join(__dirname, "browser_runtime.js"))
        .toString()
        .replace("__PLACEHOLDER__", arg1);

const to_url = (arg1, arg2) => `<html><head><script>${BROWSER_RUNTIME(arg1)};${arg2}</script></head><body></body></html>`;

function color(string) {
    string = [string];
    string.raw = string;
    return chalk(string);
}

async function run_version(browser, args, run_test) {
    let page = await browser.newPage();
    // TODO silence these
    page.on("console", msg => {
        if (msg.type() !== "warning") {
            console.log(color(msg.text()));
        }
    });
    page.on("pageerror", msg => console.log(` -> ${msg.message}`));
    await page.setContent(to_url(JSON.stringify(args), run_test));

    let results = await page.evaluate(async () => await window.PerspectiveBench.run());
    await page.close();

    return results;
}

async function run_node_version(args, run_test) {
    const script = BROWSER_RUNTIME(JSON.stringify(args));
    console.warn = function() {};
    const old_log = console.log;
    console.log = (...args) => old_log(...args.map(color));
    const js = eval(`"use strict";${script};${run_test};PerspectiveBench`);
    console.log = old_log;
    return await js.run();
}

exports.run = async function run(version, benchmark, ...cmdArgs) {
    const options = cmdArgs.splice(cmdArgs.length - 1, 1)[0];

    let benchmark_name = options.output || "benchmark";

    console.log(chalk`\n{whiteBright Running v.${version} (${cmdArgs.join(",")})}`);

    let version_index = 1;
    let table = undefined;
    if (options.read && fs.existsSync(`${benchmark_name}.arrow`)) {
        const buffer = fs.readFileSync(`${benchmark_name}.arrow`, null).buffer;
        table = await perspective.table(buffer);
        const view = await table.view({row_pivots: ["version"], columns: []});
        const json = await view.to_json();
        version_index = json.length;
    }

    const RUN_TEST = fs.readFileSync(path.resolve(benchmark)).toString();
    let bins;

    if (options.puppeteer) {
        const puppeteer = require("puppeteer");
        let browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox"]
        });

        execSync(`renice -n -20 ${browser.process().pid}`, {stdio: "inherit"});

        bins = await run_version(browser, cmdArgs, RUN_TEST);

        await browser.close();

        console.log(`Benchmark suite has finished running - results are in ${benchmark_name}.html.`);
    } else {
        bins = await run_node_version(cmdArgs, RUN_TEST);
    }
    bins = bins.map(result => ({...result, version, version_index}));
    version_index++;
    if (table === undefined) {
        table = await perspective.table(bins);
    } else {
        table.update(bins);
    }
    const view = await table.view();
    const arrow = await view.to_arrow();
    view.delete();
    fs.writeFileSync(path.join(process.cwd(), `${benchmark_name}.arrow`), new Buffer(arrow), "binary");
    fs.writeFileSync(path.join(process.cwd(), `${benchmark_name}.html`), fs.readFileSync(path.join(__dirname, "..", "html", `benchmark.html`)).toString());
};

exports.registerCmd = function registerCmd() {
    program
        .version(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "package.json")).toString()).version)
        .arguments("[suite] [...cmdArgs]")
        .description("Run the benchmark suite")
        .option("-o, --output <filename>", "Filename to write to, defaults to `benchmark`")
        .option("-r, --read", "Read from disk or overwrite")
        .option("-p, --puppeteer", "Should run the suite in Puppeteer (Headless)")
        .action((...args) => {
            const options = args.splice(args.length - 1, 1)[0];

            exports.run(...args, options);
        });

    program.parse(process.argv);

    if (!process.argv.slice(2).length) {
        program.help();
    }
};

exports.default = exports;
