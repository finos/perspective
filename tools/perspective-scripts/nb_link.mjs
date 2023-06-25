/******************************************************************************
 *
 * Copyright (c) 2022, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import sh from "./sh.mjs";

const nb_path = sh.path`${__dirname}/../../python/perspective/perspective/nbextension/static`;
const json_path = sh.path`${__dirname}/../../python/perspective/perspective/extension/finos-perspective-nbextension.json`;

sh`mkdir -p ~/.jupyter/nbextensions/@finos/`.runSync();
sh`mkdir -p ~/.jupyter/nbconfig/notebook.d/`.runSync();
sh`ln -s ${nb_path} ~/.jupyter/nbextensions/@finos/perspective-jupyterlab`.runSync();
sh`ln -s ${json_path} ~/.jupyter/nbconfig/notebook.d/`.runSync();
console.log("Done");
