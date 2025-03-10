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
import { test_arrow } from "./test_arrows";

test("Can get hosted table name from worker", async () => {
    const testTableName1 = Math.random().toString();
    const _table = await perspective.table(test_arrow, {
        name: testTableName1,
    });
    const names = await perspective.get_hosted_table_names();

    expect(names).toContain(testTableName1);

    const testTableName2 = Math.random().toString();
    const _table2 = await perspective.table(test_arrow, {
        name: testTableName2,
    });
    const names2 = await perspective.get_hosted_table_names();

    expect(names2).toContain(testTableName1);
    expect(names2).toContain(testTableName2);
    await _table.delete();
    await _table2.delete();
});

test("Can subscribe to hosted table changes from worker", async () => {
    let count = 0;
    const id = perspective.on_hosted_tables_update(() => {
        count += 1;
    });

    const testTableName1 = Math.random().toString();
    const _table = await perspective.table(test_arrow, {
        name: testTableName1,
    });
    expect(count).toEqual(1);

    const testTableName2 = Math.random().toString();
    const _table2 = await perspective.table(test_arrow, {
        name: testTableName2,
    });
    expect(count).toEqual(2);
    await _table.delete();
    expect(count).toEqual(3);
    await _table2.delete();
    expect(count).toEqual(4);
});
