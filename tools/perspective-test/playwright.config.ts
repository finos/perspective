import { defineConfig, devices } from "@playwright/test";
import path from "path";
import * as dotenv from "dotenv";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// TODO: add .perspectiverc to env
dotenv.config({ path: "./.perspectiverc" });

const TEST_SERVER_PORT = 6598;

// NOTE: Not using process.cwd() so that playwright command can be called from other directories.
const TOP_LEVEL_CWD = path.join(__dirname, "../../");

const packagesInfo = [
    {
        packageName: "perspective-viewer",
        testDir: path.join(TOP_LEVEL_CWD, "rust/perspective-viewer/test/js"),
        packageURL:
            "/rust/perspective-viewer/dist/packages/perspective/dist/umd",
    },

    {
        packageName: "perspective-viewer-datagrid",
        testDir: path.join(
            TOP_LEVEL_CWD,
            "packages/perspective-viewer-datagrid/test/js"
        ),
        packageURL: "/packages/perspective-viewer-datagrid/dist/umd",
    },

    {
        packageName: "perspective-viewer-d3fc",
        testDir: path.join(
            TOP_LEVEL_CWD,
            "packages/perspective-viewer-d3fc/test/js"
        ),
        packageURL: "/packages/perspective-viewer-d3fc/dist/umd",
    },

    {
        packageName: "perspective-viewer-openlayers",
        testDir: path.join(
            TOP_LEVEL_CWD,
            "packages/perspective-viewer-openlayers/test/js"
        ),
        packageURL: "/packages/perspective-viewer-openlayers/dist/umd",
    },

    {
        packageName: "perspective-jupyterlab",
        testDir: path.join(
            TOP_LEVEL_CWD,
            "packages/perspective-jupyterlab/test/js"
        ),
        packageURL: "/packages/perspective-jupyterlab/dist/umd",
    },

    {
        packageName: "perspective-workspace",
        testDir: path.join(
            TOP_LEVEL_CWD,
            "packages/perspective-workspace/test/js"
        ),
        packageURL: "/packages/perspective-workspace/dist/umd",
    },
];

const defaultPackages = [
    "perspective-viewer-d3fc",
    "perspective-viewer-datagrid",
    // "perspective-viewer-openlayers",
    "perspective-jupyterlab",
    "perspective-workspace",
    "perspective-viewer",
];

const PACKAGES = process.env.PACKAGE?.split(",") || defaultPackages;

const filteredPackageInfo = packagesInfo.filter(({ packageName }) => {
    return PACKAGES.includes(packageName);
});

const RUN_JUPYTERLAB = PACKAGES.includes("perspective-jupyterlab");

// NOTE: for now, omitting "Desktop Firefox" tests.
const defaultDevices = ["Desktop Chrome", "Desktop Safari"];

const DEVICES = process.env.DEVICES?.split(",") || defaultDevices;

const projects = Object.values(filteredPackageInfo).reduce(
    (acc, { packageName, testDir, packageURL }) => {
        for (let device of DEVICES) {
            acc.push({
                name: `${packageName}-${device
                    .toLowerCase()
                    .replace(" ", "-")}`,
                testDir,
                use: {
                    ...devices[device],
                    packageURL,
                    baseURL: `http://localhost:${TEST_SERVER_PORT}`,
                },
            });
        }

        return acc;
    },
    [] as object[]
);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    /* Maximum time one test can run for. */
    timeout: 80 * 1000,
    expect: {
        /**
         * Maximum time expect() should wait for the condition to be met.
         * For example in `await expect(locator).toHaveText();`
         */
        timeout: 5000,
    },
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: "html",
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
        actionTimeout: 0,
        // /* Base URL to use in actions like `await page.goto('/')`. */
        // baseURL: "http://localhost:6598",

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "on-first-retry",
    },

    globalSetup: RUN_JUPYTERLAB
        ? require.resolve(
              path.join(
                  TOP_LEVEL_CWD,
                  "packages/perspective-jupyterlab/test/config/jupyter/globalSetup.ts"
              )
          )
        : undefined,

    globalTeardown: RUN_JUPYTERLAB
        ? require.resolve(
              path.join(
                  TOP_LEVEL_CWD,
                  "packages/perspective-jupyterlab/test/config/jupyter/globalTeardown.ts"
              )
          )
        : undefined,

    snapshotPathTemplate:
        "__snapshots__/{projectName}/{testFilePath}/{arg}{ext}",
    projects,
    /* Run your local dev server before starting the tests */
    webServer: {
        command: "node ../../scripts/start_test_server.js",
        port: TEST_SERVER_PORT,
        reuseExistingServer: true,
    },
});
