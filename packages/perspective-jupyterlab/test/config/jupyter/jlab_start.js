/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const path = require("path");
const {get} = require("http");
const {spawn} = require("child_process");
const {execute} = require("../../../../../scripts/script_utils");

const ROOT = path.join(__dirname, "..", "..", "..", "..", "..");
const PACKAGE_ROOT = path.join(__dirname, "..", "..", "..");

/**
 * Kill the Jupyterlab process created by the tests.
 */
const kill_jlab = () => {
    console.log("-- Cleaning up Jupyterlab process");
    execute`pkill -f "jupyter-lab --no-browser --port=${process.env.__JUPYTERLAB_PORT__}"`;
};

exports.kill_jlab = kill_jlab;

/**
 * Block until the Jupyterlab server is ready.
 */
const wait_for_jlab = async function() {
    let num_errors = 0;
    let loaded = false;

    while (!loaded) {
        get(`http://localhost:${process.env.__JUPYTERLAB_PORT__}`, res => {
            console.log(res.statusCode);
            console.log(res.headers);
            console.log(`Jupyterlab server has started on ${process.env.__JUPYTERLAB_PORT__}`);
            loaded = true;
        }).on("error", err => {
            if (num_errors > 5) {
                kill_jlab();
                throw new Error(`Could not launch Jupyterlab: ${err}`);
            }

            num_errors++;
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
};

if (require.main === module) {
    /*
     * Spawn the Jupyterlab server. This script is separate from the rest of the
     * Jest code as it cannot be executed within the Puppeteer Docker image,
     * so it is run as a separate process by the test_js script.
     */
    try {
        // TODO be able to stop this proc somehow after the fact
        process.env.JUPYTER_CONFIG_DIR = path.join(PACKAGE_ROOT, "test", "config", "jupyter");

        // start jupyterlab with a root to dist/umd where the notebooks will be.
        process.chdir(path.join(PACKAGE_ROOT, "dist", "umd"));

        console.log("Spawning Jupyterlab process");
        spawn("jupyter", ["lab", "--no-browser", `--port=${process.env.__JUPYTERLAB_PORT__}`, `--config=${process.env.JUPYTER_CONFIG_DIR}/jupyter_notebook_config.json`], {
            env: {
                ...process.env,
                PYTHONPATH: path.join(ROOT, "python", "perspective")
            }
        });

        // Wait for Jupyterlab to start up
        wait_for_jlab().then(() => {
            execute`ps aux | grep jupyterlab`;
            execute`jupyter server list`;
            process.exit(0);
        });
    } catch (e) {
        console.error(e);
        kill_jlab();
        process.exit(1);
    }
}
