/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {WebSocketServer, table} = require("@finos/perspective");
const exec = require("child_process").exec;

function execute(command, callback) {
    exec(command, {maxBuffer: 1024 * 5000}, function (error, stdout) {
        callback(stdout);
    });
}

const server = new WebSocketServer({assets: [__dirname]});

execute(
    `git log --date=iso --pretty=format:'"%h","%an","%aD","%s","%ae"'`,
    (log) => {
        const tbl = table("Hash,Name,Date,Message,Email\n" + log);
        server.host_table("data_source_one", tbl);
    }
);
