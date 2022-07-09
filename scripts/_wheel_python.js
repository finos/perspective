/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {
    execute,
    docker,
    clean,
    resolve,
    getarg,
    bash,
    python_version,
    python_image,
    python_tag,
    manylinux_version,
} = require("./script_utils.js");
const fs = require("fs-extra");
const IS_MACOS = getarg("--macos");
const MANYLINUX_VERSION = manylinux_version();
const PYTHON = python_version();

/**
 * Using Perspective's docker images, create a wheel built for the image
 * architecture and output it to the local filesystem. A thin wrapper around
 * `bdist_wheel`, except it also automatically calls `auditwheel` (Linux) or
 * `delocate` on Mac.
 */
try {
    console.log("Copying assets to `dist` folder");
    const dist = resolve`${__dirname}/../python/perspective/dist`;
    const cpp = resolve`${__dirname}/../cpp/perspective`;
    const lic = resolve`${__dirname}/../LICENSE`;
    const cmake = resolve`${__dirname}/../cmake`;
    const dcmake = resolve`${dist}/cmake`;
    const dlic = resolve`${dist}/LICENSE`;
    const obj = resolve`${dist}/obj`;

    fs.mkdirpSync(dist);
    fs.copySync(cpp, dist, {preserveTimestamps: true});
    fs.copySync(lic, dlic, {preserveTimestamps: true});
    fs.copySync(cmake, dcmake, {preserveTimestamps: true});
    clean(obj);

    let cmd = bash`CI=true `;

    // Create a wheel
    if (MANYLINUX_VERSION) {
        // install deps
        const boost = [
            `yum -y install wget`,
            `wget https://boostorg.jfrog.io/artifactory/main/release/1.71.0/source/boost_1_71_0.tar.gz >/dev/null`,
            `tar xfz boost_1_71_0.tar.gz`,
            "cd boost_1_71_0",
            `./bootstrap.sh`,
            `./b2 -j8 --with-program_options --with-filesystem --with-system install`,
            `cd ..`,
        ].join(" && ");

        cmd += 'CIBW_PLATFORM="linux" ';
        cmd += `CIBW_MANYLINUX_X86_64_IMAGE="${MANYLINUX_VERSION}" `;
        cmd += `CIBW_BEFORE_ALL="${boost}"`;
    } else if (IS_MACOS) {
        cmd += 'CIBW_PLATFORM="macos" ';
        cmd += 'CIBW_ARCHS_MACOS="x86_64 arm64" ';
    } else {
        cmd += 'CIBW_PLATFORM="windows" ';
    }

    cmd += `CIBW_BUILD="${python_tag()}*" `;
    cmd += `${PYTHON} -m cibuildwheel `;

    console.log(`Building wheel for \`perspective-python\``);

    const python_path = resolve`${__dirname}/../python/perspective`;
    execute`cd ${python_path} && ${cmd}`;

} catch (e) {
    console.error(e.message);
    process.exit(1);
}
