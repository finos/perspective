const perspective = require("@finos/perspective");
const {securities} = require("../datasources");

const host = new perspective.WebSocketServer();
securities().then(table => host.host_view("securities", table.view()));
