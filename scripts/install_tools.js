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
    console.log("-- Installing Boost 1.82.0");
    execute`wget https://boostorg.jfrog.io/artifactory/main/release/1.82.0/source/boost_1_82_0.tar.gz >/dev/null 2>&1`;
    execute`tar xfz boost_1_82_0.tar.gz`;
    process.chdir("boost_1_82_0");
    execute`./bootstrap.sh`;
    if (process.platform === "linux") {
        execute`./b2 -j8 cxxflags=-fPIC cflags=-fPIC -a --with-program_options --with-filesystem --with-thread --with-system install`;
    } else {
        execute`./b2 -j8 architecture=arm+x86 cxxflags=-fPIC cflags=-fPIC -a --with-program_options --with-filesystem --with-thread --with-system install`;
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
