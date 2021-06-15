/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const {start_jlab, kill_jlab} = require("./jlab_start");
const {get} = require("http");

module.exports = async function() {
    let proc = await start_jlab();
    console.log(proc);
    get(`http://127.0.0.1:6538`, res => {
        console.log(res.statusCode);
        console.log(res.headers);
        console.log(`Jupyterlab server has started...`);
    });

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
