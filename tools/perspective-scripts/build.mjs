/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: "./.perspectiverc" });

if (!fs.existsSync("./.perspectiverc")) {
    console.error("No .perspectiverc, running setup");
    process.env.PSP_BUILD_IMMEDIATELY = 1;
    await import("./setup.mjs");
} else if (process.env.PSP_PROJECT === "js") {
    await import("./build_js.mjs");
} else if (process.env.PSP_PROJECT === "python") {
    await import("./build_python.mjs");
} else if (process.env.PSP_PROJECT === "cpp") {
    await import("./build_cpp");
} else if (process.env.PSP_PROJECT === "") {
    await import("./build_js.mjs");
    await import("./build_python.mjs");
    await import("./build_cpp");
} else {
    console.error(
        `Invalid project "${process.env.PSP_PROJECT}" selected, running setup`
    );
    process.env.PSP_BUILD_IMMEDIATELY = 1;
    await import("./setup.mjs");
}
