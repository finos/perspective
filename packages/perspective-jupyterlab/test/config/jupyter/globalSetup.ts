/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { start_jlab, kill_jlab } from "./jlab_start.mjs";

async function globalSetup() {
    // Start Jupyterlab in the background
    await start_jlab();

    // At this point, Jupyterlab has already been started by the main test
    // runner, so all we need to do is set up the signal listeners to
    // clean up the Jupyter process if we Ctrl-C.
    process.on("SIGINT", kill_jlab);
    process.on("SIGABRT", kill_jlab);
}

export default globalSetup;
