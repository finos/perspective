/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const { execute } = require("./script_utils.js");

try {
    console.log("-- Installing Boost 1.81.0");
    execute`wget https://boostorg.jfrog.io/artifactory/main/release/1.81.0/source/boost_1_81_0.tar.gz >/dev/null 2>&1`;
    execute`tar xfz boost_1_81_0.tar.gz`;
    process.chdir("boost_1_81_0");
    execute`./bootstrap.sh`;
    execute`./b2 -j8 --with-program_options --with-filesystem --with-system install `;
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
