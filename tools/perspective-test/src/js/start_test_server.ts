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

import path from "node:path";
import url from "node:url";
import http from "node:http";
import * as fs from "node:fs";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function read_promise(filePath: string) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, function (error, content) {
            if (error && error.code !== "ENOENT") {
                reject(error);
            } else {
                resolve(content);
            }
        });
    });
}

const CONTENT_TYPES: Record<string, string> = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".arrow": "arraybuffer",
    ".feather": "arraybuffer",
    ".wasm": "application/wasm",
};

async function cwd_static_file_handler(
    request: http.IncomingMessage,
    response: http.ServerResponse<http.IncomingMessage>,
    assets = ["./"]
) {
    let url =
        request.url
            ?.split(/[\?\#]/)[0]
            .replace(/@[\^~]?\d+.[\d\*]*.[\d\*]*/, "") || "/";

    if (url === "/") {
        url = "/index.html";
    }

    let extname = path.extname(url);
    let contentType = CONTENT_TYPES[extname] || "text/html";
    try {
        for (const root of assets) {
            let filePath = root + url;
            let content = await read_promise(filePath);
            if (typeof content !== "undefined") {
                console.log(`200 ${url}`);
                response.writeHead(200, {
                    "Content-Type": contentType,
                    "Access-Control-Allow-Origin": "*",
                });
                if (extname === ".arrow" || extname === ".feather") {
                    response.end(content, "utf-8");
                } else {
                    response.end(content);
                }

                return;
            }
        }

        console.error(`404 ${url}`);
        response.writeHead(404);
        response.end("", "utf-8");
    } catch (error) {
        console.error(`500 ${url}`);
        response.writeHead(500);
        response.end("", "utf-8");
    }
}

const _server = http.createServer((x, y) =>
    cwd_static_file_handler(x, y, [
        path.join(__dirname, "..", "..", "..", ".."),
    ])
);

_server.listen({ port: 6598 });
