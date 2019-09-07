module.exports = {
    // rootDir: "../",
    roots: ["test/js/"],
    verbose: true,
    testURL: "http://localhost/",
    transform: {
        ".js$": "@finos/perspective-test/src/js/transform.js",
        ".html$": "html-loader-jest"
    },
    automock: false,
    setupFiles: ["@finos/perspective-test/src/js/beforeEachSpec.js"]
};
