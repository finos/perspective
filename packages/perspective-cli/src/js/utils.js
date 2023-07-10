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

const exec = require("child_process").exec;
const { table } = require("@finos/perspective");

const OPEN = (port) => `
if which xdg-open > /dev/null
then
    xdg-open http://localhost:${port}/
elif which gnome-open > /dev/null
then
    gnome-open http://localhost:${port}/
elif which open > /dev/null
then
    open http://localhost:${port}/
fi`;

function infer_table(buffer) {
    if (buffer.slice(0, 6).toString() === "ARROW1") {
        console.log("Loaded Arrow");
        return table(buffer.buffer);
    } else {
        let text = buffer.toString();
        try {
            let json = JSON.parse(text);
            console.log("Loaded JSON");
            return table(json);
        } catch (e) {
            console.log("Loaded CSV");
            return table(text);
        }
    }
}

module.exports.read_stdin = function read_stdin() {
    const ret = [];
    let len = 0;
    return new Promise((resolve) => {
        process.stdin
            .on("readable", function () {
                let chunk;
                while ((chunk = process.stdin.read())) {
                    ret.push(Buffer.from(chunk));
                    len += chunk.length;
                }
            })
            .on("end", function () {
                const buffer = Buffer.concat(ret, len);
                resolve(infer_table(buffer));
            });
    });
};

module.exports.execute = function execute(command, callback) {
    exec(command, function (error, stdout) {
        if (callback) {
            callback(stdout);
        }
    });
};

module.exports.open_browser = function open_browser(port) {
    module.exports.execute(OPEN(port), console.log);
};
