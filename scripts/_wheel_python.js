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
    manylinux_version,
    copy_files_to_python_folder,
} = require("./script_utils.js");
const IS_DOCKER = process.env.PSP_DOCKER;
const IS_MACOS = getarg("--macos");
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
try {
    console.log("Copying assets to `dist` folder");
    copy_files_to_python_folder();
    const obj = resolve`${__dirname}/../python/perspective/dist/obj`;
    clean(obj);

    let cmd = bash``;

    // Create a wheel
    if (MANYLINUX_VERSION) {
        // install deps
        const boost = [
            `yum -y install wget libffi-devel`,
            `wget https://boostorg.jfrog.io/artifactory/main/release/1.71.0/source/boost_1_71_0.tar.gz >/dev/null`,
            `tar xfz boost_1_71_0.tar.gz`,
            "cd boost_1_71_0",
            `./bootstrap.sh`,
            `./b2 -j8 --with-program_options --with-filesystem --with-system install`,
            `cd ..`,
        ].join(" && ");

        // This always runs in docker for now so install boost
        cmd += ` ${boost} && `;

        // These are system deps that may only be in place from pep-517/518 so
        // lets reinstall them to be sure
        cmd += `${PYTHON} -m pip install -U 'numpy>=1.13.1' wheel twine auditwheel && `;

        // remove the build folder so we completely rebuild (and pick up the
        // libs we just installed above, since this build method won't use
        // pep-517/518)
        cmd += `rm -rf build/ && `;

        // now build the wheel in place
        cmd += `${PYTHON} setup.py build_ext bdist_wheel `;

        // Use auditwheel on Linux - repaired wheels are in
        // `python/perspective/wheelhouse`.
        cmd += `&& ${PYTHON} -m auditwheel -v show ./dist/*.whl && ${PYTHON} -m auditwheel -v repair -L .lib ./dist/*.whl `;
    } else if (IS_MACOS) {
        // Don't need to do any cleaning here since we will reuse the cmake
        // cache and numpy paths from the pep-517/518 build in build_python.js
        cmd += `${PYTHON} setup.py build_ext bdist_wheel `;
        cmd += " && mkdir -p ./wheelhouse && cp -v ./dist/*.whl ./wheelhouse ";
    } else {
        // Windows
        cmd += `${PYTHON} setup.py build_ext bdist_wheel `;
    }

    // TODO: MacOS wheel processed with delocate segfaults on
    // `import perspective`.

    if (IS_DOCKER) {
        console.log(
            `Building wheel for \`perspective-python\` using image \`${IMAGE}\` in Docker`
        );
        execute`${docker(IMAGE)} bash -c "cd python/perspective && ${cmd}"`;
    } else {
        console.log(`Building wheel for \`perspective-python\``);
        const python_path = resolve`${__dirname}/../python/perspective`;
        execute`cd ${python_path} && ${cmd}`;
    }
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
