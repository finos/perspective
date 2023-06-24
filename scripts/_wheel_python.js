/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {
    docker,
    clean,
    getarg,
    python_version,
    python_image,
    manylinux_version,
    copy_files_to_python_folder,
} = require("./script_utils.js");
const sh = require("./sh.js").default;
const IS_DOCKER = process.env.PSP_DOCKER || getarg("--docker");
const IS_MACOS = getarg("--macos");
const IS_ARM = getarg("--arm");
const { install_boost } = require("./install_tools.js");
let IMAGE = "manylinux2014";
let MANYLINUX_VERSION;
let PYTHON;

if (IS_DOCKER) {
    MANYLINUX_VERSION = manylinux_version();
    PYTHON = python_version(true);
    IMAGE = python_image(MANYLINUX_VERSION, "xxx");
} else {
    PYTHON = python_version();
}

/**
 * Using Perspective's docker images, create a wheel built for the image
 * architecture and output it to the local filesystem. A thin wrapper around
 * `bdist_wheel`, except it also automatically calls `auditwheel` (Linux) or
 * `delocate` on Mac.
 */

console.log("Copying assets to `dist` folder");
copy_files_to_python_folder();
const obj = sh.path`${__dirname}/../python/perspective/dist/obj`;
clean(obj);

let cmd = sh();

// Create a wheel
if (MANYLINUX_VERSION) {
    // install deps
    cmd.and_sh`yum -y install wget libffi-devel`;

    // This always runs in docker for now so install boost
    cmd.and_sh(install_boost());

    // These are system deps that may only be in place from pep-517/518 so
    // lets reinstall them to be sure
    cmd.and_sh`${PYTHON} -m pip install -U 'numpy>=1.13.1' jupyter_packaging wheel twine auditwheel`;

    // remove the build folder so we completely rebuild (and pick up the
    // libs we just installed above, since this build method won't use
    // pep-517/518)
    cmd.and_sh`rm -rf build/`;

    // now build the wheel in place
    cmd.and_sh`${PYTHON} setup.py build_ext bdist_wheel`;

    // Use auditwheel on Linux - repaired wheels are in
    // `python/perspective/wheelhouse`.
    cmd.and_sh`${PYTHON} -m auditwheel -v show ./dist/*.whl`;
    cmd.and_sh`${PYTHON} -m auditwheel -v repair -L .lib ./dist/*.whl`;
} else if (IS_MACOS) {
    // Don't need to do any cleaning here since we will reuse the cmake
    // cache and numpy paths from the pep-517/518 build in build_python.js
    cmd.and_sh`${PYTHON} setup.py build_ext bdist_wheel`;
    if (IS_ARM) {
        cmd.env({ CMAKE_OSX_ARCHITECTURES: "arm64" });
        cmd.sh`--plat-name=macosx_11_0_arm64 `;
    } else {
        cmd.env({ CMAKE_OSX_ARCHITECTURES: "86_64" });
    }

    cmd.and_sh`mkdir -p ./wheelhouse`;
    cmd.and_sh`cp -v ./dist/*.whl ./wheelhouse`;
} else {
    // Windows
    cmd.and_sh`${PYTHON} setup.py build_ext bdist_wheel`;
}

// TODO: MacOS wheel processed with delocate segfaults on
// `import perspective`.
if (IS_DOCKER) {
    console.log(
        `Building wheel for \`perspective-python\` using image \`${IMAGE}\` in Docker`
    );
    sh`${sh(docker(IMAGE))} bash -c ${sh`cd python/perspective`
        .and_sh(cmd)
        .toString()}`.runSync();
} else {
    console.log(`Building wheel for \`perspective-python\``);
    const python_path = sh.path`${__dirname}/../python/perspective`;
    sh`cd ${python_path}`.and_sh(cmd).runSync();
}
