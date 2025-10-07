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

import moment from "moment";
import * as arrows from "./test_arrows.js";

((perspective) => {
    async function match_delta(
        perspective,
        delta,
        expected,
        formatter = "to_json",
    ) {
        const table = await perspective.table(delta);
        const view = await table.view();
        const result = await view[formatter]();
        expect(result).toEqual(expected);
        await view.delete();
        await table.delete();
    }

    test.describe("Limits", () => {
        test("Limiting rows should not limit the index space", async ({
            page,
        }) => {
            const table = await perspective.table(
                {
                    x: "integer",
                    group: "integer",
                },
                { limit: 10 },
            );

            const data = [];
            for (let i = 0; i < 15; i++) {
                data.push({ x: i, group: 0 });
            }

            await table.update(data);
            const lastByIdx = await (
                await table.view({
                    group_by: ["group"],
                    aggregates: { x: "last by index" },
                })
            ).to_json();
            expect(lastByIdx[0]["x"]).toEqual(14);

            const view = await table.view();
            let viewData = await view.to_json();
            expect(viewData.length).toBe(10);
            expect(viewData).toEqual(data.slice(-10));
        });

        test("Append in sequence", async () => {
            const table = await perspective.table(
                {
                    x: "integer",
                    y: "string",
                    z: "boolean",
                },
                { limit: 2 },
            );

            const v1 = await table.view();
            const v2 = await table.view();

            await table.update({
                x: [0],
                y: ["0"],
            });

            await v1.to_columns();

            await table.update({
                x: [1, 2],
                y: ["1", "2"],
            });

            let result = await v1.to_columns();
            let result2 = await v2.to_columns();

            expect(result["x"]).toEqual([1, 2]);
            expect(result2["y"]).toEqual(["1", "2"]);

            await v2.delete();
            await v1.delete();
            await table.delete();
        });
    });
})(perspective);
