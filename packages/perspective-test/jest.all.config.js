module.exports = {
    roots: [
        "packages/perspective/test/js",
        "packages/perspective-viewer/test/js",
        "packages/perspective-viewer-hypergrid/test/js",
        "packages/perspective-viewer-highcharts/test/js",
        "packages/perspective-viewer-d3fc/test/js"
    ],
    verbose: true,
    testURL: "http://localhost/",
    transform: {
        ".js$": "@finos/perspective-test/src/js/transform.js",
        ".html$": "html-loader-jest"
    },
    automock: false,
    setupFiles: ["@finos/perspective-test/src/js/beforeEachSpec.js"]
};
