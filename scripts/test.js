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

const execute = cmd => execSync(cmd, {stdio: "inherit"});

const args = process.argv.slice(2);

const IS_PUPPETEER = args.indexOf("--private-puppeteer") !== -1;
const IS_EMSDK = args.indexOf("--private-emsdk") !== -1;
const IS_WRITE = args.indexOf("--write") !== -1 || process.env.WRITE_TESTS;
const IS_DOCKER = args.indexOf("--docker") !== -1 || process.env.PSP_DOCKER;
const IS_LOCAL_PUPPETEER = fs.existsSync("node_modules/puppeteer");

function jest() {
    let cmd = "TZ=UTC node_modules/.bin/jest --rootDir=. --config=packages/perspective-test/jest.all.config.js --color --verbose";

    if (args.indexOf("--saturate") > -1) {
        console.log("-- Running the test suite in saturate mode");
        cmd = "PSP_SATURATE=1 " + cmd;
    }

    if (args.indexOf("--bail") > -1) {
        cmd += " --bail";
    }

    if (args.indexOf("--debug") > -1) {
        console.log("-- Running tests in debug mode - all console.log statements are preserved.");
    } else {
        cmd += " --silent 2>&1";
    }

    if (args.indexOf("-t") > -1) {
        const regex = args.slice(args.indexOf("-t") + 1).join(" ");
        console.log(`-- Qualifying search '${regex}'`);
        cmd += ` -t '${regex}'`;
    }

    return (IS_WRITE ? "WRITE_TESTS=1 " : "") + cmd;
}

function slow_jest() {
    return (IS_WRITE ? "WRITE_TESTS=1 " : "") + 'TZ=UTC node_modules/.bin/lerna exec --scope="@finos/perspective-@(jupyterlab|phosphor)" --concurrency 1 --no-bail -- yarn --silent test:run';
}

function docker() {
    console.log("-- Creating puppeteer docker image");
    let cmd = `docker run -it --rm --shm-size=2g -u root ${process.env.PACKAGE ? `-e PACKAGE=${process.env.PACKAGE}` : ""} -v ${process.cwd()}:/src -w /src`;
    if (IS_WRITE) {
        console.log("-- Running the test suite in Write mode");
        cmd += " -e WRITE_TESTS=1";
    }
    if (process.env.PSP_CPU_COUNT) {
        cmd += ` --cpus="${parseInt(process.env.PSP_CPU_COUNT)}.0"`;
    }
    cmd += " perspective/puppeteer node scripts/test.js --private-puppeteer";
    return cmd;
}

function emsdk() {
    console.log("-- Creating emsdk docker image");
    return "npm run --silent _emsdk -- node scripts/test.js --private-emsdk " + args.join(" ");
}

function emsdk() {
    console.log("-- Creating emsdk docker image");
    let cmd = "docker run --rm -it";
    if (process.env.PSP_CPU_COUNT) {
        cmd += ` --cpus="${parseInt(process.env.PSP_CPU_COUNT)}.0"`;
    }
    cmd += ` -v ${process.cwd()}:/src ${process.env.PACKAGE ? `-e PACKAGE=${process.env.PACKAGE}` : ""} perspective/emsdk node scripts/test.js --private-emsdk ` + args.join(" ");
    return cmd;
}

try {
    if (!IS_PUPPETEER && !IS_LOCAL_PUPPETEER) {
        if (IS_DOCKER && !IS_EMSDK) {
            execute(emsdk());
        } else {
            execute("node_modules/.bin/lerna exec -- mkdir -p dist/umd");
            let cmd = "node_modules/.bin/lerna run test:build --stream";
            if (process.env.PACKAGE) {
                cmd += " --scope=@finos/${PACKAGE}";
            }
            execute(cmd);
        }
        if (!IS_EMSDK) {
            execute(`yarn --silent clean --screenshots`);
            execute(docker() + " " + args.join(" "));
        }
    } else {
        if (IS_LOCAL_PUPPETEER) {
            execute(`yarn --silent clean --screenshots`);
            execute("node_modules/.bin/lerna exec -- mkdir -p dist/umd");
            let cmd = "node_modules/.bin/lerna run test:build --stream";
            if (process.env.PACKAGE) {
                cmd += " --scope=@finos/${PACKAGE}";
            }
            execute(cmd);
        }
        if (args.indexOf("--quiet") > -1) {
            console.log("-- Running test suite in quiet mode");
            execSync(`output=$(${jest()}); ret=$?; echo "\${output}"; exit $ret`, {stdio: "inherit"});
            execSync(`output=$(${slow_jest()}); ret=$?; echo "\${output}"; exit $ret`, {stdio: "inherit"});
        } else if (process.env.PACKAGE) {
            console.log("-- Running test suite in individual mode");
            let cmd = "TZ=UTC node_modules/.bin/lerna exec --concurrency 1 --no-bail";
            if (process.env.PACKAGE) {
                cmd += " --scope=@finos/${PACKAGE}";
            }
            cmd += " -- yarn --silent test:run";
            if (args.indexOf("-t") > -1) {
                const regex = args.slice(args.indexOf("-t") + 1).join(" ");
                console.log(`-- Qualifying search '${regex}'`);
                cmd += ` -t "${regex}"`;
            }
            execute((IS_WRITE ? "WRITE_TESTS=1 " : "") + cmd);
            execute(slow_jest());
        } else {
            console.log("-- Running test suite in fast mode");
            execute(jest());
            execute(slow_jest());
        }
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
