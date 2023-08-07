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

import {
    default as sh,
    clean,
    getarg,
    python_version,
    copy_files_to_python_folder,
} from "./sh_perspective.mjs";

import { install_boost } from "./install_tools.mjs";
import url from "url";

const IS_DOCKER = process.env.PSP_DOCKER || getarg("--docker");
const IS_MACOS = getarg("--macos");
const IS_ARM = getarg("--arm");

let PYTHON;

if (IS_DOCKER) {
    PYTHON = sh(python_version(true));
} else {
    PYTHON = sh(python_version());
}

const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);

/**
 * Using Perspective's docker images, create a wheel built for the image
 * architecture and output it to the local filesystem. A thin wrapper around
 * `bdist_wheel`, except it also automatically calls `auditwheel` (Linux) or
 * `delocate` on Mac.
 */

console.log("-- Copying assets to `dist` folder");
copy_files_to_python_folder();
const obj = sh.path`${__dirname}/../../python/perspective/dist/obj`;
clean(obj);

let cmd = sh();

// Create a wheel
if (IS_DOCKER) {
    // install deps
    cmd.sh`yum -y install wget libffi-devel`;

    // This always runs in docker for now so install boost
    cmd.sh(install_boost());

    // These are system deps that may only be in place from pep-517/518 so
    // lets reinstall them to be sure
    cmd.sh`${PYTHON} -m pip install  'numpy>=1.13.1' jupyter_packaging wheel twine auditwheel`;

    // remove the build folder so we completely rebuild (and pick up the
    // libs we just installed above, since this build method won't use
    // pep-517/518)
    cmd.sh`rm -rf build/`;

    // now build the wheel in place
    cmd.sh`${PYTHON} setup.py build_ext bdist_wheel`;

    // Use auditwheel on Linux - repaired wheels are in
    // `python/perspective/wheelhouse`.
    cmd.sh`${PYTHON} -m auditwheel -v show ./dist/*.whl`;
    cmd.sh`${PYTHON} -m auditwheel -v repair -L .lib ./dist/*.whl`;
} else if (IS_MACOS) {
    // Don't need to do any cleaning here since we will reuse the cmake
    // cache and numpy paths from the pep-517/518 build in build_python.js
    cmd.sh`${PYTHON} setup.py build_ext bdist_wheel ${
        IS_ARM && sh`--plat-name=macosx_11_0_arm64`
    }`;

    if (IS_ARM) {
        cmd.env({ CMAKE_OSX_ARCHITECTURES: "arm64" });
    } else {
        cmd.env({ CMAKE_OSX_ARCHITECTURES: "x86_64" });
    }

    cmd.sh`mkdir -p ./wheelhouse`;
    cmd.sh`cp -v ./dist/*.whl ./wheelhouse`;
} else {
    // Windows
    cmd.sh`${PYTHON} setup.py build_ext bdist_wheel`;
}

// TODO: MacOS wheel processed with delocate segfaults on
// `import perspective`.
if (IS_DOCKER) {
    console.log(`-- Building wheel for \`perspective-python\` in Docker`);

    sh.docker`${cmd.cwd("python/perspective")}`.log().runSync();
} else {
    console.log(`-- Building wheel for \`perspective-python\``);
    const python_path = sh.path`${__dirname}/../../python/perspective`;
    sh(cmd).cwd(python_path).log().runSync();
}
