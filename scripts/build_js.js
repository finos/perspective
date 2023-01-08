/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const { run_with_scope } = require("./script_utils.js");

async function run() {
    try {
        await run_with_scope`build`;
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
}

run();
