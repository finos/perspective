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
import { make_client, PerspectiveServer } from "@finos/perspective";

test("Proxy session tunnels requests through client", async () => {
    const { client, server } = connectClientToServer();
    const { proxyClient } = connectProxyClient(client);

    // Verify that main client + proxy client observe the same server
    const clientTables1 = await client.get_hosted_table_names();
    const proxyTables1 = await proxyClient.get_hosted_table_names();
    expect(proxyTables1).toStrictEqual([]);
    expect(proxyTables1).toStrictEqual(clientTables1);
    const name = "abc-" + Math.random();
    const _table = await client.table({ abc: [123] }, { name });
    const clientTables2 = await client.get_hosted_table_names();
    const proxyTables2 = await proxyClient.get_hosted_table_names();
    expect(proxyTables2).toStrictEqual([name]);
    expect(proxyTables2).toStrictEqual(clientTables2);
});

test("Proxy session tunnels on_update callbacks through client", async () => {
    // test.setTimeout(2000);
    const { client } = connectClientToServer();
    const { proxyClient } = connectProxyClient(client);
    const name = "abc-" + Math.random();
    const clientTable = await client.table({ abc: [123] }, { name });

    // Add an on_update callback to the proxy client's view of the table
    const proxyTable = await proxyClient.open_table(name);
    const proxyView = await proxyTable.view();
    let resolveUpdate;
    const onUpdateResp = new Promise((r) => (resolveUpdate = r));
    await proxyView.on_update(
        (x) => {
            resolveUpdate(x);
        },
        { mode: "row" }
    );

    // Enact table update through client's table handle, and assert that proxy
    // client's on_update callback is called
    await clientTable.update({ abc: [999] });
    const expectUpdate = expect.poll(
        async () => {
            const data = await onUpdateResp;
            // TODO: construct table out of onUpdateResp, assert contents?
            console.log("onUpdateResp, with data", data);
            return data;
        },
        {
            message: "Ensure proxy view updates with table",
            timeout: 10000,
        }
    );

    expect(await proxyView.to_columns()).toStrictEqual({ abc: [123, 999] });

    await expectUpdate.toHaveProperty("delta");
    await expectUpdate.toHaveProperty("port_id");
});

function connectClientToServer() {
    const server = new PerspectiveServer();
    const session = server.make_session(async (msg) => {
        await client.handle_response(msg);
    });

    const client = make_client(async (msg) => {
        session.handle_request(msg);
    });

    return {
        client,
        server,
    };
}

function connectProxyClient(client) {
    const sess = client.new_proxy_session((res) => {
        proxyClient.handle_response(res);
    });
    const proxyClient = make_client(async (msg) => {
        // Have to copy msg with slice() because the memory backing it will be
        // deallocated before handle_request() is scheduled and executes
        await sess.handle_request(msg.slice());
    });
    return {
        proxyClient,
    };
}
