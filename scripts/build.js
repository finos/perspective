/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const fs = require("fs");
require("dotenv").config({path: "./.perspectiverc"});

if (!fs.existsSync("./.perspectiverc")) {
    console.error("No .perspectiverc, running setup");
    process.env.PSP_BUILD_IMMEDIATELY = 1;
    require("./setup");
} else if (process.env.PSP_PROJECT === "js") {
    require("./build_js");
} else if (process.env.PSP_PROJECT === "python") {
    require("./build_python");
} else if (process.env.PSP_PROJECT === "cpp") {
    require("./build_cpp");
} else if (process.env.PSP_PROJECT === "") {
    require("./build_js");
    require("./build_python");
    require("./build_cpp");
} else {
    console.error(
        `Invalid project "${process.env.PSP_PROJECT}" selected, running setup`
    );
    process.env.PSP_BUILD_IMMEDIATELY = 1;
    require("./setup");
}
