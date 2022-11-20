/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
require("dotenv").config({ path: "./.perspectiverc" });

const { execute } = require("./script_utils.js");

const args = process.argv.slice(2);

if (process.env.PSP_PROJECT === undefined || process.env.PSP_PROJECT === "js") {
    try {
        execute(
            `cd tools/perspective-bench && yarn && sudo nice -n -20 yarn bench`
        );
    } catch (e) {
        process.exit(1);
    } finally {
        process.exit(0);
    }
} else {
    try {
        /**
         * Usage: `yarn bench PATH_TO_SCRIPT -c10 -r5 -s2
         *
         * -c number of clients to run
         * -r number of times to run each task within each client
         * -s seconds to sleep between each task run
         */
        execute`PYTHONPATH=./python/perspective python3 ${args.join(" ")}`;
    } catch (e) {
        process.exit(1);
    } finally {
        process.exit(0);
    }
}
