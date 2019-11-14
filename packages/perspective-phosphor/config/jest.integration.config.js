const config = require("@finos/perspective-test/jest.config");

module.exports = Object.assign({}, config, {
    roots: ["./js"],
    rootDir: "../test/integration"
});
