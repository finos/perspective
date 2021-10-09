/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {WebSocketManager, perspective_assets, Table} from "@finos/perspective";
import path from "path";
import express from "express";
import expressWs from "express-ws";
import {AddressInfo} from "net";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {securities} from "../../datasources";

const app = expressWs(express()).app;

const manager = new WebSocketManager();
securities().then((table: Table) => manager.host_table("remote_table", table));

app.ws("/subscribe", (ws) => manager.add_connection(ws));
app.use("/", perspective_assets([path.resolve(__dirname, "../assets")], true));

const server = app.listen(8080, () =>
    console.log(`Listening on port ${(server.address() as AddressInfo).port}`)
);
