module.exports = {
    transform: {
        ".js$": "@finos/perspective-test/src/js/transform.js"
    },
    setupFiles: ["@finos/perspective-test/src/js/beforeEachSpec.js"],
    rootDir: "../test/unit/"
};
