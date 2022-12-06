const perspective = require("@finos/perspective");
const { securities } = require("../datasources");

const host = new perspective.WebSocketServer({ port: 8081 });
securities().then((table) => host.host_table("securities_table", table));
