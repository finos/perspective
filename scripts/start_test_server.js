const {
    WebSocketServer,
} = require("@finos/perspective/dist/cjs/perspective.node.js");

server = new WebSocketServer({
    assets: paths || [path.join(test_root, "dist", "umd")],
    port: 6598,
});
