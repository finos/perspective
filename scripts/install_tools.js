/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const sh = require("./sh.js").default;

exports.install_boost = function install_boost(version = "1_82_0") {
    const version_dash = version.replace(/\./g, "_");
    const version_dot = version.replace(/_/g, ".");
    const URL = `https://boostorg.jfrog.io/artifactory/main/release/${version_dot}/source/boost_${version_dash}.tar.gz`;
    const flags = [
        "-j8",
        "cxxflags=-fPIC",
        "cflags=-fPIC",
        "-a",
        "--with-program_options",
        "--with-filesystem",
        "--with-thread",
        "--with-system",
    ].map(sh);

    if (process.platform === "darwin") {
        flags.push(sh`architecture=arm+x86`);
    }

    const cmd = sh`wget ${URL} >/dev/null 2>&1`;
    cmd.and_sh`tar xfz boost_1_82_0.tar.gz`;
    cmd.and_sh`cd boost_1_82_0`;
    cmd.and_sh`./bootstrap.sh`;
    cmd.and_sh`./b2 ${flags} install`;
    cmd.and_sh`cd ..`;
    return cmd;
};

// Unit test
if (process.platform === "darwin") {
    console.assert(
        exports.install_boost().toString() ===
            'wget "https://boostorg.jfrog.io/artifactory/main/release/1.82.0/source/boost_1_82_0.tar.gz" \
>/dev/null 2>&1 && tar xfz boost_1_82_0.tar.gz && cd boost_1_82_0 && ./bootstrap.sh && \
./b2 -j8 cxxflags=-fPIC cflags=-fPIC -a --with-program_options --with-filesystem \
--with-thread --with-system architecture=arm+x86 install'
    );
}

if (require.main === module) {
    console.log("-- Installing Boost 1.82.0");
    exports.install_boost().runSync();
}
