/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as dotenv from "dotenv";
import sh from "./sh.mjs";

dotenv.config({ path: "./.perspectiverc" });
const args = process.argv.slice(2);

if (process.env.PSP_PROJECT === undefined || process.env.PSP_PROJECT === "js") {
    sh`yarn && sudo nice -n -20 npm run bench`
        .cwd("tools/perspective-bench")
        .runSync();
} else {
    sh`python3 ${args}`.env({ PYTHONPATH: "./python/perspective" }).runSync();
}
