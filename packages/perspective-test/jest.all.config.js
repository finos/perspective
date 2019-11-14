module.exports = {
    roots: [
        "packages/perspective/test/js",
        "packages/perspective-viewer/test/js",
        "packages/perspective-viewer-hypergrid/test/js",
        "packages/perspective-viewer-highcharts/test/js",
        "packages/perspective-viewer-d3fc/test/js",
        "packages/perspective-phosphor/test/"
    ],
    verbose: true,
    testURL: "http://localhost/",
    transform: {
        ".js$": "@finos/perspective-test/src/js/transform.js",
        ".html$": "html-loader-jest"
    },
    transformIgnorePatterns: ["/node_modules/(?!lit-html).+$"],
    automock: false,
    setupFiles: ["@finos/perspective-test/src/js/beforeEachSpec.js"],
    reporters: ["default", "@finos/perspective-test/src/js/reporter.js"]
};
