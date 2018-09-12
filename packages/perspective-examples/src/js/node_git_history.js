/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {WebSocketHost} = require("@jpmorganchase/perspective/build/perspective.node.js");
const fs = require("fs");
const exec = require('child_process').exec;

function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};

execute(`git log --date=iso --pretty=format:'"%h","%an","%aD","%s","%ae"'`, log => {
    const host = new WebSocketHost(3000);
    host.open("superstore.arrow", "Hash,Name,Date,Message,Email\n" + log);
});
