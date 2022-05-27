/******************************************************************************
 *
 * Copyright (c) 2022, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const { execute } = require("./script_utils.js");
const path = require("path");

const lab_path = path.resolve(
    path.join(
        __dirname,
        "..",
        "python",
        "perspective",
        "perspective",
        "labextension"
    )
);

(async function () {
    try {
        execute`mkdir -p ~/.jupyter/labextensions/@finos/`;
        execute`ln -s ${lab_path} ~/.jupyter/labextensions/@finos/perspective-jupyterlab`;
        console.log("Done");
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
