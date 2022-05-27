/******************************************************************************
 *
 * Copyright (c) 2022, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const {execute} = require("./script_utils.js");
const path = require("path");

const nb_path = path.resolve(
    path.join(
        __dirname,
        "..",
        "python",
        "perspective",
        "perspective",
        "nbextension",
        "static"
    )
);
const json_path = path.resolve(
    path.join(
        __dirname,
        "..",
        "python",
        "perspective",
        "perspective",
        "extension",
        "finos-perspective-nbextension.json"
    )
);

(async function () {
    try {
        execute`mkdir -p ~/.jupyter/nbextensions/@finos/`;
        execute`mkdir -p ~/.jupyter/nbconfig/notebook.d/`;
        execute`ln -s ${nb_path} ~/.jupyter/nbextensions/@finos/perspective-jupyterlab`;
        execute`ln -s ${json_path} ~/.jupyter/nbconfig/notebook.d/`;
        console.log("Done");
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
