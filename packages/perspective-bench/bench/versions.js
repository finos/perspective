/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const PerspectiveBench = require("@finos/perspective-bench");

const VERSIONS = [
    "0.8.3",
    "0.8.2",
    "0.8.1",
    "0.8.0",
    "0.7.0",
    "0.6.0",
    "0.5.6",
    "0.5.5",
    "0.5.4",
    "0.5.3",
    "0.5.2",
    "0.5.1",
    "0.5.0",
];

async function run() {
    await PerspectiveBench.run(
        "master",
        "bench/perspective.benchmark.js",
        `http://${
            process.env.PSP_DOCKER_PUPPETEER
                ? `localhost`
                : `host.docker.internal`
        }:8080/perspective.js`,
        {
            output: "dist/benchmark",
            puppeteer: true,
        }
    );

    for (const version of VERSIONS) {
        const url = `https://unpkg.com/@finos/perspective@${version}/dist/umd/perspective.js`;
        await PerspectiveBench.run(
            version,
            "bench/perspective.benchmark.js",
            url,
            {
                output: "dist/benchmark",
                read: true,
                puppeteer: true,
            }
        );
    }
}

run();
