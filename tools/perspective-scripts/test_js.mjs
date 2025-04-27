// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import sh from "./sh.mjs";
import { getarg, run_with_scope, get_scope } from "./sh_perspective.mjs";
import minimatch from "minimatch";

// Unfortunately we have to handle parts of the Jupyter test case here,
// as the Jupyter server needs to be run outside of the main Jest process.
const IS_JUPYTER =
    !!getarg("--jupyter") &&
    process.env.PACKAGE.indexOf("perspective-jupyterlab") > -1;

if (getarg("--debug")) {
    console.log("-- Running tests in debug mode.");
}

const IS_PLAYWRIGHT = get_scope().reduce(
    (is_playwright, pkg) =>
        is_playwright ||
        [
            "perspective-docs",
            "perspective-cli",
            "perspective-js",
            "perspective",
            "perspective-react",
            "perspective-viewer",
            "perspective-viewer-datagrid",
            "perspective-viewer-d3fc",
            "perspective-viewer-openlayers",
            "perspective-viewer-workspace",
            "perspective-workspace",
            "perspective-jupyter",
        ].includes(pkg),
    false
);

const IS_RUST = get_scope().reduce(
    (is_playwright, pkg) => is_playwright || ["perspective-rs"].includes(pkg),
    false
);

const IS_CI = process.env.CI || getarg("--ci") ? "CI=1" : "";
if (IS_CI) {
    console.log("-- Running tests in CI mode.");
}

function playwright(pkg, is_jlab) {
    const pkg_name = `"${pkg}" ` || "";
    console.log(`-- Running ${pkg_name}Playwright test suite`);
    const args = process.argv
        .slice(2)
        .filter((x) => x !== "--ci" && x !== "--jupyter");

    const env = {};
    if (is_jlab) {
        env.PSP_JUPYTERLAB_TESTS = 1;
        env.__JUPYTERLAB_PORT__ = 6538;
    }

    if (IS_CI) {
        env.CI = 1;
    }

    if (pkg) {
        env.PACKAGE = pkg;
    }

    return sh`
        TZ=UTC
        npx playwright test
        --config=tools/perspective-test/playwright.config.ts
        ${args}
    `.env(env);
}

if (!IS_JUPYTER) {
    // test:build irrelevant for jupyter tests
    await run_with_scope`test:build`;
}

if (process.env.PACKAGE) {
    if (IS_JUPYTER) {
        // Jupyterlab is guaranteed to have started at this point, so
        // copy the test files over and run the tests.
        await run_with_scope`test:jupyter:build`;
        playwright("perspective-jupyterlab", true).runSync();
        process.exit(0);
    }

    if (IS_PLAYWRIGHT) {
        playwright(process.env.PACKAGE).runSync();
    }

    if (
        process.env.PACKAGE.indexOf("perspective-python") >= 0 &&
        process.env.PACKAGE.indexOf("!perspective-python") === -1
    ) {
        // Support `pnpm test -- --my_cool --test_arguments`
        const args = process.argv.slice(2);
        sh`pnpm run --recursive --filter @finos/perspective-python test ${args}`.runSync();
    }

    if (IS_RUST) {
        let target = "";
        let flags = "--release";
        if (!!process.env.PSP_DEBUG) {
            flags = "";
        }

        if (
            process.env.PSP_ARCH === "x86_64" &&
            process.platform === "darwin"
        ) {
            target = "--target=x86_64-apple-darwin";
        } else if (
            process.env.PSP_ARCH === "aarch64" &&
            process.platform === "darwin"
        ) {
            target = "--target=aarch64-apple-darwin";
        } else if (
            process.env.PSP_ARCH === "x86_64" &&
            process.platform === "linux"
        ) {
            target =
                "--target=x86_64-unknown-linux-gnu --compatibility manylinux_2_28";
        } else if (
            process.env.PSP_ARCH === "aarch64" &&
            process.platform === "linux"
        ) {
            target = "--target=aarch64-unknown-linux-gnu";
        }

        sh`cargo test ${flags} ${target} -p perspective -p perspective-client`.runSync();
    }
} else {
    console.log("-- Running all tests");
    playwright().runSync();
}
