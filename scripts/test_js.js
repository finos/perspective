/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const { bash, execute, getarg, run_with_scope } = require("./script_utils.js");
const minimatch = require("minimatch");

// Unfortunately we have to handle parts of the Jupyter test case here,
// as the Jupyter server needs to be run outside of the main Jest process.
const IS_JUPYTER =
    getarg("--jupyter") &&
    minimatch("perspective-jupyterlab", process.env.PACKAGE);

if (getarg("--debug")) {
    console.log("-- Running tests in debug mode.");
}

const IS_CI = process.env.CI || getarg("--ci") ? "CI=1" : "";
if (IS_CI) {
    console.log("-- Running tests in CI mode.");
}

function playwright(package, is_jlab) {
    const pkg_name = `"${package}" ` || "";
    console.log(`-- Running ${pkg_name}Playwright test suite`);
    const args = process.argv
        .slice(2)
        .filter((x) => x !== "--ci" && x !== "--jupyter")
        .join(" ");

    return bash`
        TZ=UTC
        ${is_jlab ? "PSP_JUPYTERLAB_TESTS=1 __JUPYTERLAB_PORT__=6538" : ""}
        ${IS_CI ? "CI=1" : ""}
        ${package ? `PACKAGE=${package}` : ""} 
        npx playwright test
        --config=tools/perspective-test/playwright.config.ts 
        ${args}`;
}

async function run() {
    try {
        if (!IS_JUPYTER) {
            // test:build irrelevant for jupyter tests
            await run_with_scope`test:build`;
        }

        // if (!PACKAGE || minimatch("perspective-viewer", PACKAGE)) {
        //     console.log("-- Running Rust tests");
        //     execute`yarn lerna --scope=@finos/perspective-viewer exec yarn test:run:rust`;
        // }

        if (process.env.PACKAGE) {
            if (IS_JUPYTER) {
                // Jupyterlab is guaranteed to have started at this point, so
                // copy the test files over and run the tests.
                await run_with_scope`test:jupyter:build`;
                execute(playwright("perspective-jupyterlab", true));
                process.exit(0);
            }

            execute(playwright(process.env.PACKAGE));
        } else {
            console.log("-- Running all tests");
            execute(playwright());
        }
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
}

run();
