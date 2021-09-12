const config = require("@finos/perspective-test/jest.config");

module.exports = Object.assign({}, config, {
    roots: ["../test/js/integration"],
});
