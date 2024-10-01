// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const fs = require("fs");
import * as all_benchmarks from "./cross_platform_suite.mjs";
import * as perspective_bench from "./src/js/benchmark.mjs";

/**
 * We use the `dependencies` of this package for the benchmark candidate
 * module list, so that we only need specify the dependencies and benchmark
 * candidates in one place.
 */
const VERSIONS = Object.keys(
    JSON.parse(fs.readFileSync(require.resolve(`./package.json`))).dependencies
);

perspective_bench.suite(
    // ["@finos/perspective", ...VERSIONS],
    [...VERSIONS],
    async function (path, version_idx) {
        let perspective = await import(path);
        perspective = perspective.default || perspective;
        const pkg_json = JSON.parse(
            fs.readFileSync(require.resolve(`${path}/package.json`))
        );

        let version = pkg_json.version;
        console.log(`${path} (${pkg_json.name}@${version})`);
        if (version_idx === 0) {
            version = `${version} (master)`;
        }

        const metadata = { version, version_idx };
        await all_benchmarks.table_suite(perspective, metadata);
        // await all_benchmarks.view_suite(perspective, metadata);
        // await all_benchmarks.to_data_suite(perspective, metadata);
    },
    async function (path) {
        let psp = await import(path);
        psp = psp.default || psp;
        // const port = Math.floor(Math.random() * 1000) + 1000;
        const server = new psp.WebSocketServer({
            port: 8080,
        });

        function buffer_to_arraybuffer(buffer) {
            return new Int8Array(
                buffer.buffer.slice(
                    buffer.byteOffset,
                    buffer.byteOffset + buffer.length
                )
            );
        }

        const table = await psp.table(
            buffer_to_arraybuffer(
                fs.readFileSync(
                    "../../node_modules/superstore-arrow/superstore.arrow"
                )
            ).buffer,
            { name: "superstore" }
        );

        // // Legacy compat
        if (server.host_table) {
            server.host_table("superstore", table);
        }

        return server;
    }
);
