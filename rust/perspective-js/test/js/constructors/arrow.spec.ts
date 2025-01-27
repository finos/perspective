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

import * as arrow from "apache-arrow";
import { test, expect } from "@finos/perspective-test";
import perspective from "../perspective_client";

test.describe("Arrow", function () {
    test.describe("Date columns", function () {
        // https://github.com/finos/perspective/issues/2894
        // https://github.com/jdangerx/repro-perspective-float-filter/tree/dates
        test("Date columns are preserved through Arrow in and out", async function () {
            const tableData = arrow.tableFromArrays({
                date: arrow.vectorFromArray([20089], new arrow.Date_()),
            });

            const table = await perspective.table(arrow.tableToIPC(tableData));
            const view = await table.view();
            const json = await view.to_json();

            const d = new Date(json[0].date);
            expect(json[0].date).toEqual(1735689600000);

            // This doesn't test anything except my math
            expect(d.getUTCFullYear()).toEqual(2025);
            expect(d.getUTCDate()).toEqual(1);
            expect(d.getUTCMonth()).toEqual(0);
            expect(d.getUTCHours()).toEqual(0);
            expect(d.getUTCMinutes()).toEqual(0);
            expect(d.getUTCSeconds()).toEqual(0);
            expect(d.getTimezoneOffset()).toEqual(0);
            await view.delete();
            await table.delete();
        });

        test("Date columns are preserved through Arrow in and out, in a negative timezone", async function () {
            process.env.TZ = `America/New_York`;
            const tableData = arrow.tableFromArrays({
                date: arrow.vectorFromArray([20089], new arrow.Date_()),
            });

            const table = await perspective.table(arrow.tableToIPC(tableData));
            const view = await table.view();
            const json = await view.to_json();

            const d = new Date(json[0].date);
            expect(json[0].date).toEqual(1735689600000);
            expect(d.getUTCFullYear()).toEqual(2025);
            expect(d.getUTCDate()).toEqual(1);
            expect(d.getUTCMonth()).toEqual(0);
            expect(d.getUTCHours()).toEqual(0);
            expect(d.getUTCMinutes()).toEqual(0);
            expect(d.getUTCSeconds()).toEqual(0);

            // NY now ...
            expect(d.getTimezoneOffset()).toEqual(300);
            await view.delete();
            await table.delete();
            process.env.TZ = `UTC`;
        });
    });
});
