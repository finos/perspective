/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {execute} = require("./script_utils.js");

try {
    let scope =
        process.env.PACKAGE && process.env.PACKAGE !== ""
            ? `${process.env.PACKAGE}`
            : "";
    if (scope) {
        execute`GODEBUG=asyncpreemptoff=1 lerna exec --scope="@finos/${scope}" -- yarn build`;
    } else {
        execute`GODEBUG=asyncpreemptoff=1 yarn build:js:parallel`;
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
