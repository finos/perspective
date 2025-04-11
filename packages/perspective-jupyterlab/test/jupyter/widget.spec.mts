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

import { API_VERSION, expect } from "@finos/perspective-test";
import path from "path";
import {
    default_body,
    add_and_execute_cell,
    assert_no_error_in_cell,
    execute_all_cells,
    test_jupyter,
    describe_jupyter,
} from "./utils.mjs";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const getEditMode = async (viewer) => {
    return await viewer.evaluate(async (viewer) => {
        return (await viewer.save()).plugin_config.edit_mode;
    });
};

// utils.with_jupyterlab(process.env.__JUPYTERLAB_PORT__, () => {
describe_jupyter(
    () => {
        // Basics
        test_jupyter(
            "Loads data",
            [
                "w = perspective.widget.PerspectiveWidget(arrow_data, columns=['f64', 'str', 'datetime'])",
                "w",
            ],
            async ({ page }) => {
                await default_body(page);
                const num_columns = await page
                    .locator("regular-table thead tr")
                    .first()
                    .evaluate((tr) => tr.childElementCount);

                expect(num_columns).toEqual(3);
                await expect(
                    page.locator("regular-table tbody tr")
                ).toHaveCount(5);
            }
        );

        test_jupyter(
            "Loads updates",
            [
                [
                    "server = perspective.Server()",
                    "client = server.new_local_client()",
                    "table = client.table(arrow_data)",
                    "w = perspective.widget.PerspectiveWidget(table, columns=['f64', 'str', 'datetime'])",
                ].join("\n"),
                "w",
                "table.update(arrow_data)",
            ],
            async ({ page }) => {
                await default_body(page);
                const num_columns = await page
                    .locator("regular-table thead tr")
                    .first()
                    .evaluate((tr) => tr.childElementCount);

                expect(num_columns).toEqual(3);

                await expect(
                    page.locator("regular-table tbody tr")
                ).toHaveCount(10);
            }
        );

        test_jupyter(
            "Loads a table",
            [
                [
                    "server = perspective.Server()",
                    "client = server.new_local_client()",
                    "table = client.table(arrow_data)",
                    "w = perspective.widget.PerspectiveWidget(table, columns=['f64', 'str', 'datetime'])",
                ].join("\n"),
                "w",
            ],
            async ({ page }) => {
                await default_body(page);

                const num_columns = await page
                    .locator("regular-table thead tr")
                    .first()
                    .evaluate((tr) => tr.childElementCount);

                expect(num_columns).toEqual(3);

                await expect(
                    page.locator("regular-table tbody tr")
                ).toHaveCount(5);
            }
        );

        test_jupyter(
            "Loads AsyncTable",
            [
                `
server = perspective.Server()
sync_client = server.new_local_client()
sync_client.table({"Income": [5,4,3,2,1], "Expense": [4,3,2,1,1], "Profit": [1,1,1,1,0]}, name="Microstore")
proxy_sess = perspective.ProxySession(sync_client, lambda msg: asyncio.create_task(async_client.handle_response(msg)))

async_client = perspective.AsyncClient(proxy_sess.handle_request_async)
async_table = await async_client.open_table("Microstore")`,
                "w = perspective.widget.PerspectiveWidget(async_table)",
                "w",
            ],
            async ({ page }) => {
                await default_body(page);
                const num_columns = await page
                    .locator("regular-table thead tr")
                    .first()
                    .evaluate((tr) => tr.childElementCount);

                expect(num_columns).toEqual(3);
                await expect(
                    page.locator("regular-table tbody tr")
                ).toHaveCount(5);
            }
        );

        test_jupyter(
            "Loads updates to AsyncTable",
            [
                [
                    `
server = perspective.Server()
sync_client = server.new_local_client()
sync_table = sync_client.table(arrow_data)
proxy_sess = perspective.ProxySession(sync_client, lambda msg: asyncio.create_task(async_client.handle_response(msg)))

async_client = perspective.AsyncClient(proxy_sess.handle_request_async)
async_table = await async_client.open_table(sync_table.get_name())`,
                    "w = perspective.widget.PerspectiveWidget(async_table, columns=['f64', 'str', 'datetime'])",
                ].join("\n"),
                "w",
                "sync_table.update(arrow_data)",
            ],
            async ({ page }) => {
                await default_body(page);
                const num_columns = await page
                    .locator("regular-table thead tr")
                    .first()
                    .evaluate((tr) => tr.childElementCount);

                expect(num_columns).toEqual(3);

                await expect(
                    page.locator("regular-table tbody tr")
                ).toHaveCount(10);
            }
        );
        // Restore

        test_jupyter(
            "Loads with settings=False",
            [
                [
                    "server = perspective.Server()",
                    "client = server.new_local_client()",
                    "table = client.table(arrow_data)",
                    "w = perspective.widget.PerspectiveWidget(table, columns=['f64', 'str', 'datetime'], settings=False)",
                ].join("\n"),
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);
                const settings = await viewer.evaluate(async (viewer) => {
                    return (await viewer.save()).settings;
                });

                expect(settings).toEqual(false);
            }
        );

        test_jupyter(
            "Loads with edit_mode=EDIT",
            [
                [
                    "server = perspective.Server()",
                    "client = server.new_local_client()",
                    "table = client.table(arrow_data)",
                    "w = perspective.widget.PerspectiveWidget(table, plugin_config={'edit_mode': 'EDIT'})",
                ].join("\n"),
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);
                const edit_mode = await getEditMode(viewer);
                expect(edit_mode).toEqual("EDIT");
            }
        );

        test_jupyter(
            "Editable Toggle - from Python",
            [
                [
                    "server = perspective.Server()",
                    "client = server.new_local_client()",
                    "table = client.table(arrow_data)",
                    "w = perspective.widget.PerspectiveWidget(table)",
                ].join("\n"),
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);
                let edit_mode = await getEditMode(viewer);
                expect(edit_mode).toEqual("READ_ONLY");

                await add_and_execute_cell(
                    page,
                    'w.plugin_config = {"edit_mode": "EDIT"}'
                );

                edit_mode = await getEditMode(viewer);
                expect(edit_mode).toEqual("EDIT");
            }
        );

        test_jupyter(
            "Editable Toggle - from JS",
            [
                [
                    "server = perspective.Server()",
                    "client = server.new_local_client()",
                    "table = client.table(arrow_data)",
                    "w = perspective.widget.PerspectiveWidget(table)",
                ].join("\n"),
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);
                let edit_mode = await getEditMode(viewer);
                expect(edit_mode).toEqual("READ_ONLY");

                await viewer.evaluate(async (viewer) => {
                    const edit =
                        viewer.children[1].shadowRoot.querySelector(
                            "span#edit_mode"
                        );
                    edit.click();
                });

                edit_mode = await getEditMode(viewer);
                expect(edit_mode).toEqual("EDIT");
            }
        );

        test_jupyter(
            "Everything Else - Toggle from Python",
            [
                [
                    "server = perspective.Server()",
                    "client = server.new_local_client()",
                    "table = client.table(arrow_data)",
                    "w = perspective.widget.PerspectiveWidget(table)",
                ].join("\n"),
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);
                let config = await viewer.evaluate(async (viewer) => {
                    return await viewer.save();
                });

                // Check default config
                expect(config).toEqual({
                    version: API_VERSION,
                    columns_config: {},
                    aggregates: {},
                    columns: [
                        "ui8",
                        "i8",
                        "ui16",
                        "i16",
                        "ui32",
                        "i32",
                        "ui64",
                        "i64",
                        "f32",
                        "f64",
                        "bool",
                        "str",
                        "date",
                        "datetime",
                    ],
                    expressions: {},
                    filter: [],
                    group_by: [],
                    plugin: "Datagrid",
                    plugin_config: {
                        columns: {},
                        edit_mode: "READ_ONLY",
                        scroll_lock: false,
                    },
                    settings: true,
                    sort: [],
                    split_by: [],
                    theme: "Pro Light",
                    title: null,
                });

                await add_and_execute_cell(
                    page,
                    `
w.plugin = "X Bar"
w.columns = ["ui8"]
w.filter = [["i8", "<", 50]]
w.group_by = ["date"]
w.split_by = ["bool"]
w.sort = [["date", "asc"]]
w.theme = "Pro Dark"`
                );

                // grab the config again
                config = await viewer.evaluate(async (viewer) => {
                    return await viewer.save();
                });

                // and check it
                expect(config).toEqual({
                    version: API_VERSION,
                    columns_config: {},
                    aggregates: {},
                    columns: ["ui8"],
                    expressions: {},
                    filter: [["i8", "<", 50]],
                    group_by: ["date"],
                    plugin: "X Bar",
                    plugin_config: {},
                    settings: true,
                    sort: [["date", "asc"]],
                    split_by: ["bool"],
                    theme: "Pro Dark",
                    title: null,
                });
            }
        );

        test_jupyter(
            "Everything Else - Toggle from JS",
            [
                [
                    "server = perspective.Server()",
                    "client = server.new_local_client()",
                    "table = client.table(arrow_data)",
                    "w = perspective.widget.PerspectiveWidget(table)",
                ].join("\n"),
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);
                const config = await viewer.evaluate(async (viewer) => {
                    return await viewer.save();
                });

                // Check default config
                expect(config).toEqual({
                    version: API_VERSION,
                    columns_config: {},
                    aggregates: {},
                    columns: [
                        "ui8",
                        "i8",
                        "ui16",
                        "i16",
                        "ui32",
                        "i32",
                        "ui64",
                        "i64",
                        "f32",
                        "f64",
                        "bool",
                        "str",
                        "date",
                        "datetime",
                    ],
                    expressions: {},
                    filter: [],
                    group_by: [],
                    plugin: "Datagrid",
                    plugin_config: {
                        columns: {},
                        scroll_lock: false,
                        edit_mode: "READ_ONLY",
                    },
                    settings: true,
                    sort: [],
                    split_by: [],
                    theme: "Pro Light",
                    title: null,
                });

                await viewer.evaluate(async (viewer, version) => {
                    viewer.restore({
                        version,
                        columns: ["ui8"],
                        filter: [["i8", "<", "50"]],
                        group_by: ["date"],
                        plugin: "X Bar",
                        settings: false,
                        sort: [["date", "asc"]],
                        split_by: ["bool"],
                        theme: "Pro Dark",
                        title: null,
                    });

                    return "";
                }, API_VERSION);

                const error_cells_dont_exist = await assert_no_error_in_cell(
                    page,
                    `
assert w.plugin == "X Bar"
assert w.columns == ["ui8"]
assert w.filter == [["i8", "<", "50"]]
assert w.group_by == ["date"]
assert w.split_by == ["bool"]
assert w.plugin_config == {}
assert w.settings == False
assert w.sort == [["date", "asc"]]
assert w.theme == "Pro Dark"
"Passed"`
                );
                expect(error_cells_dont_exist).toBe(true);
            }
        );

        test_jupyter(
            "Edit from frontend - end to end",
            [
                'w = perspective.widget.PerspectiveWidget({"a": [True, False, True], "b": ["abc", "def", "ghi"]}, index="b", plugin_config={"edit_mode": "EDIT"})',
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);

                // assert in python or else
                let error_cells_dont_exist = await assert_no_error_in_cell(
                    page,
                    [
                        `assert w.table.view().to_columns() == {'a': [True, False, True], 'b': ['abc', 'def', 'ghi']}`,
                        `"Passed"`,
                    ].join("\n")
                );
                expect(error_cells_dont_exist).toBe(true);

                // Toggle some values in the frontend
                const bools = await page.$$(".psp-bool-type");

                // do synchronous
                for (let bool of bools) {
                    await bool.click();
                }

                // now check again
                error_cells_dont_exist = await assert_no_error_in_cell(
                    page,
                    [
                        `assert w.table.view().to_columns() == {'a': [False, True, False], 'b': ['abc', 'def', 'ghi']}`,
                        `"Passed"`,
                    ].join("\n")
                );

                expect(error_cells_dont_exist).toBe(true);
            }
        );

        test_jupyter("Restores from saved config", [], async ({ page }) => {
            await execute_all_cells(page);
            let errored = await assert_no_error_in_cell(
                page,
                `
server = perspective.Server()
client = server.new_local_client()
table = client.table(arrow_data)
w = perspective.widget.PerspectiveWidget(table)
config = w.save()
perpsective.PerspectiveWidget(df, **config)
                        `
            );
            expect(errored).toBe(false);
        });

        test_jupyter(
            "Toggles to datagrid and back regression",
            [
                "w = perspective.widget.PerspectiveWidget(arrow_data, columns=['f64', 'str', 'datetime'])",
                "w",
            ],
            async ({ page }) => {
                await default_body(page);
                const num_columns = await page
                    .locator("regular-table thead tr")
                    .first()
                    .evaluate((tr) => tr.childElementCount);

                async function toggle(plugin) {
                    await page.locator(".plugin-select-item").click();
                    await page
                        .locator("#plugin_selector_container.open")
                        .waitFor();

                    await page
                        .locator(`[data-plugin=${plugin}].plugin-select-item`)
                        .click();

                    await page
                        .locator("#plugin_selector_container:not(.open)")
                        .waitFor();

                    await page.evaluate(async () => {
                        await document
                            .querySelector("perspective-viewer")!
                            .flush();
                    });
                }

                await toggle('"X/Y Line"');
                await toggle("Datagrid");
                await toggle('"X/Y Line"');
                await toggle("Datagrid");

                // expect(num_columns).toEqual(3);
                await expect(
                    page.locator("regular-table tbody tr")
                ).toHaveCount(5);
            }
        );

        // *************************
        // UTILS
        // *************************
        test_jupyter(
            "Run in Cell - Assert in Cell working",
            [],
            async ({ page }) => {
                await execute_all_cells(page);

                // assert_no_error_in_cell runs add_and_execute_cell internally so only need to check one
                const error_cells_dont_exist = await assert_no_error_in_cell(
                    page,
                    "raise Exception('anything')"
                );
                expect(error_cells_dont_exist).toBe(false);
            }
        );
    },
    { name: "Simple", root: path.join(__dirname, "..", "..") }
);
// });
