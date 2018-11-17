/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {WebSocketHost} = require("@jpmorganchase/perspective/build/perspective.node.js");
const exec = require("child_process").exec;

const OPEN = `
if which xdg-open > /dev/null
then
  xdg-open http://localhost:8080/
elif which gnome-open > /dev/null
then
  gnome-open http://localhost:8080/
elif which open > /dev/null
then
  open http://localhost:8080/
fi`;

function execute(command, callback) {
    exec(command, function(error, stdout) {
        if (callback) {
            callback(stdout);
        }
    });
}
const host = new WebSocketHost({assets: [__dirname]});

let ret = [],
    len = 0;

process.stdin
    .on("readable", function() {
        let chunk;
        while ((chunk = process.stdin.read())) {
            ret.push(new Buffer(chunk));
            len += chunk.length;
        }
    })
    .on("end", function() {
        const buf = Buffer.concat(ret, len);
        if (buf.slice(0, 6).toString() === "ARROW1") {
            host.open("data_source_one", buf.buffer);
            console.log("Loaded Arrow");
        } else {
            let text = buf.toString();
            try {
                let json = JSON.parse(text);
                host.open("data_source_one", json);
                console.log("Loaded JSON");
            } catch (e) {
                host.open("data_source_one", text);
                console.log("Loaded CSV");
            }
        }
        execute(OPEN, console.log);
    });
