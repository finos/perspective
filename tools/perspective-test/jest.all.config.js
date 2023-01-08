module.exports = {
    roots: [
        "packages/perspective/test/js",
        "rust/perspective-viewer/test/js",
        "packages/perspective-viewer-datagrid/test/js",
        "packages/perspective-viewer-d3fc/test/js",
        "packages/perspective-workspace/test/js",
        "packages/perspective-jupyterlab/test/js",
    ],
    testEnvironment: "@finos/perspective-test/src/js/set_timezone.js",
    testEnvironmentOptions: {
        url: "http://localhost/",
    },
    transform: {
        ".html$": "html-loader-jest",
    },
    // collectCoverage: true,
    // collectCoverageFrom: ["packages/perspective/dist/cjs/**"],
    // coverageProvider: "v8",
    // coverageReporters: ["cobertura", "text"],
    setupFilesAfterEnv: ["@finos/perspective-test/src/js/set_timezone.js"],

    // perspective-jupyterlab tests mock `@jupyter-widgets`, which is in
    // Typescript.
    transformIgnorePatterns: [
        "/node_modules/(?!(d3|internmap|delaunator|robust-predicates|@jupyter-widgets)).+\\.js",
    ],
    automock: false,
    setupFiles: ["@finos/perspective-test/src/js/beforeEachSpec.js"],
    reporters: ["default", "jest-junit"],
    globalSetup: "@finos/perspective-test/src/js/globalSetup.js",
    globalTeardown: "@finos/perspective-test/src/js/globalTeardown.js",
};
