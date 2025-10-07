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

import { make_session } from "@finos/perspective";
import * as securities from "./securities.mjs";
import * as path from "node:path";
import { promises as fs } from "node:fs";
import http from "node:http";
import { WebSocketServer as HttpWebSocketServer } from "ws";

// Don't need this table since it won't be read from node itself, just need
// to create it so the WebSocket clients can find it.
const _TABLE = await securities.getTable();

const CONTENT_TYPES = {
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".arrow": "arraybuffer",
    ".feather": "arraybuffer",
    ".wasm": "application/wasm",
};

// node buffer -> JS buffer
function buffer_to_arraybuffer(buffer) {
    return new Int8Array(
        buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.length,
        ),
    );
}

const app = new HttpWebSocketServer({
    noServer: true,
    perMessageDeflate: true,
});

app.on("connection", async (ws) => {
    console.log("Connecting websocket ...");
    const session = await make_session(async (proto) => {
        ws.send(buffer_to_arraybuffer(proto));
    });

    ws.on("message", (proto) => {
        session.handle_request(buffer_to_arraybuffer(proto));
    });

    ws.on("close", () => {
        session.close();
    });
});

const web_server = http.createServer(
    async function static_files(request, response) {
        let url =
            request.url
                ?.split(/[\?\#]/)[0]
                .replace(/@[\^~]?\d+.[\d\*]*.[\d\*]*/, "") || "/";

        if (url === "/") {
            url = "/index.html";
        }

        const extname = path.extname(url);
        const contentType = CONTENT_TYPES[extname] || "text/html";
        try {
            const content = await fs.readFile(`dist/${url}`);
            if (typeof content !== "undefined") {
                response.writeHead(200, { "Content-Type": contentType });
                response.end(content, "utf-8");
                console.error(`200 ${url}`);
                return;
            }

            console.error(`404 ${url}`);
            response.writeHead(404);
            response.end("", "utf-8");
        } catch (error) {
            console.error(`500 ${url} ${error}`);
            response.writeHead(500);
            response.end("", "utf-8");
        }
    },
);

web_server.on("upgrade", (request, socket, head) => {
    console.log("200 Websocket upgrade");
    app.handleUpgrade(request, socket, head, (sock) =>
        app.emit("connection", sock, request),
    );
});

web_server.listen(8081, () => {
    console.log(`Listening on ${web_server.address().port}`);
});
