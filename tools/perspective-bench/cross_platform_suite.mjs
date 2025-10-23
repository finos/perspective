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

// Legacy: Array-based key generation with spread operators
function createCacheKeyArrayBased(type, plugin) {
    return [
        type,
        ...Object.values(plugin.date_format ?? {}),
        ...Object.values(plugin.number_format ?? {}),
    ].join("-");
}

// Optimized: Direct string concatenation with fast path
function createCacheKeyOptimized(type, plugin) {
    if (!plugin.date_format && !plugin.number_format) {
        return type;
    }
    let key = type;
    if (plugin.date_format) {
        const df = plugin.date_format;
        if (df.format) key += `-${df.format}`;
        if (df.timeZone) key += `-${df.timeZone}`;
        if (df.dateStyle) key += `-${df.dateStyle}`;
        if (df.timeStyle) key += `-${df.timeStyle}`;
    }
    if (plugin.number_format) {
        const nf = plugin.number_format;
        if (nf.style) key += `-${nf.style}`;
        if (nf.minimumFractionDigits !== undefined) key += `-${nf.minimumFractionDigits}`;
        if (nf.maximumFractionDigits !== undefined) key += `-${nf.maximumFractionDigits}`;
    }
    return key;
}

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
        name: `.view({expressions})`,
        before_all,
        after_all,
        after,
        metadata,
        async test({ table }) {
            if (check_version_gte(metadata.version, "2.7.0")) {
                return await table.view({
                    columns: ["AAA"],
                    expressions: {
                        AAA: `("Sales" + "Profit") / 2`,
                    },
                });
            } else {
                return await table.view({
                    columns: ["AAA"],
                    expressions: [`//AAA\n("Sales" + "Profit") / 2`],
                });
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
            const arrow = await view.to_arrow();
            const json = await view.to_json();
            const columns = await view.to_columns();
            if (check_version_gte(metadata.version, "2.10.9")) {
                await view.delete();
            }

            if (check_version_gte(metadata.version, "3.0.0")) {
                await table.delete();
            }

            return { csv, arrow, table, json, columns };
        } catch (e) {
            console.error(e);
        }
    }

    if (check_version_gte(metadata.version, "2.3.0")) {
        await benchmark({
            name: `.table(arrow, {limit: 1000})`,
            before_all,
            metadata,
            async after(_, table) {
                if (check_version_gte(metadata.version, "3.0.0")) {
                    await table.delete();
                }
            },
            async test({ arrow }) {
                return await perspective.table(arrow.slice(), { limit: 1000 });
            },
        });
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
        async test({ table, arrow }) {
            return await perspective.table(arrow.slice());
        },
    });

    if (check_version_gte(metadata.version, "3.0.0")) {
        await benchmark({
            name: `table.update(arrow)`,
            before_all,
            metadata,
            async before({ arrow }) {
                let table2 = await perspective.table(arrow.slice(), {
                    limit: 1000,
                });
                return table2;
            },
            async after(_, table) {
                if (!check_version_gte(metadata.version, "3.4.3")) {
                    // Bug with old versions of perspective segfault when you delete
                    // a table with pending updates.
                    await table.size();
                }
                await table.delete();
            },
            async test({ arrow }, table2) {
                for (let i = 0; i < 3; i++) {
                    await table2.update(arrow.slice());
                }
            },
        });
    }

    await benchmark({
        name: `.table(csv)`,
        before_all,
        metadata,
        async after(_, table) {
            if (check_version_gte(metadata.version, "3.0.0")) {
                await table.delete();
            }
        },
        async test({ csv }) {
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

export async function formatter_cache_suite(perspective, metadata) {
    const TEST_CONFIGS = [
        { type: "float", plugin: {} },
        { type: "float", plugin: { number_format: { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 } } },
        { type: "datetime", plugin: { date_format: { dateStyle: "short", timeStyle: "medium", timeZone: "UTC" } } },
        { type: "datetime", plugin: { date_format: { format: "custom", year: "numeric", month: "long", day: "2-digit", hour: "2-digit", minute: "2-digit" } } },
    ];

    // Simulate realistic workload: 1000 cell formats per iteration
    const CELLS_PER_ITERATION = 1000;

    await benchmark({
        name: "FormatterCache (array-based) - empty config",
        metadata,
        max_iterations: 100,
        test() {
            for (let i = 0; i < CELLS_PER_ITERATION; i++) {
                createCacheKeyArrayBased("float", {});
            }
        },
    });

    await benchmark({
        name: "FormatterCache (optimized) - empty config",
        metadata,
        max_iterations: 100,
        test() {
            for (let i = 0; i < CELLS_PER_ITERATION; i++) {
                createCacheKeyOptimized("float", {});
            }
        },
    });

    await benchmark({
        name: "FormatterCache (array-based) - number format",
        metadata,
        max_iterations: 100,
        test() {
            for (let i = 0; i < CELLS_PER_ITERATION; i++) {
                createCacheKeyArrayBased("float", { 
                    number_format: { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 } 
                });
            }
        },
    });

    await benchmark({
        name: "FormatterCache (optimized) - number format",
        metadata,
        max_iterations: 100,
        test() {
            for (let i = 0; i < CELLS_PER_ITERATION; i++) {
                createCacheKeyOptimized("float", { 
                    number_format: { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 } 
                });
            }
        },
    });

    await benchmark({
        name: "FormatterCache (array-based) - complex date format",
        metadata,
        max_iterations: 100,
        test() {
            for (let i = 0; i < CELLS_PER_ITERATION; i++) {
                createCacheKeyArrayBased("datetime", { 
                    date_format: { format: "custom", year: "numeric", month: "long", day: "2-digit", hour: "2-digit", minute: "2-digit" } 
                });
            }
        },
    });

    await benchmark({
        name: "FormatterCache (optimized) - complex date format",
        metadata,
        max_iterations: 100,
        test() {
            for (let i = 0; i < CELLS_PER_ITERATION; i++) {
                createCacheKeyOptimized("datetime", { 
                    date_format: { format: "custom", year: "numeric", month: "long", day: "2-digit", hour: "2-digit", minute: "2-digit" } 
                });
            }
        },
    });

    await benchmark({
        name: "FormatterCache (array-based) - mixed workload",
        metadata,
        max_iterations: 100,
        test() {
            for (let i = 0; i < CELLS_PER_ITERATION; i++) {
                const config = TEST_CONFIGS[i % TEST_CONFIGS.length];
                createCacheKeyArrayBased(config.type, config.plugin);
            }
        },
    });

    await benchmark({
        name: "FormatterCache (optimized) - mixed workload",
        metadata,
        max_iterations: 100,
        test() {
            for (let i = 0; i < CELLS_PER_ITERATION; i++) {
                const config = TEST_CONFIGS[i % TEST_CONFIGS.length];
                createCacheKeyOptimized(config.type, config.plugin);
            }
        },
    });
}
