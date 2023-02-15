import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

// Read .perspectiverc
// Put the projects to test in the projects Object.
// Run.

const get_base_url = (pkg) =>
    `"http://localhost:7497/packages/${pkg}/dist/umd/"`;

// TODO: add .perspectiverc to env
require("dotenv").config({ path: "./.perspectiverc" });
const path = require("path");

const PACKAGE = process.env.PACKAGE;
const PACKAGES = PACKAGE?.split(",") || [
    "perspective-viewer-d3fc",
    "perspective-viewer-datagrid" /* TODO: REST */,
];
const DEVICES = ["Desktop Chrome", "Desktop Firefox", "Desktop Safari"];

const PROJECTS = PACKAGES?.reduce((acc, p) => {
    for (let device of DEVICES) {
        acc.push({
            name: `${p}-${device}`,
            testDir: path.join(__dirname, `../../packages/${p}/test/js`),
            use: {
                ...devices[device],
                packageURL: `/packages/${p}/dist/umd`,
                baseURL: `http://localhost:6598`,
            },
        });
    }

    return acc;
}, [] as object[]);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    // testDir: "./tools/playwright/tests",
    /* Maximum time one test can run for. */
    timeout: 30 * 1000,
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
    projects: PROJECTS,
    /* Run your local dev server before starting the tests */
    webServer: {
        command: "node ../../scripts/start_test_server.js",
        port: 6598,
        reuseExistingServer: true,
    },
});
