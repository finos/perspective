module.exports = {
    // rootDir: "../",
    roots: ["test/js/"],
    verbose: true,
    testURL: "http://localhost/",
    transform: {
        ".js$": "@finos/perspective-test/src/js/transform.js",
        ".html$": "html-loader-jest"
    },
    transformIgnorePatterns: ["/node_modules/(?!lit-html).+\\.js"],
    automock: false,
    setupFiles: ["@finos/perspective-test/src/js/beforeEachSpec.js"],
    reporters: ["default", "@finos/perspective-test/src/js/reporter.js"]
};
