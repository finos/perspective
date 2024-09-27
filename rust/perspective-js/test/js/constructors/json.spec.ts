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
import perspective from "../perspective_client";

const TEST_JSON = { x: [1, 4], y: [2, 5], z: [3, 6] };

test.describe("JSON", function () {
    test.describe("Integer columns", function () {
        test("Integer columns can be updated with all JSON numeric types and cousins", async function () {
            const table = await perspective.table({ x: "integer" });
            await table.update([{ x: 0 }]);
            await table.update([{ x: 1 }]);
            await table.update([{ x: undefined }]);
            await table.update([{ x: null }]);
            await table.update([{ x: 7.23 }]);
            await table.update([{ x: -6 }]);
            await table.update([{ x: Infinity }]);
            await table.update([{ x: "100.1" }]);
            await table.update([{ x: "11" }]);
            const v = await table.view();
            const json = await v.to_json();
            expect(json).toEqual([
                { x: 0 },
                { x: 1 },
                { x: null },
                { x: null },
                { x: 7 },
                { x: -6 },
                { x: null },
                { x: 100 },
                { x: 11 },
            ]);
        });
    });

    test("Handles String format", async function () {
        const table = await perspective.table(JSON.stringify(TEST_JSON), {
            format: "columns",
        });
        const v = await table.view();
        const json = await v.to_json();
        expect(json).toEqual([
            { x: 1, y: 2, z: 3 },
            { x: 4, y: 5, z: 6 },
        ]);
    });

    test("Handles UInt8Array format", async function () {
        const enc = new TextEncoder();
        const table = await perspective.table(
            enc.encode(JSON.stringify(TEST_JSON)),
            {
                format: "columns",
            }
        );
        const v = await table.view();
        const json = await v.to_json();
        expect(json).toEqual([
            { x: 1, y: 2, z: 3 },
            { x: 4, y: 5, z: 6 },
        ]);
    });

    test("Handles ArrayBuffer format", async function () {
        const enc = new TextEncoder();
        const table = await perspective.table(
            enc.encode(JSON.stringify(TEST_JSON)).buffer,
            {
                format: "columns",
            }
        );
        const v = await table.view();
        const json = await v.to_json();
        expect(json).toEqual([
            { x: 1, y: 2, z: 3 },
            { x: 4, y: 5, z: 6 },
        ]);
    });
});
