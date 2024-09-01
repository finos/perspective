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
const { benchmark, suite } = require("./src/js/benchmark.js");

/**
 * Load a file as an `ArrayBuffer`, which is useful for loading Apache Arrow
 * Feather files.
 * @param {*} path
 * @returns
 */
function get_buffer(path) {
    return fs.readFileSync(require.resolve(path)).buffer;
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

Error.stackTraceLimit = 100;

async function table_suite(perspective, metadata) {
    async function before_all() {
        const client = await perspective.websocket(
            `ws://localhost:8080/subscribe`
        );

        const table = await client.open_table("superstore");
        const view = await table.view();
        const csv = await view.to_csv();
        const json = await view.to_json();
        const columns = await view.to_columns();
        await view.delete();
        // await table.delete();

        return { client, csv, columns, json };
    }

    async function after_all({ client }) {
        await client.close();
    }

    await benchmark({
        name: `.table(arrow)`,
        before_all,
        metadata,
        async after(_, table) {
            await table.delete();
        },
        async test({ client }) {
            const t = await client.table("");
            return t;
        },
    });

    await benchmark({
        name: `.table(csv)`,
        before_all,
        metadata,
        async after(_, table) {
            await table.delete();
        },
        async test({ client, table, csv }) {
            return await client.table(csv);
        },
    });

    await benchmark({
        name: `.table(json)`,
        before_all,
        metadata,
        async after(_, table) {
            await table.delete();
        },

        async test({ client, table, json }) {
            return await client.table(json);
        },
    });

    await benchmark({
        name: `.table(columns)`,
        before_all,
        metadata,
        async after(_, table) {
            await table.delete();
        },
        async test({ client, table, columns }) {
            return await client.table(columns);
        },
    });
}

/**
 * We use the `dependencies` of this package for the benchmark candidate
 * module list, so that we only need specify the dependencies and benchmark
 * candidates in one place.
 */
const VERSIONS = Object.keys(
    JSON.parse(fs.readFileSync(require.resolve(`./package.json`))).dependencies
);

suite(
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
        await table_suite(perspective, metadata);
        // await view_suite(perspective, metadata);
        // await to_data_suite(perspective, metadata);
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
