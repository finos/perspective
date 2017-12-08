/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const perspective = require('./perspective.node.js');
const WebSocket = require('ws');
const http = require('http');
const queryString = require('query-string');

/******************************************************************************
 *
 * Perspective data store
 *
 */

const schema = {
    name: "string",
    client: "string",
    lastUpdate: "date",
    chg: "float",
    bid: "float",
    ask: "float",
    vol: "float",
    id: "integer"
};

const table = perspective.table(schema, {index: "id"});

const view = table.view({
    row_pivot: ["name"],
    aggregate: Object.keys(schema).map(col => ({op: "last", column: col}))
});

/******************************************************************************
 *
 * Websocket Streaming API
 *
 */

const wss = new WebSocket.Server({port: 8080});

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    }); 
};

wss.on('connection', function connection(ws) {
    view.to_json().then(data => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    });
    ws.on('error', console.error);
});

let requests = 0;

view.on_update(data => {
    requests++;
    var data = JSON.stringify(data);
    wss.broadcast(data);
});

function logTime() {
    if (requests > 0) {
        console.log(`Processing ${requests / 10}reqs/s`);
    }
    requests = 0;
    setTimeout(logTime, 10000);
}

setTimeout(logTime, 10000);

/******************************************************************************
 *
 * HTTP Updating API
 *
 */

const server = http.createServer((request, response) => {
    var tick = request.url.split("?");
    if (!tick[1]) return;
    var tick = queryString.parse(tick[1].trim());
    for (var key of Object.keys(tick)) {
        if (schema[key] === "float" || schema[key === "integer"]) {
            tick[key] = Number.parseFloat(tick[key]);
        } 
    }
    delete tick[''];
    table.update([tick]);
    response.end("Processed");
});

server.listen(3000, "0.0.0.0", (err) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`Server is listening on 3000`);
    }
})