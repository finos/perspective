/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const PerspectiveBench = require("@finos/perspective-bench");

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

const FINOS_VERSIONS = ["0.3.1", "0.3.0", "0.3.0-rc.3", "0.3.0-rc.2", "0.3.0-rc.1"];

const UMD_VERSIONS = ["0.5.6", "0.5.5", "0.5.4", "0.5.3", "0.5.2", "0.5.1", "0.5.0", "0.4.8", "0.4.7", "0.4.6", "0.4.5", "0.4.4", "0.4.2", "0.4.1", "0.4.0", "0.3.9", "0.3.8", "0.3.7", "0.3.6"];

async function run() {
    await PerspectiveBench.run("master", "bench/perspective.benchmark.js", `http://${process.env.PSP_DOCKER_PUPPETEER ? `localhost` : `host.docker.internal`}:8080/perspective.js`, {
        output: "dist/benchmark",
        puppeteer: true
    });

    for (const version of UMD_VERSIONS) {
        const url = `https://unpkg.com/@finos/perspective@${version}/dist/umd/perspective.js`;
        await PerspectiveBench.run(version, "bench/perspective.benchmark.js", url, {
            output: "dist/benchmark",
            read: true,
            puppeteer: true
        });
    }

    for (const version of FINOS_VERSIONS) {
        const url = `https://unpkg.com/@finos/perspective@${version}/build/perspective.js`;
        await PerspectiveBench.run(version, "bench/perspective.benchmark.js", url, {
            output: "dist/benchmark",
            read: true,
            puppeteer: true
        });
    }

    for (const version of JPMC_VERSIONS) {
        const url = `https://unpkg.com/@jpmorganchase/perspective@${version}/build/perspective.js`;
        await PerspectiveBench.run(version, "bench/perspective.benchmark.js", url, {
            output: "dist/benchmark",
            read: true,
            puppeteer: true
        });
    }
}

run();
