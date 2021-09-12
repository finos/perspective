module.exports = {
    roots: [
        "packages/perspective/test/js",
        "rust/perspective-viewer/test/js",
        "packages/perspective-viewer-datagrid/test/js",
        "packages/perspective-viewer-d3fc/test/js",
        "packages/perspective-workspace/test/js",
        "packages/perspective-jupyterlab/test/js",
    ],
    verbose: true,
    testURL: "http://localhost/",
    transform: {
        ".js$": "@finos/perspective-test/src/js/transform.js",
        ".html$": "html-loader-jest",
        // Transform typescript for perspective-jupyterlab
        ".ts": "ts-jest",
    },
    collectCoverage: true,
    collectCoverageFrom: ["packages/perspective/dist/cjs/**"],
    coverageProvider: "v8",
    coverageReporters: ["cobertura", "text"],
    // perspective-jupyterlab tests mock `@jupyter-widgets`, which is in
    // Typescript.
    transformIgnorePatterns: [
        "/node_modules/(?!(lit-html|@jupyter-widgets)/).+$",
    ],
    automock: false,
    setupFiles: ["@finos/perspective-test/src/js/beforeEachSpec.js"],
    reporters: [
        "default",
        "@finos/perspective-test/src/js/reporter.js",
        "jest-junit",
    ],
    globalSetup: "@finos/perspective-test/src/js/globalSetup.js",
    globalTeardown: "@finos/perspective-test/src/js/globalTeardown.js",
};
