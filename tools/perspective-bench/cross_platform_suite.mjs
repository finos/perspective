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

import { benchmark } from "./src/js/benchmark.mjs";
import {
    check_version_gte,
    new_superstore_table,
} from "./src/js/superstore.mjs";

export async function to_data_suite(perspective, metadata) {
    async function before_all() {
        const table = await perspective.table(new_superstore_table(metadata));
        const view = await table.view();
        return { table, view };
    }

    async function after_all({ table, view }) {
        if (check_version_gte(metadata.version, "2.10.9")) {
            await view.delete();
        }

        if (check_version_gte(metadata.version, "3.0.0")) {
            await table.delete();
        }
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

export async function view_suite(perspective, metadata) {
    async function before_all() {
        const table = await perspective.table(new_superstore_table(metadata));
        for (let i = 0; i < 4; i++) {
            await table.update(new_superstore_table(metadata));
        }

        const schema = await table.schema();
        return { table, schema };
    }

    async function after_all({ table }) {
        if (check_version_gte(metadata.version, "3.0.0")) {
            await table.delete();
        }
    }

    async function after({ table }, view) {
        if (check_version_gte(metadata.version, "2.10.9")) {
            await view.delete();
        }
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

export async function table_suite(perspective, metadata) {
    async function before_all() {
        try {
            const table = await perspective.table(
                new_superstore_table(metadata)
            );
            const view = await table.view();
            const csv = await view.to_csv();
            const json = await view.to_json();
            const columns = await view.to_columns();
            if (check_version_gte(metadata.version, "2.10.9")) {
                await view.delete();
            }

            if (check_version_gte(metadata.version, "3.0.0")) {
                await table.delete();
            }
            return { csv, columns, json };
        } catch (e) {
            console.error(e);
        }
    }

    await benchmark({
        name: `.table(arrow)`,
        before_all,
        metadata,
        async after(_, table) {
            if (check_version_gte(metadata.version, "3.0.0")) {
                await table.delete();
            }
        },
        async test() {
            return await perspective.table(new_superstore_table(metadata));
        },
    });

    await benchmark({
        name: `.table(csv)`,
        before_all,
        metadata,
        async after(_, table) {
            if (check_version_gte(metadata.version, "3.0.0")) {
                await table.delete();
            }
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
            if (check_version_gte(metadata.version, "3.0.0")) {
                await table.delete();
            }
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
            if (check_version_gte(metadata.version, "3.0.0")) {
                await table.delete();
            }
        },
        async test({ table, columns }) {
            return await perspective.table(columns);
        },
    });
}
