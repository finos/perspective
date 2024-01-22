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

const { expect } = require("@finos/perspective-test");
const path = require("path");
const utils = require("@finos/perspective-test");
const {
    default_body,
    add_and_execute_cell,
    assert_no_error_in_cell,
    execute_all_cells,
    test_jupyter,
    describe_jupyter,
} = require("./utils");

const getEditable = async (viewer) => {
    return await viewer.evaluate(async (viewer) => {
        return (await viewer.save()).plugin_config.editable;
    });
};

// utils.with_jupyterlab(process.env.__JUPYTERLAB_PORT__, () => {
describe_jupyter(
    () => {
        // Basics
        test_jupyter(
            "Loads data",
            [
                "w = perspective.PerspectiveWidget(arrow_data, columns=['f64', 'str', 'datetime'])",
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);
                const num_columns = await viewer.evaluate(async (viewer) => {
                    const tbl = viewer
                        .querySelector("perspective-viewer-datagrid")
                        .shadowRoot.querySelector("regular-table");
                    return tbl.querySelector("thead tr").childElementCount;
                });

                expect(num_columns).toEqual(3);

                const num_rows = await viewer.evaluate(async (viewer) => {
                    const tbl = viewer
                        .querySelector("perspective-viewer-datagrid")
                        .shadowRoot.querySelector("regular-table");
                    return tbl.querySelectorAll("tbody tr").length;
                });

                expect(num_rows).toEqual(5);
            }
        );

        test_jupyter(
            "Loads updates",
            [
                [
                    "table = perspective.Table(arrow_data)",
                    "w = perspective.PerspectiveWidget(table, columns=['f64', 'str', 'datetime'])",
                ].join("\n"),
                "w",
                "table.update(arrow_data)",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);
                const num_columns = await viewer.evaluate(async (viewer) => {
                    const tbl = viewer
                        .querySelector("perspective-viewer-datagrid")
                        .shadowRoot.querySelector("regular-table");
                    return tbl.querySelector("thead tr").childElementCount;
                });

                expect(num_columns).toEqual(3);

                const num_rows = await viewer.evaluate(async (viewer) => {
                    const tbl = viewer
                        .querySelector("perspective-viewer-datagrid")
                        .shadowRoot.querySelector("regular-table");
                    return tbl.querySelectorAll("tbody tr").length;
                });

                expect(num_rows).toEqual(10);
            }
        );
        test_jupyter(
            "Loads a table",
            [
                [
                    "table = perspective.Table(arrow_data)",
                    "w = perspective.PerspectiveWidget(table, columns=['f64', 'str', 'datetime'])",
                ].join("\n"),
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);
                const num_columns = await viewer.evaluate(async (viewer) => {
                    const tbl = viewer
                        .querySelector("perspective-viewer-datagrid")
                        .shadowRoot.querySelector("regular-table");

                    return tbl.querySelector("thead tr").childElementCount;
                });

                expect(num_columns).toEqual(3);

                const num_rows = await viewer.evaluate(async (viewer) => {
                    const tbl = viewer
                        .querySelector("perspective-viewer-datagrid")
                        .shadowRoot.querySelector("regular-table");
                    return tbl.querySelectorAll("tbody tr").length;
                });

                expect(num_rows).toEqual(5);
            }
        );

        // Restore

        test_jupyter(
            "Loads with settings=False",
            [
                [
                    "table = perspective.Table(arrow_data)",
                    "w = perspective.PerspectiveWidget(table, columns=['f64', 'str', 'datetime'], settings=False)",
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
            "Loads with editable=True",
            [
                [
                    "table = perspective.Table(arrow_data)",
                    "w = perspective.PerspectiveWidget(table, plugin_config={'editable': True})",
                ].join("\n"),
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);
                const editable = await getEditable(viewer);
                expect(editable).toEqual(true);
            }
        );

        test_jupyter(
            "Editable Toggle - from Python",
            [
                [
                    "table = perspective.Table(arrow_data)",
                    "w = perspective.PerspectiveWidget(table)",
                ].join("\n"),
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);
                let editable = await getEditable(viewer);
                expect(editable).toEqual(false);

                await add_and_execute_cell(
                    page,
                    'w.plugin_config = {"editable": True}'
                );

                editable = await getEditable(viewer);
                expect(editable).toEqual(true);
            }
        );
        test_jupyter(
            "Editable Toggle - from JS",
            [
                [
                    "table = perspective.Table(arrow_data)",
                    "w = perspective.PerspectiveWidget(table)",
                ].join("\n"),
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);
                let editable = await getEditable(viewer);
                expect(editable).toEqual(false);

                await viewer.evaluate(async (viewer) => {
                    const edit =
                        viewer.children[1].shadowRoot.querySelector(
                            "span#edit_mode"
                        );
                    edit.click();
                });

                editable = await getEditable(viewer);
                expect(editable).toEqual(true);
            }
        );

        test_jupyter(
            "Everything Else - Toggle from Python",
            [
                [
                    "table = perspective.Table(arrow_data)",
                    "w = perspective.PerspectiveWidget(table)",
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
                    version: utils.API_VERSION,
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
                        editable: false,
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
w.filter = ["i8", "<", 50]
w.group_by = ["date"]
w.split_by = ["bool"]
w.sort = ["date", "asc"]
w.theme = "Pro Dark"`
                );

                // grab the config again
                config = await viewer.evaluate(async (viewer) => {
                    return await viewer.save();
                });

                // and check it
                expect(config).toEqual({
                    version: utils.API_VERSION,
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
                    "table = perspective.Table(arrow_data)",
                    "w = perspective.PerspectiveWidget(table)",
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
                    version: utils.API_VERSION,
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
                        editable: false,
                        scroll_lock: false,
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
                }, utils.API_VERSION);

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
                'w = perspective.PerspectiveWidget({"a": [True, False, True], "b": ["abc", "def", "ghi"]}, index="b", plugin_config={"editable": True})',
                "w",
            ],
            async ({ page }) => {
                const viewer = await default_body(page);

                // assert in python or else
                let error_cells_dont_exist = await assert_no_error_in_cell(
                    page,
                    [
                        `assert w.table.view().to_df().to_dict() == {'a': {0: True, 1: False, 2: True}, 'b': {0: 'abc', 1: 'def', 2: 'ghi'}}`,
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
                        `assert w.table.view().to_df().to_dict() == {'a': {0: False, 1: True, 2: False}, 'b': {0: 'abc', 1: 'def', 2: 'ghi'}}`,
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
                table = perspective.Table(arrow_data)
                w = perspective.PerspectiveWidget(table)
                config = w.save()
                perpsective.PerspectiveWidget(df, **config)
                `
            );
            expect(errored).toBe(false);
        });

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
