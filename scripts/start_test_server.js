const {
    WebSocketServer,
} = require("@finos/perspective/dist/cjs/perspective.node.js");

const path = require("path");

server = new WebSocketServer({
    assets: [path.join(__dirname, "..")],
    port: 6598,
});
