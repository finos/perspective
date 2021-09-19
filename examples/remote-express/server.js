/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {WebSocketManager, perspective_assets} = require("@finos/perspective");
const express = require("express");
const expressWs = require("express-ws");
const {securities} = require("../datasources");

const app = express();
expressWs(app);

// create Perspective WebSocketManager and host table
const manager = new WebSocketManager();
securities().then((table) => manager.host_table("remote_table", table));

// add connection to manager whenever a new client connects
app.ws("/subscribe", (ws) => manager.add_connection(ws));

app.use("/", perspective_assets([__dirname], true));

const server = app.listen(8080, () =>
    console.log(`Listening on port ${server.address().port}`)
);
