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
    if (process.platform === "linux") {
        console.log("-- Installing Boost 1.71.0");
        execute`wget https://dl.bintray.com/boostorg/release/1.71.0/source/boost_1_71_0.tar.gz >/dev/null 2>&1`;
        execute`tar xfz boost_1_71_0.tar.gz`;
        process.chdir("boost_1_71_0");
        execute`./bootstrap.sh`;
        execute`./b2 -j8 --with-program_options --with-filesystem --with-system install `;

        console.log("-- Installing Flatbuffers");
        execute`mkdir -p /usr/local`;
        process.chdir("/usr/local");
        execute`git clone https://github.com/google/flatbuffers.git`;
        process.chdir("/usr/local/flatbuffers");
        execute`cmake -G "Unix Makefiles"`;
        execute`make`;
        execute`cp -r /usr/local/flatbuffers/include/flatbuffers /usr/local/include`;
        execute`ln -s /usr/local/flatbuffers/flatc /usr/local/bin/flatc`;
        execute`chmod +x /usr/local/flatbuffers/flatc`;
    }
} catch (e) {
    console.log(e.message);
    process.exit(1);
}
