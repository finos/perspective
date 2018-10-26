/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {WebSocketHost} = require("@jpmorganchase/perspective");
const exec = require("child_process").exec;

function execute(command, callback) {
    exec(command, function(error, stdout) {
        callback(stdout);
    });
}

execute(`git log --date=iso --pretty=format:'"%h","%an","%aD","%s","%ae"'`, log => {
    const host = new WebSocketHost({assets: [__dirname]});
    host.open("data_source_one", "Hash,Name,Date,Message,Email\n" + log);
});
