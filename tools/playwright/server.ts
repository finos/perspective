// Jest does not resolve `exports` field so we must link directly to the file.
const {
    WebSocketServer,
} = require("@finos/perspective/dist/cjs/perspective.node.js");

const path = require("path");

export const with_server = function with_server() {
    let server;
    server = new WebSocketServer({
        assets: paths || [path.join(test_root, "dist", "umd")],
        port: 63354
    },
    });
};
