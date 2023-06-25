/******************************************************************************
 *
 * Copyright (c) 2022, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import sh from "./sh.mjs";

const lab_path = sh.path`${__dirname}/../../python/perspective/perspective/labextension`;

sh`mkdir -p ~/.jupyter/labextensions/@finos/`.runSync();
sh`ln -s ${lab_path} ~/.jupyter/labextensions/@finos/perspective-jupyterlab`.runSync();
console.log("Done");
