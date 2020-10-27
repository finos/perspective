const perspective = require("@finos/perspective");
const {securities} = require("../datasources");

const host = new perspective.WebSocketServer();
securities().then(table => host.host_table("securities_table", table));
