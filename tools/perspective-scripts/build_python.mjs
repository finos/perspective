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

import * as url from "url";

import {
    default as sh,
    getarg,
    python_version,
    copy_files_to_python_folder,
} from "./sh_perspective.mjs";

const IS_CI = getarg("--ci");

// Use symlinks for C++ source rather than copying - handy for development
const LINK_CPP = getarg("--link-cpp");
const SETUP_ONLY = getarg("--setup-only");
const IS_INSTALL = getarg("--install");
const IS_PYODIDE = getarg("--pyodide");
const IS_DOCKER = process.env.PSP_DOCKER || getarg("--docker");
const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);

// Check that the `PYTHON` command is valid, else default to `python`.
let PYTHON = sh(python_version());
try {
    sh`${PYTHON} --version`.runSync();
} catch (e) {
    console.warn(`\`${PYTHON}\` not found - using \`python\` instead.`);
    PYTHON = sh`python`;
}

copy_files_to_python_folder(LINK_CPP);
if (SETUP_ONLY) {
    // don't execute any build steps, just copy
    // the C++ assets into the python folder
    process.exit(0);
}

let cmd;
if (IS_CI) {
    cmd = sh`${PYTHON} -m pip install -e .[dev] --no-clean`;
} else if (IS_INSTALL) {
    cmd = sh`${PYTHON} -m pip install .`;
} else if (IS_PYODIDE) {
    cmd = sh`pyodide build . --exports=pyinit`;
} else {
    cmd = sh`${PYTHON} setup.py build -v`;
}

if (IS_DOCKER) {
    sh.docker`${cmd.cwd("python/perspective")}`.runSync();
} else {
    const python_path = sh.path`${__dirname}/../../python/perspective`;
    sh`${cmd}`.cwd(python_path).log().runSync();
}
