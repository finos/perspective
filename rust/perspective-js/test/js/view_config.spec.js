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

import { test, expect } from "@finos/perspective-test";
import perspective from "./perspective_client";

const data = [
    { x: 1, y: "a", z: true },
    { x: 2, y: "b", z: false },
    { x: 3, y: "c", z: true },
    {
        x: 4,
        y: "abcdefghijklmnopqrstuvwxyz",
        z: false,
    },
];

((perspective) => {
    test.describe("View config", function () {
        test("Non-interned filter strings do not create corrupted view configs", async function () {
            const table = await perspective.table(data);
            const view = await table.view({
                filter: [["y", "==", "abcdefghijklmnopqrstuvwxyz"]],
            });

            const config = await view.get_config();
            expect(config.filter).toEqual([
                ["y", "==", "abcdefghijklmnopqrstuvwxyz"],
            ]);

            view.delete();
            table.delete();
        });

        test("Default aggregates are omitted", async function () {
            const table = await perspective.table(data);
            const view = await table.view({
                group_by: ["y"],
                columns: ["x", "z"],
                aggregates: { x: "sum", z: "count" },
            });

            const config = await view.get_config();
            expect(config).toEqual({
                aggregates: {},
                columns: ["x", "z"],
                expressions: {},
                filter: [],
                group_by: ["y"],
                sort: [],
                split_by: [],
            });

            view.delete();
            table.delete();
        });

        test("Non-default aggregates are provided", async function () {
            const table = await perspective.table(data);
            const view = await table.view({
                group_by: ["y"],
                columns: ["x", "z"],
                aggregates: { x: "count", z: "sum" },
            });

            const config = await view.get_config();
            expect(config).toEqual({
                aggregates: { x: "count", z: "sum" },
                columns: ["x", "z"],
                expressions: {},
                filter: [],
                group_by: ["y"],
                sort: [],
                split_by: [],
            });

            view.delete();
            table.delete();
        });

        test("Mixed aggregates are provided and omitted", async function () {
            const table = await perspective.table(data);
            const view = await table.view({
                group_by: ["y"],
                columns: ["x", "z"],
                aggregates: { x: "sum", z: "mean" },
            });

            const config = await view.get_config();
            expect(config).toEqual({
                aggregates: { z: "mean" },
                columns: ["x", "z"],
                expressions: {},
                filter: [],
                group_by: ["y"],
                sort: [],
                split_by: [],
            });

            view.delete();
            table.delete();
        });

        test("Compound aggregates are provided", async function () {
            const table = await perspective.table(data);
            const view = await table.view({
                group_by: ["y"],
                columns: ["x", "z"],
                aggregates: { x: ["weighted mean", ["y"]] },
            });

            const config = await view.get_config();
            expect(config).toEqual({
                aggregates: { x: ["weighted mean", ["y"]] },
                columns: ["x", "z"],
                expressions: {},
                filter: [],
                group_by: ["y"],
                sort: [],
                split_by: [],
            });

            view.delete();
            table.delete();
        });
    });
})(perspective);
