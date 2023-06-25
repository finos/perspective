/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { run_with_scope } from "./sh_perspective.mjs";
import sh from "./sh.mjs";

async function run() {
    try {
        sh`mkdirp docs/build docs/obj`.runSync();
        const project = process.env.PSP_PROJECT;
        if (!project || project === "js" || project === "python") {
            await run_with_scope`docs`;
        }
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
}

run();
