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

import * as fs from "node:fs";
import * as path from "node:path";
import { benchmark, suite } from "./src/js/benchmark.mjs";

import { createRequire } from "node:module";
import * as url from "node:url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);

const _require = createRequire(import.meta.url);

/**
 * Load a file as an `ArrayBuffer`, which is useful for loading Apache Arrow
 * Feather files.
 * @param {*} path
 * @returns
 */
function get_buffer(path) {
    return fs.readFileSync(_require.resolve(path)).buffer;
}

/**
 * Check whether a version string e.g. "v1.2.3" is greater or equal to another
 * version string, which must be of the same length/have the same number of
 * minor version levels.
 * @param {*} a
 * @param {*} b
 * @returns
 */
function check_version_gte(a, b) {
    a = a.split(".").map((x) => parseInt(x));
    b = b.split(".").map((x) => parseInt(x));
    for (const i in a) {
        if (a[i] > b[i]) {
            return true;
        } else if (a[i] < b[i]) {
            return false;
        }
    }

    return true;
}

const SUPERSTORE_ARROW = get_buffer("superstore-arrow/superstore.arrow");
const SUPERSTORE_FEATHER = get_buffer("superstore-arrow/superstore.lz4.arrow");

/**
 * Load the Superstore example data set as either a Feather (LZ4) or
 * uncompressed `Arrow`, depending on whether Perspective supports Feather.
 * @param {*} metadata
 * @returns
 */
function new_table(metadata) {
    if (check_version_gte(metadata.version, "2.5.0")) {
        return SUPERSTORE_FEATHER.slice();
    } else {
        return SUPERSTORE_ARROW.slice();
    }
}

async function to_data_suite(perspective, metadata) {
    async function before_all() {
        const table = await perspective.table(new_table(metadata));
        const view = await table.view();
        return { table, view };
    }

    async function after_all({ table, view }) {
        await view.delete();
        await table.delete();
    }

    await benchmark({
        name: `.to_arrow()`,
        before_all,
        after_all,
        metadata,
        async test({ view }) {
            const _arrow = await view.to_arrow();
        },
    });

    await benchmark({
        name: `.to_csv()`,
        before_all,
        after_all,
        metadata,
        async test({ view }) {
            const _csv = await view.to_csv();
        },
    });

    await benchmark({
        name: `.to_columns()`,
        before_all,
        after_all,
        metadata,
        async test({ view }) {
            const _columns = await view.to_columns();
        },
    });

    await benchmark({
        name: `.to_json()`,
        before_all,
        after_all,
        metadata,
        async test({ view }) {
            const _json = await view.to_json();
        },
    });
}

async function view_suite(perspective, metadata) {
    async function before_all() {
        const table = await perspective.table(new_table(metadata));
        for (let i = 0; i < 4; i++) {
            await table.update(new_table(metadata));
        }

        const schema = await table.schema();
        return { table, schema };
    }

    async function after_all({ table }) {
        await table.delete();
    }

    async function after({ table }, view) {
        await view.delete();
    }

    await benchmark({
        name: `.view()`,
        before_all,
        after_all,
        after,
        metadata,
        async test({ table }) {
            return await table.view();
        },
    });

    await benchmark({
        name: `.view({group_by})`,
        before_all,
        after_all,
        after,
        metadata,
        async test({ table }) {
            if (check_version_gte(metadata.version, "1.2.0")) {
                return await table.view({ group_by: ["Product Name"] });
            } else {
                return await table.view({ row_pivots: ["Product Name"] });
            }
        },
    });

    await benchmark({
        name: `.view({group_by, aggregates: "median"})`,
        before_all,
        after_all,
        after,
        metadata,
        async test({ table, schema }) {
            const columns = ["Sales", "Quantity", "City"];
            const aggregates = Object.fromEntries(
                Object.keys(schema).map((x) => [x, "median"])
            );

            if (check_version_gte(metadata.version, "1.2.0")) {
                return await table.view({
                    group_by: ["State"],
                    aggregates,
                    columns,
                });
            } else {
                return await table.view({
                    row_pivots: ["State"],
                    aggregates,
                    columns,
                });
            }
        },
    });
}

async function table_suite(perspective, metadata) {
    async function before_all() {
        const table = await perspective.table(new_table(metadata));
        const view = await table.view();
        const csv = await view.to_csv();
        const json = await view.to_json();
        const columns = await view.to_columns();
        await view.delete();
        await table.delete();
        return { csv, columns, json };
    }

    await benchmark({
        name: `.table(arrow)`,
        before_all,
        metadata,
        async after(_, table) {
            await table.delete();
        },
        async test() {
            return await perspective.table(new_table(metadata));
        },
    });

    await benchmark({
        name: `.table(csv)`,
        before_all,
        metadata,
        async after(_, table) {
            await table.delete();
        },
        async test({ table, csv }) {
            return await perspective.table(csv);
        },
    });

    await benchmark({
        name: `.table(json)`,
        before_all,
        metadata,
        async after(_, table) {
            await table.delete();
        },

        async test({ table, json }) {
            return await perspective.table(json);
        },
    });

    await benchmark({
        name: `.table(columns)`,
        before_all,
        metadata,
        async after(_, table) {
            await table.delete();
        },
        async test({ table, columns }) {
            return await perspective.table(columns);
        },
    });
}

/**
 * We use the `dependencies` of this package for the benchmark candidate
 * module list, so that we only need specify the dependencies and benchmark
 * candidates in one place.
 */
const VERSIONS = Object.keys(
    JSON.parse(fs.readFileSync(_require.resolve(`./package.json`))).dependencies
);

fs.mkdirSync(path.join(__dirname, "./dist"), { recursive: true });
suite(
    // "ws://localhost:8082/websocket",
    ["@finos/perspective", ...VERSIONS],
    path.join(__dirname, "dist/benchmark-js.arrow"),
    async function (path, version_idx) {
        let client, metadata;
        if (path.startsWith("ws://")) {
            console.log(path);
            const { default: perspective } = await import("@finos/perspective");
            client = await perspective.websocket(path);
            metadata = {
                version: "3.0.0",
                version_idx,
            };
        } else {
            const perspective = await import(path);
            const pkg_json = JSON.parse(
                fs.readFileSync(_require.resolve(`${path}/package.json`))
            );

            let version = pkg_json.version;
            console.log(`${path} (${pkg_json.name}@${version})`);
            if (version_idx === 1) {
                version = `${version} (master)`;
            }

            client = perspective.default || perspective;
            metadata = { version, version_idx };
        }

        await table_suite(client, metadata);
        await view_suite(client, metadata);
        await to_data_suite(client, metadata);
    }
);
