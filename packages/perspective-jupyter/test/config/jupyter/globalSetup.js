/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const {start_jlab, kill_jlab} = require("./jlab_start");

module.exports = async function () {
    await start_jlab();

    // At this point, Jupyterlab has already been started by the main test
    // runner, so all we need to do is set up the signal listeners to
    // clean up the Jupyter process if we Ctrl-C.
    process.on("SIGINT", kill_jlab);
    process.on("SIGABRT", kill_jlab);

    // execute the standard globalSetup.js which will set up the
    // Puppeteer browser instance.
    const setup = require(`@finos/perspective-test/src/js/globalSetup.js`);
    await setup();
};
