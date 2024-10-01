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

const CSV = "x,y,z\n1,2,3\n4,5,6";

test.describe("CSV Constructors", function () {
    test("Handles String format", async function () {
        const table = await perspective.table(CSV);
        const v = await table.view();
        const json = await v.to_json();
        expect(json).toEqual([
            { x: 1, y: 2, z: 3 },
            { x: 4, y: 5, z: 6 },
        ]);
    });

    test("Handles String format with explicit format option", async function () {
        const table = await perspective.table(CSV, {
            format: "csv",
        });
        const v = await table.view();
        const json = await v.to_json();
        expect(json).toEqual([
            { x: 1, y: 2, z: 3 },
            { x: 4, y: 5, z: 6 },
        ]);
    });

    test("Handles ArrayBuffer format", async function () {
        var enc = new TextEncoder();
        const table = await perspective.table(enc.encode(CSV).buffer, {
            format: "csv",
        });
        const v = await table.view();
        const json = await v.to_json();
        expect(json).toEqual([
            { x: 1, y: 2, z: 3 },
            { x: 4, y: 5, z: 6 },
        ]);
    });

    test("Handles UInt8Arry format", async function () {
        var enc = new TextEncoder();
        const table = await perspective.table(enc.encode(CSV), {
            format: "csv",
        });
        const v = await table.view();
        const json = await v.to_json();
        expect(json).toEqual([
            { x: 1, y: 2, z: 3 },
            { x: 4, y: 5, z: 6 },
        ]);
    });
});
