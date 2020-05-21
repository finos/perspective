/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const perspective = require("../../dist/cjs/perspective.node.js");

let server;
let port;

describe("WebSocketManager", function() {
    beforeAll(() => {
        server = new perspective.WebSocketServer({port: 0});
        port = server._server.address().port;
    });

    afterAll(() => {
        server.close();
    });

    it("sends initial data client on subscribe", async () => {
        const data = [{x: 1}];
        const table = perspective.table(data);
        server.host_table("test", table);

        const client = perspective.websocket(`ws://localhost:${port}`);
        const client_table = client.open_table("test");
        const client_data = await client_table.view().to_json();
        expect(client_data).toEqual(data);

        await client.terminate();
        server.eject_table("test");
    });

    it("sends initial data multiples client on subscribe", async () => {
        const data = [{x: 1}];
        const table = perspective.table(data);
        server.host_table("test", table);

        const client_1 = perspective.websocket(`ws://localhost:${port}`);
        const client_2 = perspective.websocket(`ws://localhost:${port}`);

        const client_1_table = client_1.open_table("test");
        const client_2_table = client_2.open_table("test");

        const client_1_data = await client_1_table.view().to_json();
        const client_2_data = await client_2_table.view().to_json();

        await client_1.terminate();
        await client_2.terminate();

        expect(client_1_data).toEqual(data);
        expect(client_2_data).toEqual(data);
        server.eject_table("test");
    });

    it("sends updates to client on subscribe", done => {
        const data = [{x: 1}];
        const table = perspective.table(data);
        server.host_table("test", table);

        const client = perspective.websocket(`ws://localhost:${port}`);
        const client_table = client.open_table("test");

        const client_view = client_table.view();
        // eslint-disable-next-line no-unused-vars
        const on_update = () => {
            client_view.to_json().then(async updated_data => {
                server.eject_table("test");
                expect(updated_data).toEqual([{x: 1}, {x: 2}]);
                await client.terminate();
                setTimeout(done);
            });
        };

        client_view.on_update(on_update);
        client_view.to_json().then(client_data => {
            expect(client_data).toEqual(data);
            table.update([{x: 2}]);
        });
    });

    it("Calls `update` and sends arraybuffers using `is_transferable`", async () => {
        const data = [{x: 1}];
        const table = perspective.table(data);
        const view = table.view();
        const arrow = await view.to_arrow();

        server.host_table("test", table);

        const client = perspective.websocket(`ws://localhost:${port}`);
        const client_table = client.open_table("test");

        client_table.update(arrow);

        const client_data = await client_table.view().to_json();
        expect(client_data).toEqual([{x: 1}, {x: 1}]);

        await client.terminate();
        server.eject_table("test");
    });

    it("Calls `update` and sends arraybuffers using `is_transferable` multiple times", async () => {
        const data = [{x: 1}];
        const table = perspective.table(data);
        const view = table.view();
        const arrow = await view.to_arrow();

        server.host_table("test", table);

        const client = perspective.websocket(`ws://localhost:${port}`);
        const client_table = client.open_table("test");

        client_table.update(arrow);
        client_table.update(arrow);
        client_table.update(arrow);

        const client_data = await client_table.view().to_json();
        expect(client_data).toEqual([{x: 1}, {x: 1}, {x: 1}, {x: 1}]);

        await client.terminate();
        server.eject_table("test");
    });
});
