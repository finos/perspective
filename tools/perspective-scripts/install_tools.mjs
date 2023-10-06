// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import sh from "./sh.mjs";
import * as url from "url";

export function install_boost(version = "1_82_0") {
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
    cmd.sh`tar xfz boost_1_82_0.tar.gz`;
    cmd.sh`cd boost_1_82_0`;
    cmd.sh`./bootstrap.sh`;
    cmd.sh`./b2 ${flags} install`;
    cmd.sh`cd ..`;
    cmd.sh`rm -rf boost_1_82_0`;
    return cmd;
}

// Unit test
if (process.platform === "darwin") {
    console.assert(
        install_boost().toString() ===
            'wget "https://boostorg.jfrog.io/artifactory/main/release/1.82.0/source/boost_1_82_0.tar.gz" \
>/dev/null 2>&1 && tar xfz boost_1_82_0.tar.gz && cd boost_1_82_0 && ./bootstrap.sh && \
sudo ./b2 -j8 cxxflags=-fPIC cflags=-fPIC -a --with-program_options --with-filesystem \
--with-thread --with-system architecture=arm+x86 install && cd ..',
    );
}

if (import.meta.url.startsWith("file:")) {
    if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
        console.log("-- Installing Boost 1.82.0");
        install_boost().runSync();
    }
}
