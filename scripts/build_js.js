/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {execute} = require("./script_utils.js");

function lerna() {
    execute`lerna run build --loglevel silent --scope="@finos/${process.env.PACKAGE}"`;
}

try {
    lerna();
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
